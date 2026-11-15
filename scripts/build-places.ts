// Checks every content/places/<id>.json and builds public/data/places/<id>.json with image URLs,
// sizes, authors and licenses filled in from Wikimedia Commons. Images without a free license are dropped.
// Usage: node --experimental-strip-types scripts/build-places.ts [--offline]
//   --offline  skip Commons and reuse what the last build found (for quick text edits)
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseRef } from "../shared/books.ts";
import { findPlace, PLACES } from "../shared/places.ts";
import { REALMS, type PlaceImage, type PlaceInfo, type PlaceText } from "../shared/placeInfo.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "content/places");
const OUT = join(root, "public/data/places");
const offline = process.argv.includes("--offline");
const UA = "OhelBibleApp/0.1 (educational, non-commercial)";
const THUMB = 960;

let problems = 0;
const warn = (id: string, msg: string) => {
  problems++;
  console.warn(`  ✘ ${id}: ${msg}`);
};

const isL = (x: unknown): x is { he: string; en: string } =>
  !!x && typeof (x as { he?: unknown }).he === "string" && typeof (x as { en?: unknown }).en === "string" && !!(x as { he: string }).he.trim() && !!(x as { en: string }).en.trim();

function checkText(id: string, lang: string, t: PlaceText | undefined) {
  if (!t) return warn(id, `${lang} missing`);
  for (const k of ["summary", "setting", "population"] as const) if (typeof t[k] !== "string" || !t[k].trim()) warn(id, `${lang}.${k} missing`);
  if (!Array.isArray(t.peoples) || !t.peoples.length || t.peoples.some((p) => !p.name?.trim() || !p.text?.trim())) warn(id, `${lang}.peoples incomplete`);
  if (!Array.isArray(t.archaeology) || t.archaeology.some((a) => !a.title?.trim() || !a.text?.trim())) warn(id, `${lang}.archaeology incomplete`);
}

function check(info: PlaceInfo) {
  const id = info.id;
  checkText(id, "he", info.he);
  checkText(id, "en", info.en);
  if ((info.he?.peoples?.length ?? 0) !== (info.en?.peoples?.length ?? 0)) warn(id, "he/en peoples count differ");
  if ((info.he?.archaeology?.length ?? 0) !== (info.en?.archaeology?.length ?? 0)) warn(id, "he/en archaeology count differ");
  for (const r of info.rulers ?? []) {
    if (r.realm !== null && !(r.realm in REALMS)) warn(id, `unknown realm "${r.realm}"`);
    if (!isL(r.name) || !isL(r.period) || !isL(r.note)) warn(id, "ruler text incomplete");
  }
  for (const t of info.timeline ?? []) if (typeof t.year !== "number" || !isL(t.text)) warn(id, "timeline entry incomplete");
  for (const m of info.mentions ?? []) {
    const r = parseRef(m.ref);
    if (!r) warn(id, `bad ref "${m.ref}"`);
    if (!isL(m.note)) warn(id, `mention note incomplete (${m.ref})`);
  }
  for (const r of info.related ?? []) if (!findPlace(r)) warn(id, `unknown related place "${r}"`);
  for (const img of info.images ?? []) {
    if (!/^File:/.test(img.file)) warn(id, `image title should start with File: (${img.file})`);
    if (!["site", "artifact", "art", "map"].includes(img.kind)) warn(id, `bad image kind (${img.file})`);
    if (!isL(img.caption)) warn(id, `image caption incomplete (${img.file})`);
  }
}

const strip = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const FREE = /^(public domain|pd\b|pd-|cc0|cc[- ]by(-sa)?[- ]\d|cc[- ]by(-sa)?$|attribution|no restrictions|copyrighted free use)/i;

interface Resolved {
  thumb: string;
  full: string;
  width: number;
  height: number;
  credit: string;
  license: string;
}

