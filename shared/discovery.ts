import { BOOKS, parseRef, refString, type Ref } from "./books.ts";
import { PEOPLE } from "./people.ts";
import { PLACES } from "./places.ts";
import { JOURNEYS } from "./journeys.ts";

export type DiscoveryHit = { kind: "person" | "place" | "journey"; id: string; he: string; en: string } | { kind: "reference"; ref: Ref; he: string; en: string };
const normalized = (s: string) => s.normalize("NFKD").replace(/[\u0591-\u05C7]/g, "").replace(/[׳״'\"]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

/** Bilingual discovery over bundled content; no server query or private content indexing. */
export function discover(query: string): DiscoveryHit[] {
  const q = normalized(query).slice(0, 200);
  if (!q) return [];
  const hits: DiscoveryHit[] = [];
  let reference: Ref | null = null;
  for (const b of BOOKS) {
    for (const name of [b.key, b.en, b.he]) {
      const nameKey = normalized(name);
      if (!q.startsWith(nameKey + " ")) continue;
      const rest = q.slice(nameKey.length).trim().replace(/^פרק\s+/, "");
      reference = parseRef(`${b.key} ${rest}`);
      if (reference) break;
    }
    if (reference) break;
  }
  if (reference) {
    const b = BOOKS.find(b => b.key === reference!.book)!;
    hits.push({ kind: "reference", ref: reference, he: `${b.he} ${reference.chapter}${reference.verse ? `:${reference.verse}` : ""}`, en: refString(reference) });
  }
  const matches = (...parts: string[]) => parts.some(s => normalized(s).includes(q));
  for (const p of PEOPLE) if (matches(p.he, p.en)) hits.push({ kind: "person", id: p.id, he: p.he, en: p.en });
  for (const p of PLACES) {
    const linked = reference && p.refs.some(r => { const x = parseRef(r); return x?.book === reference!.book && x.chapter === reference!.chapter; });
    if (linked || matches(p.he, p.en, p.story.he, p.story.en, ...p.refs)) hits.push({ kind: "place", id: p.id, he: p.he, en: p.en });
  }
  for (const j of JOURNEYS) {
    const linked = reference && j.stops.some(s => { const x = parseRef(s.ref); return x?.book === reference!.book && x.chapter === reference!.chapter; });
    if (linked || matches(j.he, j.en, j.intro.he, j.intro.en, ...j.stops.flatMap(s => [s.he, s.en, s.ref]))) hits.push({ kind: "journey", id: j.id, he: j.he, en: j.en });
  }
  return hits.slice(0, 30);
}
