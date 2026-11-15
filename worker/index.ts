import { findBook, parseRef, refLabel } from "../shared/books.ts";
import { findPlace } from "../shared/places.ts";
import type { RoomInfo } from "../shared/protocol.ts";

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

// ── link previews ─────────────────────────────────────────────────────
// WhatsApp, Telegram and friends don't run JavaScript, so each page gets its own title,
// description and picture written into the HTML before it leaves.

interface Meta {
  title: string;
  description: string;
  image?: { url: string; width?: number; height?: number };
}

const HOME: Meta = {
  title: "אוהל · Ohel: לומדים תנ״ך ביחד",
  description:
    "אוהל פתוח לתנ״ך: לקרוא, לראות על מפת לוויין ולדבר על זה ביחד. An open tent for the Bible: read it, see it on the map, talk it through together.",
};

const clip = (s: string, n: number) => ([...s].length > n ? `${[...s].slice(0, n - 1).join("").trimEnd()}…` : s);

async function metaFor(url: URL, env: Env): Promise<Meta> {
  const p = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (p[0] === "room" && p[1] && /^[\w-]{1,40}$/.test(p[1])) {
    const res = await env.HUB.get(env.HUB.idFromName("ohel")).fetch(`https://hub/api/rooms/${p[1]}`);
    if (!res.ok) return HOME;
    const r = (await res.json()) as RoomInfo;
    const he = r.title_he || r.title;
    const ref = r.ref ? `${refLabel(r.ref, "he")} · ` : "";
    return {
      title: `${clip(he, 70)} · אוהל`,
      description: `${ref}בואו לדבר על זה ביחד, עם הפרק ומפת לוויין. ${r.title_en ? `${r.title_en}: ` : ""}come talk it through on Ohel.`,
    };
  }
  if (p[0] === "map" && p[1]) {
    const place = findPlace(p[1]);
    if (place) {
      const meta: Meta = { title: `${place.he} · ${place.en} · על המפה באוהל`, description: clip(place.story.he, 180) };
      // A place with a deep page shares its own photo and summary.
      const res = await env.ASSETS.fetch(new Request(`${url.origin}/data/places/${place.id}.json`));
      if (res.ok && (res.headers.get("content-type") ?? "").includes("json")) {
        const d = (await res.json()) as { he?: { summary?: string }; images?: { kind: string; thumb?: string; width?: number; height?: number }[] };
        if (d.he?.summary) meta.description = clip(d.he.summary, 200);
        const cover = d.images?.find((i) => i.kind === "site" && i.thumb) ?? d.images?.find((i) => i.thumb);
        if (cover?.thumb) meta.image = { url: cover.thumb, width: cover.width, height: cover.height };
      }
      return meta;
    }
    return { title: "המפה · The map · אוהל", description: HOME.description };
  }
  if (p[0] === "map") return { title: "מקומות התנ״ך על מפת לוויין · אוהל", description: "הר הגלבוע, עמק האלה, הכרמל ועוד 56 מקומות, בתלת־ממד. Bible places on a 3D satellite map." };
  if (p[0] === "read") {
    const r = parseRef(`${(p[1] ?? "").replace(/_/g, " ")} ${Number(p[2]) || 1}`);
    if (r) {
      const ref = `${r.book} ${r.chapter}`;
      return {
        title: `${refLabel(ref, "he")} · ${refLabel(ref, "en")} · אוהל`,
        description: "לקרוא את הפרק בעברית ובאנגלית, ולראות את המקומות שלו על המפה. Read the chapter in Hebrew and English, with its places on the map.",
      };
    }
  }
  if (p[0] === "about") return { title: "כללי האוהל ופרטיות · House rules & privacy · אוהל", description: "מה מותר, מה לא, ומה נשמר עליך (כמעט כלום). What's welcome, what isn't, and what we keep about you (almost nothing)." };
  return HOME;
}

const attr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function withMeta(res: Response, m: Meta, url: URL, env: Env) {
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const tags: [string, string, string][] = [
    ["property", "og:type", "website"],
    ["property", "og:site_name", "Ohel · אוהל"],
    ["property", "og:title", m.title],
    ["property", "og:description", m.description],
    ["property", "og:url", `${url.origin}${url.pathname}`],
    ["property", "og:image", m.image?.url ?? `${url.origin}/og.jpg`],
    ...((m.image ? (m.image.width && m.image.height ? [String(m.image.width), String(m.image.height)] : []) : ["1200", "630"]).flatMap((v, i) => [
      ["property", i ? "og:image:height" : "og:image:width", v] as [string, string, string],
    ])),
    ["property", "og:image:alt", m.image ? m.title : "אוהל · Ohel"],
    ["property", "og:locale", "he_IL"],
    ["property", "og:locale:alternate", "en_US"],
    ["name", "twitter:card", "summary_large_image"],
  ];
  let head = tags.map(([k, n, v]) => `<meta ${k}="${n}" content="${attr(v)}">`).join("\n    ");
  const token: string = env.ANALYTICS_TOKEN;
  if (token && !local) {
    head += `\n    <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${attr(JSON.stringify({ token }))}'></script>`;
  }
  return new HTMLRewriter()
    .on("title", { element: (e) => void e.setInnerContent(m.title) })
    .on('meta[name="description"]', { element: (e) => void e.setAttribute("content", m.description) })
    .on("head", { element: (e) => void e.append(`    ${head}\n  `, { html: true }) })
    .transform(res);
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
    const res = await env.ASSETS.fetch(req);
    if (!(res.headers.get("content-type") ?? "").includes("text/html")) return res;
    const meta = await metaFor(url, env).catch(() => HOME);
    return withMeta(res, meta, url, env);
  },
} satisfies ExportedHandler<Env>;