/** Looks up up to 50 Commons files per request. Returns title → details (or a reason it's unusable). */
async function resolveImages(titles: string[]): Promise<Map<string, Resolved | string>> {
  const out = new Map<string, Resolved | string>();
  for (let i = 0; i < titles.length; i += 25) {
    const batch = titles.slice(i, i + 25);
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.search = new URLSearchParams({
      action: "query", format: "json", formatversion: "2", prop: "imageinfo", iiprop: "url|size|extmetadata",
      iiurlwidth: String(THUMB), iiextmetadatafilter: "LicenseShortName|Artist|Credit|UsageTerms", titles: batch.join("|"),
    }).toString();
    let res = await fetch(url, { headers: { "user-agent": UA } });
    for (let attempt = 1; res.status === 429 || res.status >= 500; attempt++) {
      if (attempt > 6) break;
      const wait = Number(res.headers.get("retry-after")) * 1000 || 2000 * 2 ** attempt;
      console.log(`  Commons says slow down (${res.status}); waiting ${Math.round(wait / 1000)}s`);
      await new Promise((r) => setTimeout(r, wait));
      res = await fetch(url, { headers: { "user-agent": UA } });
    }
    if (!res.ok) throw new Error(`Commons ${res.status}`);
    const d = (await res.json()) as {
      query?: {
        normalized?: { from: string; to: string }[];
        pages?: { title: string; missing?: boolean; imageinfo?: { thumburl?: string; url: string; descriptionurl: string; thumbwidth?: number; thumbheight?: number; width: number; height: number; extmetadata?: Record<string, { value: string }> }[] }[];
      };
    };
    const back = new Map((d.query?.normalized ?? []).map((n) => [n.to, n.from]));
    for (const p of d.query?.pages ?? []) {
      const key = back.get(p.title) ?? p.title;
      const ii = p.imageinfo?.[0];
      if (p.missing || !ii) {
        out.set(key, "missing on Commons");
        continue;
      }
      const meta = ii.extmetadata ?? {};
      const license = strip(meta.LicenseShortName?.value ?? "");
      if (!FREE.test(license) || /\b(nc|nd)\b/i.test(license)) {
        out.set(key, `license not free enough: "${license || "none"}"`);
        continue;
      }
      out.set(key, {
        thumb: ii.thumburl ?? ii.url,
        full: ii.descriptionurl,
        width: ii.thumbwidth ?? ii.width,
        height: ii.thumbheight ?? ii.height,
        credit: strip(meta.Artist?.value ?? "").slice(0, 160) || "Wikimedia Commons",
        license,
      });
    }
    await new Promise((r) => setTimeout(r, 1200)); // be gentle with the API
  }
  return out;
}

mkdirSync(OUT, { recursive: true });
const files = readdirSync(SRC).filter((f) => f.endsWith(".json")).sort();
const infos: PlaceInfo[] = [];
for (const f of files) {
  const id = f.replace(/\.json$/, "");
  let info: PlaceInfo;
  try {
    info = JSON.parse(readFileSync(join(SRC, f), "utf8"));
  } catch (e) {
    warn(id, `not valid JSON: ${(e as Error).message}`);
    continue;
  }
  if (info.id !== id) warn(id, `id inside is "${info.id}"`);
  if (!findPlace(id)) {
    warn(id, "no such place in shared/places.ts");
    continue;
  }
  check(info);
  infos.push(info);
}

// Images: ask Commons, or reuse the previous build when offline.
const previous = new Map<string, PlaceImage>();
for (const info of infos) {
  const prev = join(OUT, `${info.id}.json`);
  if (existsSync(prev)) for (const img of (JSON.parse(readFileSync(prev, "utf8")) as PlaceInfo).images) previous.set(img.file, img);
}
const titles = [...new Set(infos.flatMap((i) => (i.images ?? []).map((m) => m.file)))];
const found = offline ? new Map<string, Resolved | string>() : await resolveImages(titles);

const index: Record<string, { cover?: string; images: number }> = {};
for (const info of infos) {
  const images: PlaceImage[] = [];
  for (const img of info.images ?? []) {
    const r = offline ? previous.get(img.file) : found.get(img.file);
    if (!r) {
      if (!offline) warn(info.id, `image not resolved: ${img.file}`);
      continue;
    }
    if (typeof r === "string") {
      warn(info.id, `${img.file}: ${r}`);
      continue;
    }
    const { thumb, full, width, height, credit, license } = r as Resolved;
    images.push({ ...img, thumb, full, width, height, credit, license });
  }
  const built: PlaceInfo = { ...info, images };
  writeFileSync(join(OUT, `${info.id}.json`), JSON.stringify(built));
  const cover = images.find((m) => m.kind === "site") ?? images[0];
  index[info.id] = { cover: cover?.thumb, images: images.length };
  console.log(`${info.id.padEnd(14)} ${images.length}/${info.images?.length ?? 0} images, ${info.mentions?.length ?? 0} mentions, ${info.rulers?.length ?? 0} rulers`);
}
writeFileSync(join(OUT, "index.json"), JSON.stringify(index));
const missing = PLACES.filter((p) => !index[p.id]).map((p) => p.id);
console.log(`\n${infos.length}/${PLACES.length} places built${missing.length ? ` (not yet: ${missing.join(", ")})` : ""}${problems ? `, ${problems} problems` : ""}`);
process.exit(problems ? 1 : 0);
