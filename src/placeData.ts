import { useEffect, useState } from "react";
import type { PlaceInfo, RealmId } from "../shared/placeInfo.ts";
import type { Lang } from "../shared/protocol.ts";

// Deep place pages and realm borders live as static files (public/data), loaded on demand.

export type PlaceIndex = Record<string, { cover?: string; images: number }>;

export interface RealmFeature {
  type: "Feature";
  properties: { id: RealmId; source: string; year: number; from: number; to: number };
  geometry: { type: "MultiPolygon"; coordinates: number[][][][] };
}

let indexP: Promise<PlaceIndex> | null = null;
const infoP = new Map<string, Promise<PlaceInfo>>();
let realmsP: Promise<Map<string, RealmFeature>> | null = null;

const getJson = <T,>(url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json() as Promise<T>;
  });

export const loadPlaceIndex = () => (indexP ??= getJson<PlaceIndex>("/data/places/index.json").catch(() => ({})));

export function loadPlaceInfo(id: string) {
  let p = infoP.get(id);
  if (!p) {
    p = getJson<PlaceInfo>(`/data/places/${encodeURIComponent(id)}.json`);
    p.catch(() => infoP.delete(id));
    infoP.set(id, p);
  }
  return p;
}

export const loadRealms = () =>
  (realmsP ??= getJson<{ features: RealmFeature[] }>("/data/realms.json")
    .then((d) => new Map(d.features.map((f) => [f.properties.id, f])))
    .catch(() => {
      realmsP = null;
      return new Map<string, RealmFeature>();
    }));

export function usePlaceIndex() {
  const [index, setIndex] = useState<PlaceIndex>({});
  useEffect(() => {
    let live = true;
    void loadPlaceIndex().then((i) => live && setIndex(i));
    return () => {
      live = false;
    };
  }, []);
  return index;
}

/** Steady colors per realm so the same empire always looks the same. */
const REALM_COLORS: Record<string, string> = {
  ur3: "#fde047", egypt_nk: "#fbbf24", hatti: "#f97316", philistia: "#fb7185", phoenicia: "#c084fc", israel: "#22d3ee",
  judah: "#5eead4", urartu: "#a3e635", elam: "#f472b6", assyria: "#ff5ecf", babylonia: "#60a5fa", persia: "#a78bfa",
};
export const realmColor = (id: string) => REALM_COLORS[id] ?? "#ff5ecf";

export function yearLabel(y: number, lang: Lang) {
  const a = Math.abs(y);
  if (y < 0) return lang === "he" ? `${a} לפנה״ס` : `${a} BCE`;
  if (y < 1000) return lang === "he" ? `${a} לספירה` : `${a} CE`;
  return String(y);
}
