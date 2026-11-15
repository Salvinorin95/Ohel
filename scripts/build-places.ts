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
import { resolveImages, type Resolved } from "./commons.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "content/places");
const OUT = join(root, "public/data/places");
const offline = process.argv.includes("--offline");

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

const index: Record<string, { cover?: string; images: number; refs: string[] }> = {};
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
  // Every verse that mentions the place, for "this week on the map" (the map list's chapters plus the page's verses).
  const refs = [...new Set([...(findPlace(info.id)?.refs ?? []), ...info.mentions.map((m) => m.ref)])];
  index[info.id] = { cover: cover?.thumb, images: images.length, refs };
  console.log(`${info.id.padEnd(14)} ${images.length}/${info.images?.length ?? 0} images, ${info.mentions?.length ?? 0} mentions, ${info.rulers?.length ?? 0} rulers`);
}
writeFileSync(join(OUT, "index.json"), JSON.stringify(index));
const missing = PLACES.filter((p) => !index[p.id]).map((p) => p.id);
console.log(`\n${infos.length}/${PLACES.length} places built${missing.length ? ` (not yet: ${missing.join(", ")})` : ""}${problems ? `, ${problems} problems` : ""}`);
process.exit(problems ? 1 : 0);
