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
}

export function MapView({ place, view, embedded, onShareView, onSharePlace, onOpenRef, onTalk, onSelect, openPage, onPage }: MapProps) {
  const { t, lang, token, celebrate } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markers = useRef(new Map<string, { marker: Marker; el: HTMLButtonElement }>());
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

  // Create the map once.
  useEffect(() => {
    const p = findPlace(place);
    const map = new MLMap({
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
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Place markers, rebuilt when the language changes.
  useEffect(() => {
    const map = mapRef.current!;
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
  }, [lang]);

  // Keep a crowded map readable: where dots or labels would sit on top of each other, the selected place wins,
  // then the bigger places (minor ones give way), then the list order. Zooming in brings the rest back.
  const declutter = () => {
    const map = mapRef.current;
    if (!map || !markers.current.size) return;
    const showLabels = map.getZoom() >= 8.6;
    const order = [...PLACES].sort((a, b) => Number(b.id === selected) - Number(a.id === selected) || Number(!!a.minor) - Number(!!b.minor));
    type Box = [number, number, number, number];
    const hit = (a: Box, b: Box) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
    const dots: Box[] = [];
    const taken: Box[] = [];
    for (const p of order) {
      const m = markers.current.get(p.id);
      if (!m) continue;
      const { x, y } = map.project([p.lng, p.lat]);
      const dot: Box = [x - 9, y - 9, x + 9, y + 9];
      const keep = p.id === selected || !dots.some((d) => hit(d, dot));
      m.el.classList.toggle("crowded", !keep);
      if (!keep) continue;
      dots.push(dot);
      taken.push(dot);
      if (!showLabels) continue;
      const w = p[lang].length * (lang === "he" ? 7 : 6.6) + 18;
      const label: Box = [x - w / 2, y + 10, x + w / 2, y + 31];
      const fits = p.id === selected || !taken.some((d) => hit(d, label));
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
  }, []);
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
  }, [sat]);

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

  return (
    <div className={`mapwrap${embedded ? " embedded" : ""}${realm ? " has-realm" : ""}`}>
      <div ref={box} className="map" />

      <div className="map-tools">
        <div className="seg glass">
          <button className={sat ? "on" : ""} onClick={() => setSat(true)}>🛰️ {t("satellite")}</button>
          <button className={!sat ? "on" : ""} onClick={() => setSat(false)}>⛰️ {t("terrain")}</button>
        </div>
        <button className={three ? "btn glass small on" : "btn glass small"} onClick={toggle3d}>
          {t("view3d")}
        </button>
        <button className="btn glass small" onClick={() => setList(!list)}>
          📍 {t("places")}
        </button>
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

      {sel && (
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
