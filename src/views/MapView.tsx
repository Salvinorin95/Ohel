import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AttributionControl, Map as MLMap, Marker, NavigationControl, setWorkerUrl, type GeoJSONSource, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { PLACES, findPlace, type Place } from "../../shared/places.ts";
import { refLabel } from "../../shared/books.ts";
import type { MapView as View } from "../../shared/protocol.ts";
import { postVisit } from "../api.ts";
import type { Key } from "../i18n.ts";
import { useApp } from "../state.tsx";
import { REALMS, type RealmId } from "../../shared/placeInfo.ts";
import { loadRealms, realmColor, usePlaceIndex, yearLabel } from "../placeData.ts";
import { PlacePage } from "./PlacePage.tsx";
import { findJourney, JOURNEYS, type Journey } from "../../shared/journeys.ts";
import { boundsOf, hideJourney, legKm, legsOf, setDone, showJourney, stopName, stopPoint, travel } from "./journeyMap.ts";

setWorkerUrl(workerUrl);

const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";
const DEM = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

const STYLE: StyleSpecification = {
  version: 8,
  sources: {
    sat: { type: "raster", tiles: [`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`], tileSize: 256, maxzoom: 19, attribution: "Imagery © Esri, Maxar, Earthstar Geographics" },
    topo: { type: "raster", tiles: [`${ESRI}/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`], tileSize: 256, maxzoom: 19, attribution: "© Esri, HERE, Garmin, USGS" },
    dem: { type: "raster-dem", tiles: [DEM], tileSize: 256, maxzoom: 15, encoding: "terrarium", attribution: "Terrain: Mapzen, AWS Open Data" },
    shade: { type: "raster-dem", tiles: [DEM], tileSize: 256, maxzoom: 15, encoding: "terrarium" },
  },
  layers: [
    { id: "sat", type: "raster", source: "sat", paint: { "raster-saturation": 0.22, "raster-contrast": 0.08 } },
    { id: "topo", type: "raster", source: "topo", layout: { visibility: "none" } },
    {
      id: "hill", type: "hillshade", source: "shade", layout: { visibility: "none" },
      paint: { "hillshade-exaggeration": 0.45, "hillshade-shadow-color": "#3b1366", "hillshade-highlight-color": "#fff3c4", "hillshade-accent-color": "#5b21b6" },
    },
  ],
  sky: {
    "sky-color": "#1b0b40", "horizon-color": "#ff86dc", "fog-color": "#3a1670",
    "sky-horizon-blend": 0.55, "horizon-fog-blend": 0.6, "fog-ground-blend": 0.35, "atmosphere-blend": 0.75,
  },
  terrain: { source: "dem", exaggeration: 1.6 },
};

const visitedThisSession = new Set<string>();

export interface MapProps {
  place?: string;
  view?: View & { nonce?: number };
  embedded?: boolean;
  onShareView?: (v: View) => void;
  onSharePlace?: (id: string) => void;
  onOpenRef?: (ref: string) => void;
  onTalk?: (id: string) => void;
  onSelect?: (id: string | null) => void;
  /** Open this place's page straight away (the /place/<id> address). */
  openPage?: boolean;
  /** Called when a place page opens (id) or closes (null), so the address can follow. */
  onPage?: (id: string | null) => void;
  /** Start this journey when the map opens (the /journey/<id> address). */
  journey?: string;
  onJourney?: (id: string | null) => void;
}

