// What search engines see: one real page per place in each language (/place/<id> and /place/<id>?lang=en),
// a sitemap, robots.txt, and the page text written into the HTML so it can be read without running the app.
// The app replaces this HTML as soon as it starts, and shows the same text in the place page.
import { parseRef, refLabel } from "../shared/books.ts";
import { PLACES, findPlace, type Place } from "../shared/places.ts";
import { JOURNEYS } from "../shared/journeys.ts";

type Lang = "he" | "en";
type L = { he: string; en: string };
interface Text {
  summary: string;
  setting: string;
  peoples: { name: string; text: string }[];
  population: string;
  archaeology: { title: string; text: string }[];
}
export interface BuiltPlace {
  id: string;
  he: Text;
  en: Text;
  rulers: { name: L; period: L; note: L }[];
  timeline: { year: number; text: L }[];
  mentions: { ref: string; note: L }[];
  images: { kind: string; caption: L; thumb?: string; width?: number; height?: number; credit?: string; license?: string }[];
  wiki: { he?: string; en?: string };
  related: string[];
}

export const langOf = (url: URL): Lang => (url.searchParams.get("lang") === "en" ? "en" : "he");
export const placeUrl = (origin: string, id: string, lang: Lang) => `${origin}/place/${id}${lang === "en" ? "?lang=en" : ""}`;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const WORDS = {
  he: {
    site: "אוהל",
    places: "מקומות התנ״ך",
    setting: "המקום",
    peoples: "מי חי כאן",
    population: "כמה אנשים חיו כאן",
    rulers: "מי שלט כאן",
    archaeology: "מה מצאו כאן",
    timeline: "ציר זמן",
    mentions: "איפה זה בתנ״ך",
    related: "מקומות קשורים",
    other: "English",
    open: "לפתוח על מפת הלוויין",
    bce: "לפנה״ס",
    ce: "לספירה",
    title: (n: string) => `${n} בתנ״ך: מפת לוויין, ארכאולוגיה ותמונות · אוהל`,
  },
  en: {
    site: "Ohel",
    places: "Bible places",
    setting: "The place",
    peoples: "Who lived here",
    population: "How many people lived here",
    rulers: "Who ruled here",
    archaeology: "What was found here",
    timeline: "Timeline",
    mentions: "Where the Bible mentions it",
    related: "Related places",
    other: "עברית",
    open: "Open on the satellite map",
    bce: "BCE",
    ce: "CE",
    title: (n: string) => `${n} in the Bible: satellite map, archaeology and photos · Ohel`,
  },
};

function readHref(ref: string) {
  const r = parseRef(ref);
  return r ? `/read/${r.book.replace(/ /g, "_")}/${r.chapter}` : null;
}

