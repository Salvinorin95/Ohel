// What search engines see: one real page per place in each language (/place/<id> and /place/<id>?lang=en),
// a sitemap, robots.txt, and the page text written into the HTML so it can be read without running the app.
// The app replaces this HTML as soon as it starts, and shows the same text in the place page.
import { parseRef, refLabel } from "../shared/books.ts";
import { PLACES, findPlace, type Place } from "../shared/places.ts";
import { JOURNEYS } from "../shared/journeys.ts";
import { ERAS, findPerson, PEOPLE, type Person } from "../shared/people.ts";
import type { PersonInfo } from "../shared/personInfo.ts";

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

export const personUrl = (origin: string, id: string, lang: Lang) => `${origin}/person/${id}${lang === "en" ? "?lang=en" : ""}`;
const personAlt = (origin: string, id: string) =>
  `<xhtml:link rel="alternate" hreflang="he" href="${personUrl(origin, id, "he")}"/><xhtml:link rel="alternate" hreflang="en" href="${personUrl(origin, id, "en")}"/>`;

const PW = {
  he: { story: "הסיפור", places: "המקומות בסיפור", family: "משפחה", character: "מי היו באמת", traditions: "איך זוכרים אותם", history: "מה ההיסטוריה יכולה לומר", verses: "פסוקים חשובים", all: "הדמויות של התנ״ך", title: (n: string) => `${n} בתנ״ך: הסיפור, המקומות על המפה והפסוקים · אוהל` },
  en: { story: "The story", places: "Places in the story", family: "Family", character: "Who they were", traditions: "How they are remembered", history: "What history can say", verses: "Key verses", all: "People of the Bible", title: (n: string) => `${n} in the Bible: the story, the places on the map and the verses · Ohel` },
};
export const personTitle = (p: Person, lang: Lang) => PW[lang].title(p[lang]);

/** The person page as plain HTML, for crawlers and for the moment before the app starts. */
export function personBody(p: Person, d: PersonInfo, lang: Lang): string {
  const w = PW[lang];
  const tx = d[lang];
  const q = lang === "en" ? "?lang=en" : "";
  const other: Lang = lang === "he" ? "en" : "he";
  const cover = d.images[0];
  const out: string[] = [`<article class="ssr-place" lang="${lang}" dir="${lang === "he" ? "rtl" : "ltr"}">`];
  out.push(`<nav class="ssr-crumbs"><a href="/${q}">${WORDS[lang].site}</a> › <a href="/people${q}">${w.all}</a> · <a href="/person/${p.id}${other === "en" ? "?lang=en" : ""}" hreflang="${other}">${WORDS[lang].other}</a></nav>`);
  out.push(`<h1>${esc(p[lang])}</h1>`);
  out.push(`<p class="ssr-crumbs">${esc(ERAS[p.era][lang])} · ${esc(d.era[lang])}${tx.aka.length ? ` · ${tx.aka.map(esc).join(" · ")}` : ""}</p>`);
  out.push(`<p class="ssr-lede">${esc(tx.summary)}</p>`);
  if (cover?.thumb) out.push(`<figure><img src="${esc(cover.thumb)}" alt="${esc(cover.caption[lang])}" loading="lazy"><figcaption>${esc(cover.caption[lang])}${cover.credit ? ` · ${esc(cover.credit)}` : ""}${cover.license ? `, ${esc(cover.license)}` : ""}</figcaption></figure>`);
  out.push(`<h2>${w.story}</h2>${tx.story.map((s) => `<h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>`).join("")}`);
  const places = d.places.map((x) => ({ p: findPlace(x.place), what: x.what })).filter((x) => x.p);
  if (places.length) out.push(`<h2>${w.places}</h2><ul>${places.map((x) => `<li><a href="/place/${x.p!.id}${q}">${esc(x.p![lang])}</a>: ${esc(x.what[lang])}</li>`).join("")}</ul>`);
  if (d.family.length)
    out.push(`<h2>${w.family}</h2><ul>${d.family.map((f) => `<li>${f.person && findPerson(f.person) ? `<a href="/person/${f.person}${q}">${esc(f.name[lang])}</a>` : esc(f.name[lang])} (${esc(f.relation[lang])})</li>`).join("")}</ul>`);
  out.push(`<h2>${w.character}</h2><p>${esc(tx.character)}</p>`);
  if (tx.traditions.length) out.push(`<h2>${w.traditions}</h2>${tx.traditions.map((x) => `<h3>${esc(x.name)}</h3><p>${esc(x.text)}</p>`).join("")}`);
  out.push(`<h2>${w.history}</h2><p>${esc(tx.history)}</p>`);
  if (d.mentions.length)
    out.push(`<h2>${w.verses}</h2><ul>${d.mentions.map((m) => { const href = readHref(m.ref); const label = esc(refLabel(m.ref, lang)); return `<li>${href ? `<a href="${href}${q}">${label}</a>` : label}: ${esc(m.note[lang])}</li>`; }).join("")}</ul>`);
  out.push(`</article>`);
  return out.join("\n");
}

export function personJsonLd(p: Person, d: PersonInfo, lang: Lang, origin: string) {
  const sameAs = (["he", "en"] as const).filter((l) => d.wiki[l]).map((l) => `https://${l}.wikipedia.org/wiki/${encodeURIComponent(d.wiki[l]!.replace(/ /g, "_"))}`);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p[lang],
    alternateName: [p[lang === "he" ? "en" : "he"], ...d[lang].aka],
    description: d[lang].summary,
    url: personUrl(origin, p.id, lang),
    image: d.images.filter((i) => i.thumb).slice(0, 3).map((i) => i.thumb),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function sitemap(origin: string, people: Set<string>) {
  const alt = (id: string) =>
    `<xhtml:link rel="alternate" hreflang="he" href="${placeUrl(origin, id, "he")}"/><xhtml:link rel="alternate" hreflang="en" href="${placeUrl(origin, id, "en")}"/><xhtml:link rel="alternate" hreflang="x-default" href="${placeUrl(origin, id, "he")}"/>`;
  const urls = [`${origin}/`, `${origin}/map`, `${origin}/week`, `${origin}/about`].map((u) => `<url><loc>${u}</loc></url>`);
  if (people.size) urls.push(`<url><loc>${origin}/people</loc></url>`);
  for (const p of PEOPLE.filter((x) => people.has(x.id))) for (const l of ["he", "en"] as const) urls.push(`<url><loc>${personUrl(origin, p.id, l)}</loc>${personAlt(origin, p.id)}</url>`);
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