export function MapView({ place, view, embedded, onShareView, onSharePlace, onOpenRef, onTalk, onSelect, openPage, onPage, journey: journeyId, onJourney }: MapProps) {
  const { t, lang, token, celebrate } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markers = useRef(new Map<string, { marker: Marker; el: HTMLButtonElement }>());
  const [mapError, setMapError] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  const [sat, setSat] = useState(true);
  const [three, setThree] = useState(true);
  const [selected, setSelected] = useState<string | null>(place ?? null);
  const [list, setList] = useState(false);
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(false);
  const [page, setPage] = useState<string | null>(openPage && findPlace(place) ? place! : null);
  const [realm, setRealm] = useState<{ id: RealmId; year: number; back: string | null } | null>(null);
  const index = usePlaceIndex();
  const selectRef = useRef<(id: string | null, fly?: boolean) => void>(() => {});
  // A journey being travelled: which one, which stop (-1 = the whole route), playing on its own or not.
  const [jour, setJour] = useState<Journey | null>(null);
  const [step, setStep] = useState(-1);
  const [auto, setAuto] = useState(false);
  const [moving, setMoving] = useState(false);
  const [jlist, setJlist] = useState(false);
  const travelStop = useRef<() => void>(() => {});
  const stopMarkers = useRef<Marker[]>([]);
  const journeyIds = useRef<Set<string> | null>(null);
  const journeyHere = useRef<string | null>(null);

  // Create the map once.
  useEffect(() => {
    if (mapError) return;
    const p = findPlace(place);
    let map: MLMap;
    try {
    map = new MLMap({
      container: box.current!,
      style: STYLE,
      center: p ? [p.lng, p.lat] : [35.25, 31.85],
      zoom: p ? p.zoom - 0.6 : 7.1,
      pitch: p ? 60 : 40,
      bearing: p ? -18 : 0,
      maxPitch: 80,
      attributionControl: false,
      fadeDuration: 0,
    });
    } catch {
      setMapError(true);
      return;
    }
    const loadingDeadline = setTimeout(() => { if (!map.loaded()) setMapError(true); }, 15_000);
    map.on("error", () => setMapError(true));
    map.once("load", () => clearTimeout(loadingDeadline));
    map.addControl(new NavigationControl({ visualizePitch: true, showCompass: true }), lang === "he" ? "top-left" : "top-right");
    map.addControl(new AttributionControl({ compact: true }), "bottom-right");
    const labelZoom = () => box.current?.classList.toggle("labels", map.getZoom() >= 8.6);
    map.on("zoom", labelZoom);
    map.on("load", labelZoom);
    mapRef.current = map;
    const ro = new ResizeObserver(() => {
      map.resize();
      setVisible((box.current?.clientWidth ?? 0) > 0);
    });
    ro.observe(box.current!);
    return () => {
      clearTimeout(loadingDeadline);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapAttempt, mapError]);

  // Place markers, rebuilt when the language changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const { marker } of markers.current.values()) marker.remove();
    markers.current.clear();
    for (const p of PLACES) {
      const el = document.createElement("button");
      el.className = `pin pin-${p.certainty}`;
      el.setAttribute("aria-label", p[lang]);
      el.innerHTML = `<span class="pin-dot"></span><span class="pin-label" dir="auto"></span>`;
      (el.querySelector(".pin-label") as HTMLElement).textContent = p[lang];
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        selectRef.current(p.id, true);
      });
      const marker = new Marker({ element: el, anchor: "center" }).setLngLat([p.lng, p.lat]).addTo(map);
      markers.current.set(p.id, { marker, el });
    }
    for (const [id, { el }] of markers.current) el.classList.toggle("on", id === selected);
    declutterRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, mapAttempt, mapError]);

  // Keep a crowded map readable: where dots or labels would sit on top of each other, the selected place wins,
  // then the bigger places (minor ones give way), then the list order. Zooming in brings the rest back.
  const declutter = () => {
    const map = mapRef.current;
    if (!map || !markers.current.size) return;
    // On a journey every stop is labelled at any zoom (the current stop first); otherwise labels start at zoom 8.6.
    const showLabels = map.getZoom() >= 8.6 || !!journeyIds.current;
    const first = (p: Place) => Number(p.id === selected || p.id === journeyHere.current);
    const order = [...PLACES].sort((a, b) => first(b) - first(a) || Number(!!a.minor) - Number(!!b.minor));
    type Box = [number, number, number, number];
    const hit = (a: Box, b: Box) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
    const dots: Box[] = [];
    const taken: Box[] = [];
    for (const p of order) {
      const m = markers.current.get(p.id);
      if (!m) continue;
      if (journeyIds.current && !journeyIds.current.has(p.id)) continue;
      const { x, y } = map.project([p.lng, p.lat]);
      const dot: Box = [x - 9, y - 9, x + 9, y + 9];
      const keep = first(p) === 1 || !dots.some((d) => hit(d, dot));
      m.el.classList.toggle("crowded", !keep);
      if (!keep) continue;
      dots.push(dot);
      taken.push(dot);
      if (!showLabels) continue;
      const w = p[lang].length * (lang === "he" ? 7 : 6.6) + 18;
      const label: Box = [x - w / 2, y + 10, x + w / 2, y + 31];
      const fits = first(p) === 1 || !taken.some((d) => hit(d, label));
      m.el.classList.toggle("nolabel", !fits);
      if (fits) taken.push(label);
    }
  };
  const declutterRef = useRef(declutter);
  declutterRef.current = declutter;
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => declutterRef.current());
    };
    map.on("moveend", run);
    map.on("load", run);
    map.on("resize", run);
    run();
    return () => {
      cancelAnimationFrame(raf);
      map.off("moveend", run);
      map.off("load", run);
      map.off("resize", run);
    };
  }, [mapAttempt, mapError]);
  useEffect(() => declutterRef.current(), [selected]);

  const flyTo = (p: Place) => {
    const h = box.current?.clientHeight ?? 600;
    mapRef.current?.flyTo({
      center: [p.lng, p.lat], zoom: p.zoom, pitch: three ? 62 : 0, bearing: three ? -20 : 0, duration: 2800, essential: true,
      padding: { top: 40, bottom: Math.min(300, h * 0.42), left: 0, right: 0 },
    });
  };

  const select = (id: string | null, fly = false) => {
    setSelected(id);
    setPage((pg) => (pg && id ? id : null));
    onSelect?.(id);
    for (const [pid, { el }] of markers.current) el.classList.toggle("on", pid === id);
    const p = findPlace(id);
    if (!p) return;
    if (fly) flyTo(p);
  };
  selectRef.current = select;

  // Follow the place / shared view the parent asks for.
  useEffect(() => {
    if (place) select(place, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place]);
  // The address and the tab title follow what is open: /place/<id> for a page, /map/<id> for a pin.
  useEffect(() => {
    if (page) onPage?.(page);
    else if (jour) onJourney?.(jour.id);
    else if (selected) onSelect?.(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
  useEffect(() => {
    if (embedded) return;
    const p = findPlace(page ?? selected);
    document.title = p ? `${p[lang]} · ${page ? (lang === "he" ? "בתנ״ך" : "in the Bible") : t("navMap")} · Ohel` : `${t("navMap")} · Ohel`;
  }, [page, selected, lang, embedded, t]);
  useEffect(() => {
    if (!view || !mapRef.current) return;
    setSat(view.sat);
    mapRef.current.flyTo({ center: [view.lng, view.lat], zoom: view.zoom, pitch: view.pitch, bearing: view.bearing, duration: 2600, essential: true });
  }, [view]);

  // Style toggles.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      map.setLayoutProperty("sat", "visibility", sat ? "visible" : "none");
      map.setLayoutProperty("topo", "visibility", sat ? "none" : "visible");
      map.setLayoutProperty("hill", "visibility", sat ? "none" : "visible");
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [sat, mapAttempt, mapError]);

  // ── journeys: a route drawn stop by stop, the camera travelling with it ──
  const panelPad = () => {
    const h = box.current?.clientHeight ?? 600;
    return { top: 70, bottom: Math.min(300, h * 0.42), left: 30, right: 30 };
  };
  const markJourneyPins = (j: Journey | null, here: string | null) => {
    journeyIds.current = j ? new Set(j.stops.map((s) => s.place).filter((x): x is string => !!x)) : null;
    journeyHere.current = here;
    for (const [id, { el }] of markers.current) {
      el.classList.toggle("in-journey", !!journeyIds.current?.has(id));
      el.classList.toggle("journey-here", id === here);
    }
    declutterRef.current();
  };
  const startJourney = (j: Journey) => {
    const map = mapRef.current;
    if (!map) return;
    travelStop.current();
    setList(false);
    setJlist(false);
    setPage(null);
    hideRealm();
    select(null);
    setJour(j);
    setStep(-1);
    setAuto(false);
    onJourney?.(j.id);
    const draw = () => {
      showJourney(map, j);
      for (const m of stopMarkers.current) m.remove();
      stopMarkers.current = j.stops
        .filter((s) => !s.place && s.at)
        .map((s) => {
          const el = document.createElement("div");
          el.className = "pin pin-traditional in-journey pin-point";
          el.innerHTML = `<span class="pin-dot"></span><span class="pin-label" dir="auto"></span>`;
          (el.querySelector(".pin-label") as HTMLElement).textContent = s.at![lang];
          return new Marker({ element: el, anchor: "center" }).setLngLat([s.at!.lng, s.at!.lat]).addTo(map);
        });
      markJourneyPins(j, null);
      map.fitBounds(boundsOf(j), { padding: panelPad(), pitch: 35, bearing: 0, maxZoom: 9, duration: 2200, essential: true, absolutePadding: true });
    };
    if (map.isStyleLoaded()) draw();
    else map.once("idle", draw);
  };
  const goStep = (i: number) => {
    const map = mapRef.current;
    if (!map || !jour || i < 0 || i >= jour.stops.length) return;
    travelStop.current();
    const legs = legsOf(jour);
    const before = legs.slice(0, i).flatMap((l, k) => (k ? l.slice(1) : l));
    const s = jour.stops[i];
    const [lng, lat] = stopPoint(s);
    // Walking on to the next stop draws the leg as the camera flies; jumping around just shows the route so far.
    const forward = i === step + 1 && i > 0;
    const km = legKm(legs[i]);
    const ms = forward ? Math.min(6500, Math.max(2600, 1600 + km * 4)) : 2200;
    setStep(i);
    setMoving(true);
    markJourneyPins(jour, s.place ?? null);
    const far = km > 400 || !findPlace(s.place) || ["ur", "haran", "babylon", "riblah", "goshen", "raamses", "redsea", "sinai"].includes(s.place ?? "");
    map.flyTo({ center: [lng, lat], zoom: far ? 7.2 : 9.6, pitch: three ? 55 : 0, bearing: three ? -12 : 0, duration: ms, essential: true, padding: panelPad() });
    if (forward) {
      travelStop.current = travel(map, before, legs[i], ms, () => setMoving(false));
    } else {
      setDone(map, [...before, ...(i ? legs[i].slice(1) : legs[i])]);
      const t = setTimeout(() => setMoving(false), ms);
      travelStop.current = () => clearTimeout(t);
    }
  };
  const endJourney = () => {
    travelStop.current();
    const map = mapRef.current;
    if (map) hideJourney(map);
    for (const m of stopMarkers.current) m.remove();
    stopMarkers.current = [];
    setJour(null);
    setStep(-1);
    setAuto(false);
    setMoving(false);
    markJourneyPins(null, null);
    onJourney?.(null);
  };
  // Playing: wait at each stop long enough to read it, then travel on.
  useEffect(() => {
    if (!auto || !jour || moving) return;
    if (step >= jour.stops.length - 1) return setAuto(false);
    const t = setTimeout(() => goStep(step + 1), step < 0 ? 600 : 6500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, jour, step, moving]);
  // Opened at /journey/<id>.
  useEffect(() => {
    const j = findJourney(journeyId);
    if (j && j.id !== jour?.id) startJourney(j);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyId]);
  // Custom stop labels follow the language.
  useEffect(() => {
    if (jour) for (const [k, m] of stopMarkers.current.entries()) {
      const s = jour.stops.filter((x) => !x.place && x.at)[k];
      const el = m.getElement().querySelector(".pin-label");
      if (s && el) el.textContent = s.at![lang];
    }
  }, [lang, jour]);

  // ── who ruled here: a realm's borders drawn on the map ──
  const realmLayers = (map: MLMap, show: boolean) => {
    for (const l of ["realm-fill", "realm-line"]) if (map.getLayer(l)) map.setLayoutProperty(l, "visibility", show ? "visible" : "none");
  };
  const showRealm = async (id: RealmId) => {
    const map = mapRef.current;
    const f = (await loadRealms()).get(id);
    if (!map || !f) return;
    const color = realmColor(id);
    const apply = () => {
      const data = f as unknown as Parameters<GeoJSONSource["setData"]>[0];
      const src = map.getSource("realm") as GeoJSONSource | undefined;
      if (src) src.setData(data);
      else {
        map.addSource("realm", { type: "geojson", data });
        map.addLayer({ id: "realm-fill", type: "fill", source: "realm", paint: { "fill-color": color, "fill-opacity": 0.24 } });
        map.addLayer({ id: "realm-line", type: "line", source: "realm", paint: { "line-color": color, "line-width": 2.6, "line-blur": 0.8 } });
      }
      map.setPaintProperty("realm-fill", "fill-color", color);
      map.setPaintProperty("realm-line", "line-color", color);
      realmLayers(map, true);
    };
    if (map.isStyleLoaded()) apply();
    else map.once("idle", apply);
    let [w, so, e, n] = [180, 90, -180, -90];
    for (const poly of f.geometry.coordinates) for (const [x, y] of poly[0]) (w = Math.min(w, x)), (e = Math.max(e, x)), (so = Math.min(so, y)), (n = Math.max(n, y));
    const h = box.current?.clientHeight ?? 600;
    // On phones the place card is hidden while a realm shows (styles.css), so leave room only for the realm chip.
    const narrow = (box.current?.clientWidth ?? 1000) <= 600;
    map.fitBounds([[w, so], [e, n]], {
      padding: { top: narrow ? 130 : 76, bottom: selected && !narrow ? Math.min(280, h * 0.4) : 40, left: 30, right: 30 },
      // absolutePadding: replace the padding a place's flyTo left on the map (bottom ~290 px) instead of adding to it,
      // which squeezed tall realms like Assyria down to a whole-world view.
      pitch: 0, bearing: 0, maxZoom: 8, duration: 2400, essential: true, absolutePadding: true,
    });
    setRealm({ id, year: f.properties.year, back: page });
    setPage(null);
  };
  const hideRealm = () => {
    if (mapRef.current) realmLayers(mapRef.current, false);
    setRealm(null);
  };

  const toggle3d = () => {
    const map = mapRef.current;
    if (!map) return;
    const next = !three;
    setThree(next);
    map.setTerrain(next ? { source: "dem", exaggeration: 1.6 } : null);
    map.easeTo({ pitch: next ? 60 : 0, bearing: next ? map.getBearing() : 0, duration: 900 });
  };

  const shareView = () => {
    const map = mapRef.current;
    if (!map || !onShareView) return;
    const c = map.getCenter();
    onShareView({
      lng: +c.lng.toFixed(5), lat: +c.lat.toFixed(5), zoom: +map.getZoom().toFixed(2),
      pitch: +map.getPitch().toFixed(1), bearing: +map.getBearing().toFixed(1), sat,
    });
  };

  // A visit counts once the person can actually see the place (not while the map hides behind the chat).
  useEffect(() => {
    if (!visible || !selected || !token || visitedThisSession.has(selected)) return;
    const id = selected;
    visitedThisSession.add(id);
    postVisit(token, id)
      .then((r) => celebrate(r.award, "place"))
      .catch(() => visitedThisSession.delete(id));
  }, [visible, selected, token, celebrate]);

  const sel = findPlace(selected);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return PLACES.filter((p) => !s || p.en.toLowerCase().includes(s) || p.he.includes(s));
  }, [q]);

  if (mapError) return (
    <div className="map-fallback glass" role="region" aria-label={t("places")}>
      <p role="status">{t("mapUnavailable")}</p>
      <button className="btn small" onClick={() => { setMapError(false); setMapAttempt(a => a + 1); }}>{t("retry")}</button>
      <label className="field"><span>{t("searchPlaces")}</span><input value={q} onChange={e => setQ(e.target.value)} dir="auto" /></label>
      <div className="room-grid">
        {filtered.map(p => <article className="glass card" key={p.id}>
          <h3>{p[lang]}</h3><span className={`pill pill-${p.certainty}`}>{t(`certainty_${p.certainty}` as Key)}</span>
          <p>{p.story[lang]}</p>
          <div className="place-actions">{p.refs.map(r => <button key={r} className="chip" onClick={() => onOpenRef?.(r)}>{refLabel(r, lang)}</button>)}
          <button className="btn small" onClick={() => setPage(p.id)}>{t("moreAbout")}</button></div>
        </article>)}
      </div>
      {page && <PlacePage id={page} onClose={() => setPage(null)} onShowRealm={() => {}} onOpenRef={onOpenRef} onSelectPlace={setPage} />}
    </div>
  );

  return (
    <div className={`mapwrap${embedded ? " embedded" : ""}${realm ? " has-realm" : ""}${jour ? " journey-on" : ""}`}>
      <div ref={box} className="map" />

      <div className="map-tools">
        <div className="seg glass">
          <button className={sat ? "on" : ""} onClick={() => setSat(true)}>🛰️ {t("satellite")}</button>
          <button className={!sat ? "on" : ""} onClick={() => setSat(false)}>⛰️ {t("terrain")}</button>
        </div>
        <button className={three ? "btn glass small on" : "btn glass small"} onClick={toggle3d}>
          {t("view3d")}
        </button>
        <button className="btn glass small" onClick={() => (setList(!list), setJlist(false))}>
          📍 {t("places")}
        </button>
        {!embedded && (
          <button className={jlist || jour ? "btn glass small on" : "btn glass small"} onClick={() => (setJlist(!jlist), setList(false))}>
            🧭 {t("journeys")}
          </button>
        )}
        {onShareView && (
          <button className="btn btn-glow small" onClick={shareView}>
            💬 {t("shareView")}
          </button>
        )}
      </div>

      {list && (
        <div className="place-list glass">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaces")} dir="auto" autoFocus />
          <div className="place-list-items">
            {filtered.map((p) => (
              <button
                key={p.id}
                className={p.id === selected ? "place-item on" : "place-item"}
                onClick={() => {
                  select(p.id, true);
                  setList(false);
                }}
              >
                <span className={`dot dot-${p.certainty}`} />
                {p[lang]}
              </button>
            ))}
          </div>
        </div>
      )}

      {jlist && (
        <div className="place-list journey-list glass">
          {JOURNEYS.map((j) => (
            <button key={j.id} className={jour?.id === j.id ? "place-item on" : "place-item"} onClick={() => startJourney(j)}>
              <span className="dot" style={{ background: j.color }} />
              <span>
                <b>{j[lang]}</b>
                <span className="muted small journey-list-sub">{j.stops.length} {t("journeyStops")}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {jour && (
        <div className="journey-panel glass" style={{ "--journey": jour.color } as CSSProperties}>
          <div className="journey-head">
            <div>
              <span className="journey-kicker">🧭 {jour[lang]}</span>
              <h3 dir="auto">{step < 0 ? t("journeyRoute") : stopName(jour.stops[step], lang)}</h3>
            </div>
            <button className="icon-btn" onClick={endJourney} aria-label={t("close")}>
              ×
            </button>
          </div>
          <p className="journey-text" dir="auto">
            {step < 0 ? jour.intro[lang] : jour.stops[step][lang]}
          </p>
          <div className="journey-dots">
            {jour.stops.map((s, i) => (
              <button key={i} className={i === step ? "on" : i < step ? "past" : ""} onClick={() => (setAuto(false), goStep(i))} aria-label={stopName(s, lang)} title={stopName(s, lang)} />
            ))}
          </div>
          <div className="place-actions">
            <button className="btn small" disabled={step <= 0} onClick={() => (setAuto(false), goStep(step - 1))} aria-label={t("journeyPrev")}>
              {lang === "he" ? "→" : "←"}
            </button>
            {step < jour.stops.length - 1 && (
              <button className="btn btn-glow small" onClick={() => (auto ? setAuto(false) : step < 0 ? setAuto(true) : (setAuto(false), goStep(step + 1)))}>
                {auto ? `⏸ ${t("journeyPause")}` : step < 0 ? `▶ ${t("journeyPlay")}` : `${t("journeyNext")} ${lang === "he" ? "←" : "→"}`}
              </button>
            )}
            {step >= 0 && !auto && step < jour.stops.length - 1 && (
              <button className="btn small" onClick={() => setAuto(true)}>
                ▶ {t("journeyPlay")}
              </button>
            )}
            {step >= 0 && (
              <button className="chip" onClick={() => onOpenRef?.(jour.stops[step].ref)}>
                📖 {refLabel(jour.stops[step].ref, lang)}
              </button>
            )}
            {step >= 0 && jour.stops[step].place && (
              <button className="chip chip-place" onClick={() => setPage(jour.stops[step].place!)}>
                📜 {t("weekPlacePage")}
              </button>
            )}
          </div>
        </div>
      )}

      {sel && !jour && (
        <div className={index[sel.id]?.cover ? "place-card glass has-img" : "place-card glass"} key={sel.id}>
          {index[sel.id]?.cover && <img className="place-card-img" src={index[sel.id].cover} alt="" loading="lazy" onClick={() => setPage(sel.id)} />}
          <div className="place-card-head">
            <div>
              <h3>{sel[lang]}</h3>
              <span className={`pill pill-${sel.certainty}`}>{t(`certainty_${sel.certainty}` as Key)}</span>
            </div>
            <button className="icon-btn" onClick={() => select(null)} aria-label={t("close")}>
              ×
            </button>
          </div>
          <p className="story">{sel.story[lang]}</p>
          <div className="ref-chips">
            {sel.refs.map((r) => (
              <button key={r} className="chip chip-ref" onClick={() => onOpenRef?.(r)}>
                📖 {refLabel(r, lang)}
              </button>
            ))}
          </div>
          <div className="place-actions">
            {index[sel.id] && (
              <button className="btn btn-glow small" onClick={() => setPage(sel.id)}>
                📜 {t("moreAbout")}
              </button>
            )}
            <button className="btn small" onClick={() => flyTo(sel)}>
              🕊️ {t("flyHere")}
            </button>
            {onSharePlace && (
              <button className="btn btn-glow small" onClick={() => onSharePlace(sel.id)}>
                💬 {t("sharePlace")}
              </button>
            )}
            {onTalk && (
              <button className="btn btn-glow small" onClick={() => onTalk(sel.id)}>
                💬 {t("talkHere")}
              </button>
            )}
          </div>
        </div>
      )}

      {realm && (
        <div className="realm-chip glass" style={{ "--realm": realmColor(realm.id) } as CSSProperties}>
          <span className="realm-swatch" />
          <div>
            <b>{REALMS[realm.id][lang]}</b>
            <span className="fine">
              {t("realmBorders")} {yearLabel(realm.year, lang)} · {t("realmSource")}
            </span>
          </div>
          {realm.back && findPlace(realm.back) && (
            <button className="btn small" onClick={() => setPage(realm.back)}>
              ↩ {findPlace(realm.back)![lang]}
            </button>
          )}
          <button className="icon-btn" onClick={hideRealm} aria-label={t("close")}>
            ×
          </button>
        </div>
      )}

      {page && (
        <PlacePage
          id={page}
          onClose={() => setPage(null)}
          onShowRealm={(r) => void showRealm(r)}
          onOpenRef={onOpenRef}
          onSelectPlace={(id) => {
            select(id, true);
            setPage(id);
          }}
        />
      )}
    </div>
  );
}
