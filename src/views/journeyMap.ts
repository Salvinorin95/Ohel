// Drawing a journey on the map: the whole route faint and dashed, the part already travelled bright,
// and the leg being travelled growing in step with the camera.
import type { GeoJSONSource, Map as MLMap } from "maplibre-gl";
import type { Journey, JourneyStop } from "../../shared/journeys.ts";
import { findPlace } from "../../shared/places.ts";

type Pt = [number, number];

export const stopPoint = (s: JourneyStop): Pt => {
  const p = findPlace(s.place);
  return p ? [p.lng, p.lat] : [s.at!.lng, s.at!.lat];
};
export const stopName = (s: JourneyStop, lang: "he" | "en") => findPlace(s.place)?.[lang] ?? s.at?.[lang] ?? "";

/** legs[i] is the line from stop i-1 to stop i, through its `via` points (legs[0] is just the first stop). */
export function legsOf(j: Journey): Pt[][] {
  const out: Pt[][] = [];
  let prev: Pt | null = null;
  for (const s of j.stops) {
    const pt = stopPoint(s);
    out.push(prev ? [prev, ...(s.via ?? []), pt] : [pt]);
    prev = pt;
  }
  return out;
}

const dist = (a: Pt, b: Pt) => Math.hypot((a[0] - b[0]) * Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180)), a[1] - b[1]);
export const legKm = (leg: Pt[]) => leg.slice(1).reduce((s, p, i) => s + dist(leg[i], p), 0) * 111;

/** The first fraction f (0..1) of a line, by length. */
export function slice(line: Pt[], f: number): Pt[] {
  if (line.length < 2 || f >= 1) return line;
  const total = legKm(line) / 111;
  let left = total * Math.max(0, f);
  const out: Pt[] = [line[0]];
  for (let i = 1; i < line.length; i++) {
    const d = dist(line[i - 1], line[i]);
    if (d >= left) {
      const t = d ? left / d : 0;
      out.push([line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t, line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t]);
      return out;
    }
    out.push(line[i]);
    left -= d;
  }
  return out;
}

export function boundsOf(j: Journey): [Pt, Pt] {
  let [w, s, e, n] = [180, 90, -180, -90];
  for (const leg of legsOf(j)) for (const [x, y] of leg) (w = Math.min(w, x)), (e = Math.max(e, x)), (s = Math.min(s, y)), (n = Math.max(n, y));
  return [[w, s], [e, n]];
}

const line = (coords: Pt[]) =>
  ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords.length > 1 ? coords : [] } }) as Parameters<GeoJSONSource["setData"]>[0];

const LAYERS = ["journey-all", "journey-glow", "journey-done"];

export function showJourney(map: MLMap, j: Journey) {
  hideJourney(map);
  const all = legsOf(j).flatMap((l, i) => (i ? l.slice(1) : l));
  map.addSource("journey-all", { type: "geojson", data: line(all) });
  map.addSource("journey-done", { type: "geojson", data: line([]) });
  map.addLayer({ id: "journey-all", type: "line", source: "journey-all", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": j.color, "line-width": 2.8, "line-opacity": 0.8, "line-dasharray": [1.5, 1.6] } });
  map.addLayer({ id: "journey-glow", type: "line", source: "journey-done", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": j.color, "line-width": 12, "line-opacity": 0.35, "line-blur": 6 } });
  map.addLayer({ id: "journey-done", type: "line", source: "journey-done", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": j.color, "line-width": 4 } });
}

export function setDone(map: MLMap, coords: Pt[]) {
  (map.getSource("journey-done") as GeoJSONSource | undefined)?.setData(line(coords));
}

export function hideJourney(map: MLMap) {
  for (const l of LAYERS) if (map.getLayer(l)) map.removeLayer(l);
  for (const s of ["journey-all", "journey-done"]) if (map.getSource(s)) map.removeSource(s);
}

/** Grow the travelled line along `leg` over `ms`, starting from what was already travelled. Returns a stop function. */
export function travel(map: MLMap, before: Pt[], leg: Pt[], ms: number, done: () => void) {
  const t0 = performance.now();
  let raf = 0;
  const frame = (now: number) => {
    const k = Math.min(1, (now - t0) / ms);
    const eased = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    setDone(map, [...before, ...slice(leg, eased).slice(before.length ? 1 : 0)]);
    if (k < 1) raf = requestAnimationFrame(frame);
    else done();
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
