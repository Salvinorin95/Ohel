import { findBook, parseRef, refLabel } from "../shared/books.ts";
import { findPlace, PLACES } from "../shared/places.ts";
import type { RoomInfo } from "../shared/protocol.ts";
import { week } from "./week.ts";
import { findJourney } from "../shared/journeys.ts";
import { langOf, personBody, personJsonLd, personTitle, personUrl, placeBody, placeJsonLd, placeTitle, placeUrl, robots, sitemap, type BuiltPlace } from "./seo.ts";
import { findPerson, PEOPLE } from "../shared/people.ts";
import type { PersonInfo } from "../shared/personInfo.ts";

export { Hub } from "./hub.ts";

import { chapterText } from "./text.ts";

// ── link previews ─────────────────────────────────────────────────────
// WhatsApp, Telegram and friends don't run JavaScript, so each page gets its own title,
// description and picture written into the HTML before it leaves.

interface Meta {
  title: string;
  description: string;
  image?: { url: string; width?: number; height?: number };
  /** For search engines: the one address of this page, its other-language twin, and whether to list it at all. */
  canonical?: string;
  alternates?: { lang: string; href: string }[];
  noindex?: boolean;
  jsonld?: object;
  /** HTML put inside #root until the app starts (the place page as text). */
  body?: string;
  lang?: "he" | "en";
}

const HOME: Meta = {
  title: "אוהל · Ohel: לומדים תנ״ך ביחד",
  description:
    "אוהל פתוח לתנ״ך: לקרוא, לראות על מפת לוויין ולדבר על זה ביחד. An open tent for the Bible: read it, see it on the map, talk it through together.",
};

const clip = (s: string, n: number) => ([...s].length > n ? `${[...s].slice(0, n - 1).join("").trimEnd()}…` : s);

async function builtPlace(url: URL, env: Env, id: string): Promise<BuiltPlace | null> {
  const res = await env.ASSETS.fetch(new Request(`${url.origin}/data/places/${id}.json`));
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) return null;
  return (await res.json()) as BuiltPlace;
}

const twins = (origin: string, id: string) => [
  { lang: "he", href: placeUrl(origin, id, "he") },
  { lang: "en", href: placeUrl(origin, id, "en") },
  { lang: "x-default", href: placeUrl(origin, id, "he") },
];

