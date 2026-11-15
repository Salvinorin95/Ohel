// "This week on the map": the coming Shabbat's Torah and haftarah readings (Israel calendar, from Hebcal,
// CC BY 4.0) and the places on Ohel's map that those verses mention.
import { findBook, parseRef } from "../shared/books.ts";
import type { WeekInfo } from "../shared/protocol.ts";

interface Span {
  book: string;
  from: [number, number];
  to: [number, number];
}

/** "Genesis 28:10-32:3", "Numbers 28:9-15" or "I Kings 18:46-19:21" → a span; anything else → null. */
export function parseSpan(s: string): Span | null {
  const m = /^(.+?)\s+(\d+):(\d+)\s*-\s*(?:(\d+):)?(\d+)$/.exec(s.trim());
  if (!m) return null;
  const book = findBook(m[1])?.key;
  if (!book) return null;
  const c1 = Number(m[2]);
  return { book, from: [c1, Number(m[3])], to: [m[4] ? Number(m[4]) : c1, Number(m[5])] };
}

const before = (a: [number, number], b: [number, number]) => a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]);

/** Does a ref ("Genesis 31:21" or a whole chapter, "Genesis 31") fall inside the span? */
function inSpan(ref: string, sp: Span) {
  const r = parseRef(ref);
  if (!r || r.book !== sp.book) return false;
  if (r.verse) return before(sp.from, [r.chapter, r.verse]) && before([r.chapter, r.verse], sp.to);
  return r.chapter >= sp.from[0] && r.chapter <= sp.to[0];
}

/** Places whose verses fall in the readings, most mentioned first. */
export function placesIn(spans: Span[], index: Record<string, { refs?: string[] }>) {
  const out: { id: string; n: number }[] = [];
  for (const [id, p] of Object.entries(index)) {
    // A whole-chapter ref ("Genesis 32") only counts when the place has no exact verse in that chapter:
    // the Jabbok is in Genesis 32, but at verse 23, after Vayetzei ends at 32:3.
    const refs = p.refs ?? [];
    const exact = new Set(refs.map(parseRef).filter((r) => r?.verse).map((r) => `${r!.book} ${r!.chapter}`));
    const n = refs.filter((r) => (parseRef(r)?.verse || !exact.has(r)) && spans.some((sp) => inSpan(r, sp))).length;
    if (n) out.push({ id, n });
  }
  return out.sort((a, b) => b.n - a.n).slice(0, 10);
}

const stripNiqqud = (s: string) => s.replace(/[֑-ׇ]/g, "");
const israelDay = (t = Date.now()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(t);

interface HebcalItem {
  date: string;
  type?: string;
  name: { en: string; he: string };
  summary?: string;
  haftara?: string;
  fullkriyah?: unknown;
}

/** This week's readings and places, cached at the edge for 6 hours. */
export async function week(origin: string, assets: Fetcher, ctx: ExecutionContext): Promise<WeekInfo | null> {
  const start = israelDay();
  const key = new Request(`${origin}/__week/${start}`);
  const cache = caches.default;
  const hit = await cache.match(key);
  if (hit) return (await hit.json()) as WeekInfo;

  const end = israelDay(Date.now() + 7 * 86_400_000);
  const res = await fetch(`https://www.hebcal.com/leyning?cfg=json&i=on&start=${start}&end=${end}`, {
    headers: { "user-agent": "OhelBibleApp/0.1 (educational, non-commercial)" },
  });
  if (!res.ok) return null;
  const items = ((await res.json()) as { items?: HebcalItem[] }).items ?? [];
  const it = items.find((i) => i.type === "shabbat" && i.fullkriyah) ?? items.find((i) => i.fullkriyah && new Date(`${i.date}T12:00:00Z`).getUTCDay() === 6);
  if (!it?.summary) return null;
  const split = (s?: string) => (s ?? "").split(/[;,]\s*/).map((x) => x.trim()).filter(Boolean);
  const torah = split(it.summary);
  const haftarah = split(it.haftara);
  const spans = [...torah, ...haftarah].map(parseSpan).filter((x): x is Span => !!x);
  const idx = await assets.fetch(new Request(`${origin}/data/places/index.json`));
  const index = idx.ok ? ((await idx.json()) as Record<string, { refs?: string[] }>) : {};
  const info: WeekInfo = {
    date: it.date,
    name: { he: stripNiqqud(it.name.he), en: it.name.en },
    torah,
    haftarah,
    places: placesIn(spans, index),
  };
  ctx.waitUntil(cache.put(key, new Response(JSON.stringify(info), { headers: { "cache-control": "public, max-age=21600" } })));
  return info;
}
