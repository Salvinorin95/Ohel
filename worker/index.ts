import { findBook, parseRef } from "../shared/books.ts";

export { Hub } from "./hub.ts";

const SEFARIA = "https://www.sefaria.org/api/v3/texts/";

function clean(s: string) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&thinsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s*\{[פס]\}\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** One chapter in Hebrew and English, from Sefaria, cached at the edge for a week. */
async function chapterText(req: Request, ctx: ExecutionContext) {
  const url = new URL(req.url);
  const r = parseRef(url.searchParams.get("ref"));
  if (!r) return Response.json({ error: "bad_ref" }, { status: 400 });
  const book = findBook(r.book)!;
  const key = new Request(`https://ohel.cache/text/v2/${encodeURIComponent(book.key)}/${r.chapter}`);
  const cache = caches.default;
  const hit = await cache.match(key);
  if (hit) return hit;

  const upstream = await fetch(
    `${SEFARIA}${encodeURIComponent(book.key.replace(/ /g, "_"))}.${r.chapter}?version=hebrew&version=english&return_format=text_only`,
    { headers: { accept: "application/json" } },
  );
  if (!upstream.ok) return Response.json({ error: "upstream", status: upstream.status }, { status: 502 });
  const d = (await upstream.json()) as {
    heRef?: string;
    versions?: { language: string; versionTitle: string; license?: string; text: unknown }[];
  };
  const pick = (lang: string) => d.versions?.find((v) => v.language === lang);
  const he = pick("he");
  const en = pick("en");
  const lines = (v?: { text: unknown }) => (Array.isArray(v?.text) ? (v!.text as unknown[]).map((t) => clean(String(t ?? ""))) : []);
  const body = {
    ref: `${book.key} ${r.chapter}`,
    heRef: d.heRef ?? "",
    he: lines(he),
    en: lines(en),
    sources: { he: he?.versionTitle ?? "", en: en?.versionTitle ?? "", enLicense: en?.license ?? "" },
  };
  const res = new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=86400" },
  });
  ctx.waitUntil(cache.put(key, new Response(JSON.stringify(body), { headers: { "content-type": "application/json", "cache-control": "public, max-age=604800" } })));
  return res;
}

export default {
  async fetch(req, env, ctx): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/api/text") return chapterText(req, ctx);
    if (url.pathname.startsWith("/api/")) {
      const headers = new Headers(req.headers);
      headers.set("x-ohel-ip", req.headers.get("cf-connecting-ip") ?? "");
      const stub = env.HUB.get(env.HUB.idFromName("ohel"));
      return stub.fetch(new Request(req, { headers }));
    }
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