async function metaFor(url: URL, env: Env, ctx: ExecutionContext): Promise<Meta> {
  const p = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  // A person's page, in Hebrew (/person/david) or English (/person/david?lang=en).
  if (p[0] === "person" && p[1]) {
    const person = findPerson(p[1]);
    const res = person ? await env.ASSETS.fetch(new Request(`${url.origin}/data/people/${person.id}.json`)) : null;
    if (!person || !res?.ok || !(res.headers.get("content-type") ?? "").includes("json")) return { ...HOME, noindex: true };
    const d = (await res.json()) as PersonInfo;
    const lang = langOf(url);
    const cover = d.images[0];
    return {
      title: personTitle(person, lang),
      description: clip(d[lang].summary, 200),
      image: cover?.thumb ? { url: cover.thumb, width: cover.width, height: cover.height } : undefined,
      canonical: personUrl(url.origin, person.id, lang),
      alternates: [
        { lang: "he", href: personUrl(url.origin, person.id, "he") },
        { lang: "en", href: personUrl(url.origin, person.id, "en") },
        { lang: "x-default", href: personUrl(url.origin, person.id, "he") },
      ],
      jsonld: personJsonLd(person, d, lang, url.origin),
      body: personBody(person, d, lang),
      lang,
    };
  }
  if (p[0] === "people") {
    const names = PEOPLE.slice(0, 12).map((x) => x.he).join(", ");
    return { title: "הדמויות של התנ״ך · People of the Bible · אוהל", description: clip(`${names} ועוד: הסיפור של כל דמות, המקומות שלה על מפת לוויין והפסוקים. The people of the Bible, their stories and their places on the map.`, 200) };
  }
  // A journey played on the map.
  if (p[0] === "journey" && p[1]) {
    const j = findJourney(p[1]);
    if (j) {
      const idx = await env.ASSETS.fetch(new Request(`${url.origin}/data/places/index.json`));
      const index = idx.ok ? ((await idx.json()) as Record<string, { cover?: string }>) : {};
      const cover = j.stops.map((s) => (s.place ? index[s.place]?.cover : undefined)).find(Boolean);
      return {
        title: `${j.he} על המפה · ${j.en} · אוהל`,
        description: clip(`${j.intro.he} ${j.intro.en}`, 200),
        image: cover ? { url: cover } : undefined,
        canonical: `${url.origin}/journey/${j.id}`,
      };
    }
  }
  // This week's reading on the map: a link worth sending around every week.
  if (p[0] === "week") {
    const w = await week(url.origin, env.ASSETS, ctx).catch(() => null);
    if (!w) return { title: "השבוע על המפה · This week on the map · אוהל", description: HOME.description };
    const idx = await env.ASSETS.fetch(new Request(`${url.origin}/data/places/index.json`));
    const index = idx.ok ? ((await idx.json()) as Record<string, { cover?: string }>) : {};
    const names = w.places.map((x) => findPlace(x.id)?.he).filter(Boolean).slice(0, 6);
    const cover = w.places.map((x) => index[x.id]?.cover).find(Boolean);
    return {
      title: `פרשת ${w.name.he} על המפה · ${w.name.en} on the map · אוהל`,
      description: clip(`המקומות של פרשת השבוע על מפת לוויין${names.length ? `: ${names.join(", ")}` : ""}. This week's Torah reading and its places on a 3D map.`, 200),
      image: cover ? { url: cover } : undefined,
      canonical: `${url.origin}/week`,
    };
  }
  // A place's own page, in Hebrew (/place/gilboa) or English (/place/gilboa?lang=en).
  if (p[0] === "place" && p[1]) {
    const place = findPlace(p[1]);
    const d = place && (await builtPlace(url, env, place.id));
    if (!place || !d) return { ...HOME, noindex: true };
    const lang = langOf(url);
    const cover = d.images.find((i) => i.kind === "site" && i.thumb) ?? d.images.find((i) => i.thumb);
    return {
      title: placeTitle(place, lang),
      description: clip(d[lang].summary, 200),
      image: cover?.thumb ? { url: cover.thumb, width: cover.width, height: cover.height } : undefined,
      canonical: placeUrl(url.origin, place.id, lang),
      alternates: twins(url.origin, place.id),
      jsonld: placeJsonLd(place, d, lang, url.origin),
      body: placeBody(place, d, lang),
      lang,
    };
  }
  if (p[0] === "room" && p[1] && /^[\w-]{1,40}$/.test(p[1])) {
    const res = await env.HUB.get(env.HUB.idFromName("ohel")).fetch(`https://hub/api/rooms/${p[1]}`);
    if (!res.ok) return { ...HOME, noindex: true };
    const r = (await res.json()) as RoomInfo;
    const he = r.title_he || r.title;
    const ref = r.ref ? `${refLabel(r.ref, "he")} · ` : "";
    return {
      noindex: true,
      title: `${clip(he, 70)} · אוהל`,
      description: `${ref}בואו לדבר על זה ביחד, עם הפרק ומפת לוויין. ${r.title_en ? `${r.title_en}: ` : ""}come talk it through on Ohel.`,
    };
  }
  if (p[0] === "map" && p[1]) {
    const place = findPlace(p[1]);
    if (place) {
      const meta: Meta = { title: `${place.he} · ${place.en} · על המפה באוהל`, description: clip(place.story.he, 180) };
      // A place with a deep page shares its own photo and summary; search engines are sent to that page.
      const d = await builtPlace(url, env, place.id);
      if (d) {
        meta.description = clip(d.he.summary, 200);
        const cover = d.images.find((i) => i.kind === "site" && i.thumb) ?? d.images.find((i) => i.thumb);
        if (cover?.thumb) meta.image = { url: cover.thumb, width: cover.width, height: cover.height };
        meta.canonical = placeUrl(url.origin, place.id, langOf(url));
      }
      return meta;
    }
    return { title: "המפה · The map · אוהל", description: HOME.description };
  }
  if (p[0] === "map") return { title: "מקומות התנ״ך על מפת לוויין · אוהל", description: `הר הגלבוע, עמק האלה, הכרמל ועוד ${PLACES.length - 3} מקומות, בתלת־ממד. ${PLACES.length} Bible places on a 3D satellite map.` };
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
  if (p[0] === "me" || p[0] === "admin" || p[0] === "key") return { ...HOME, noindex: true };
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
  if (m.noindex) tags.push(["name", "robots", "noindex"]);
  const verify: string = env.GOOGLE_SITE_VERIFICATION;
  if (verify && url.pathname === "/") tags.push(["name", "google-site-verification", verify]);
  let head = tags.map(([k, n, v]) => `<meta ${k}="${n}" content="${attr(v)}">`).join("\n    ");
  if (m.canonical) head += `\n    <link rel="canonical" href="${attr(m.canonical)}">`;
  for (const a of m.alternates ?? []) head += `\n    <link rel="alternate" hreflang="${a.lang}" href="${attr(a.href)}">`;
  if (m.jsonld) head += `\n    <script type="application/ld+json">${JSON.stringify(m.jsonld).replace(/</g, "\\u003c")}</script>`;
  const token: string = env.ANALYTICS_TOKEN;
  // The personal sign-in link (/key#...) is never counted, so its key can't end up in any report.
  if (token && !local && url.pathname !== "/key") {
    head += `\n    <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${attr(JSON.stringify({ token }))}'></script>`;
  }
  let rw = new HTMLRewriter();
  if (m.lang === "en") rw = rw.on("html", { element: (e) => void (e.setAttribute("lang", "en"), e.setAttribute("dir", "ltr")) });
  if (m.body) rw = rw.on("#root", { element: (e) => void e.setInnerContent(m.body!, { html: true }) });
  return rw
    .on("title", { element: (e) => void e.setInnerContent(m.title) })
    .on('meta[name="description"]', { element: (e) => void e.setAttribute("content", m.description) })
    .on("head", { element: (e) => void e.append(`    ${head}\n  `, { html: true }) })
    .transform(res);
}