/** The place page as plain HTML, for crawlers and for the moment before the app starts. */
export function placeBody(place: Place, d: BuiltPlace, lang: Lang): string {
  const w = WORDS[lang];
  const tx = d[lang];
  const other: Lang = lang === "he" ? "en" : "he";
  const q = lang === "en" ? "?lang=en" : "";
  const cover = d.images.find((i) => i.kind === "site" && i.thumb) ?? d.images.find((i) => i.thumb);
  const out: string[] = [];
  out.push(`<article class="ssr-place" lang="${lang}" dir="${lang === "he" ? "rtl" : "ltr"}">`);
  out.push(`<nav class="ssr-crumbs"><a href="/${q}">${w.site}</a> › <a href="/map${q}">${w.places}</a> · <a href="/place/${place.id}${other === "en" ? "?lang=en" : ""}" hreflang="${other}">${w.other}</a></nav>`);
  out.push(`<h1>${esc(place[lang])}</h1>`);
  out.push(`<p class="ssr-lede">${esc(tx.summary)}</p>`);
  out.push(`<p><a href="/map/${place.id}${q}">🛰️ ${w.open}</a></p>`);
  if (cover?.thumb) {
    const credit = [cover.credit, cover.license].filter(Boolean).map((s) => esc(s!)).join(", ");
    out.push(
      `<figure><img src="${esc(cover.thumb)}" alt="${esc(cover.caption[lang])}"${cover.width ? ` width="${cover.width}"` : ""}${cover.height ? ` height="${cover.height}"` : ""} loading="lazy"><figcaption>${esc(cover.caption[lang])}${credit ? ` · ${credit}` : ""}</figcaption></figure>`,
    );
  }
  out.push(`<h2>${w.setting}</h2><p>${esc(tx.setting)}</p>`);
  if (tx.peoples.length) out.push(`<h2>${w.peoples}</h2>${tx.peoples.map((p) => `<h3>${esc(p.name)}</h3><p>${esc(p.text)}</p>`).join("")}`);
  if (d.rulers.length)
    out.push(`<h2>${w.rulers}</h2><ul>${d.rulers.map((r) => `<li><strong>${esc(r.name[lang])}</strong> (${esc(r.period[lang])}): ${esc(r.note[lang])}</li>`).join("")}</ul>`);
  out.push(`<h2>${w.population}</h2><p>${esc(tx.population)}</p>`);
  if (tx.archaeology.length) out.push(`<h2>${w.archaeology}</h2>${tx.archaeology.map((a) => `<h3>${esc(a.title)}</h3><p>${esc(a.text)}</p>`).join("")}`);
  if (d.timeline.length)
    out.push(
      `<h2>${w.timeline}</h2><ul>${d.timeline
        .map((t) => `<li><strong>${Math.abs(t.year)} ${t.year < 0 ? w.bce : w.ce}</strong>: ${esc(t.text[lang])}</li>`)
        .join("")}</ul>`,
    );
  if (d.mentions.length)
    out.push(
      `<h2>${w.mentions}</h2><ul>${d.mentions
        .map((m) => {
          const href = readHref(m.ref);
          const label = esc(refLabel(m.ref, lang));
          return `<li>${href ? `<a href="${href}${q}">${label}</a>` : label}: ${esc(m.note[lang])}</li>`;
        })
        .join("")}</ul>`,
    );
  const rel = d.related.map((r) => findPlace(r)).filter((p): p is Place => !!p);
  if (rel.length) out.push(`<h2>${w.related}</h2><ul>${rel.map((p) => `<li><a href="/place/${p.id}${q}">${esc(p[lang])}</a></li>`).join("")}</ul>`);
  out.push(`</article>`);
  return out.join("\n");
}

/** schema.org description of the place, so search engines know it is a place with coordinates. */
export function placeJsonLd(place: Place, d: BuiltPlace, lang: Lang, origin: string) {
  const other: Lang = lang === "he" ? "en" : "he";
  const sameAs = (["he", "en"] as const).filter((l) => d.wiki[l]).map((l) => `https://${l}.wikipedia.org/wiki/${encodeURIComponent(d.wiki[l]!.replace(/ /g, "_"))}`);
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: place[lang],
    alternateName: place[other],
    description: d[lang].summary,
    url: placeUrl(origin, place.id, lang),
    inLanguage: lang,
    geo: { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng },
    image: d.images.filter((i) => i.thumb).slice(0, 4).map((i) => i.thumb),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export const placeTitle = (place: Place, lang: Lang) => WORDS[lang].title(place[lang]);

export function sitemap(origin: string) {
  const alt = (id: string) =>
    `<xhtml:link rel="alternate" hreflang="he" href="${placeUrl(origin, id, "he")}"/><xhtml:link rel="alternate" hreflang="en" href="${placeUrl(origin, id, "en")}"/><xhtml:link rel="alternate" hreflang="x-default" href="${placeUrl(origin, id, "he")}"/>`;
  const urls = [`${origin}/`, `${origin}/map`, `${origin}/week`, `${origin}/about`].map((u) => `<url><loc>${u}</loc></url>`);
  for (const j of JOURNEYS) urls.push(`<url><loc>${origin}/journey/${j.id}</loc></url>`);
  for (const p of PLACES) for (const l of ["he", "en"] as const) urls.push(`<url><loc>${placeUrl(origin, p.id, l)}</loc>${alt(p.id)}</url>`);
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`,
    { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } },
  );
}

export function robots(origin: string) {
  return new Response(
    ["User-agent: *", "Allow: /", "Disallow: /api/", "Disallow: /admin", "Disallow: /me", "", `Sitemap: ${origin}/sitemap.xml`, ""].join("\n"),
    { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } },
  );
}
