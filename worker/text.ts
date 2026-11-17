import { findBook, parseRef } from "../shared/books.ts";

const SEFARIA = "https://www.sefaria.org/api/v3/texts/";
const clean = (s: string) => s.replace(/&nbsp;|&thinsp;/g, " ").replace(/<[^>]+>/g, "").replace(/\s*\{[פס]\}\s*/g, " ").replace(/\s+/g, " ").trim();

/** Cache only validated public text. The longer-lived copy is used only on an upstream failure. */
export async function chapterText(req: Request, ctx: Pick<ExecutionContext, "waitUntil">,
  options: { cache?: Cache; fetcher?: typeof fetch; timeoutMs?: number } = {}) {
  const r = parseRef(new URL(req.url).searchParams.get("ref"));
  if (!r) return Response.json({ error: "bad_ref" }, { status: 400 });
  const book = findBook(r.book)!;
  const key = new Request(`https://ohel.cache/text/v3/${encodeURIComponent(book.key)}/${r.chapter}`);
  const staleKey = new Request(key.url + "/saved");
  const cache = options.cache ?? caches.default;
  const hit = await cache.match(key).catch(() => undefined);
  if (hit) return hit;
  try {
    const upstream = await (options.fetcher ?? fetch)(
      `${SEFARIA}${encodeURIComponent(book.key.replace(/ /g, "_"))}.${r.chapter}?version=hebrew&version=english&return_format=text_only`,
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(options.timeoutMs ?? 8000) },
    );
    if (!upstream.ok) throw new Error("upstream");
    const d = await upstream.json() as { heRef?: string; versions?: { language: string; versionTitle: string; license?: string; text: unknown }[] };
    if (!Array.isArray(d.versions)) throw new Error("invalid_text");
    const pick = (lang: string) => d.versions!.find(v => v.language === lang);
    const he = pick("he"), en = pick("en");
    const lines = (v?: { text: unknown }) => Array.isArray(v?.text) ? v.text.map(t => clean(String(t ?? ""))) : [];
    const body = { ref: `${book.key} ${r.chapter}`, heRef: d.heRef ?? "", he: lines(he), en: lines(en),
      sources: { he: he?.versionTitle ?? "", en: en?.versionTitle ?? "", enLicense: en?.license ?? "" } };
    if (!body.he.some(Boolean) && !body.en.some(Boolean)) throw new Error("empty_text");
    const res = Response.json(body, { headers: { "cache-control": "public, max-age=86400" } });
    ctx.waitUntil(Promise.all([
      cache.put(key, res.clone()),
      cache.put(staleKey, Response.json(body, { headers: { "cache-control": "public, max-age=2592000" } })),
    ]).then(() => undefined).catch(() => {}));
    return res;
  } catch {
    const saved = await cache.match(staleKey).catch(() => undefined);
    if (saved) {
      const body = await saved.json() as object;
      return Response.json({ ...body, cached: true }, { headers: { "cache-control": "no-store", "x-ohel-stale": "1" } });
    }
    return Response.json({ error: "upstream_unavailable" }, { status: 503, headers: { "retry-after": "30" } });
  }
}