// ── Staying signed in ──
// The key lives in the browser's storage; a copy in one sign-in cookie (HttpOnly, sent only to /api/session)
// brings it back when a browser clears its storage (Safari does after 7 days away). No tracking, nothing else.
const KEY_COOKIE = "ohel_key";
const cookieOf = (req: Request, name: string) => {
  const m = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(req.headers.get("cookie") ?? "");
  return m ? decodeURIComponent(m[1]) : null;
};
const keyCookie = (v: string, maxAge: number) => `${KEY_COOKIE}=${encodeURIComponent(v)}; Path=/api/session; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

async function session(req: Request, env: Env): Promise<Response> {
  const hub = env.HUB.get(env.HUB.idFromName("ohel"));
  const meWith = (token: string) => hub.fetch(new Request("https://hub/api/me", { headers: { authorization: `Bearer ${token}` } }));
  if (req.method === "POST") {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    if (!token || !(await meWith(token)).ok) return Response.json({ error: "auth" }, { status: 401 });
    return new Response(null, { status: 204, headers: { "set-cookie": keyCookie(token, 400 * 86_400) } });
  }
  if (req.method === "DELETE") return new Response(null, { status: 204, headers: { "set-cookie": keyCookie("", 0) } });
  const token = cookieOf(req, KEY_COOKIE);
  if (!token) return Response.json({ error: "none" }, { status: 404 });
  const res = await meWith(token);
  if (!res.ok) return Response.json({ error: "none" }, { status: 404, headers: { "set-cookie": keyCookie("", 0) } });
  const p = (await res.json()) as { me: unknown };
  return Response.json({ token, me: p.me }, { headers: { "cache-control": "no-store" } });
}

export default {
  async fetch(req, env, ctx): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/api/text") return chapterText(req, ctx);
    if (url.pathname === "/sitemap.xml") {
      const idx = await env.ASSETS.fetch(new Request(`${url.origin}/data/people/index.json`));
      const people = idx.ok && (idx.headers.get("content-type") ?? "").includes("json") ? Object.keys((await idx.json()) as object) : [];
      return sitemap(url.origin, new Set(people));
    }
    if (url.pathname === "/api/session") return session(req, env);
    // A form posts here only so the browser offers to save the key in its passwords; nothing is kept.
    if (url.pathname === "/api/saved") return new Response(null, { status: 204 });
    if (url.pathname === "/api/week") {
      const w = await week(url.origin, env.ASSETS, ctx).catch(() => null);
      return w ? Response.json(w, { headers: { "cache-control": "public, max-age=600" } }) : Response.json({ error: "unavailable" }, { status: 503 });
    }
    if (url.pathname === "/robots.txt") return robots(url.origin);
    if (url.pathname.startsWith("/api/")) {
      const headers = new Headers(req.headers);
      headers.set("x-ohel-ip", req.headers.get("cf-connecting-ip") ?? "");
      const stub = env.HUB.get(env.HUB.idFromName("ohel"));
      return stub.fetch(new Request(req, { headers }));
    }
    const res = await env.ASSETS.fetch(req);
    if (!(res.headers.get("content-type") ?? "").includes("text/html")) return res;
    const meta = await metaFor(url, env, ctx).catch(() => HOME);
    return withMeta(res, meta, url, env);
  },
} satisfies ExportedHandler<Env>;
