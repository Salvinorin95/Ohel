// Checks every content/people/<id>.json and builds public/data/people/<id>.json with image URLs, sizes,
// authors and licenses from Wikimedia Commons (images without a free license are dropped), plus an index
// for the people grid and for "people of this place" on the place pages.
// Usage: node --experimental-strip-types scripts/build-people.ts [--offline]
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseRef } from "../shared/books.ts";
import { findJourney } from "../shared/journeys.ts";
import { findPerson, PEOPLE } from "../shared/people.ts";
import type { PersonInfo, PersonText } from "../shared/personInfo.ts";
import type { PlaceImage } from "../shared/placeInfo.ts";
import { findPlace } from "../shared/places.ts";
import { resolveImages, type Resolved } from "./commons.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "content/people");
const OUT = join(root, "public/data/people");
const offline = process.argv.includes("--offline");

let problems = 0;
const warn = (id: string, msg: string) => {
  problems++;
  console.warn(`  ✘ ${id}: ${msg}`);
};
const isL = (x: unknown): x is { he: string; en: string } =>
  !!x && typeof (x as { he?: unknown }).he === "string" && typeof (x as { en?: unknown }).en === "string" && !!(x as { he: string }).he.trim() && !!(x as { en: string }).en.trim();

function checkText(id: string, lang: string, t: PersonText | undefined) {
  if (!t) return warn(id, `${lang} missing`);
  for (const k of ["name", "summary", "character", "history"] as const) if (typeof t[k] !== "string" || !t[k].trim()) warn(id, `${lang}.${k} missing`);
  if (!Array.isArray(t.aka)) warn(id, `${lang}.aka missing`);
  if (!Array.isArray(t.story) || t.story.length < 3 || t.story.some((s) => !s.title?.trim() || !s.text?.trim())) warn(id, `${lang}.story incomplete`);
  // Story refs may be ranges ("Genesis 16:1-6", "Genesis 16:1-17:3"); the start must be a real verse.
  for (const s of t.story ?? []) for (const r of s.refs ?? []) if (!parseRef(r.replace(/-.*$/, "")) || (r.includes("-") && !/^.+ \d+:\d+-(\d+:)?\d+$/.test(r))) warn(id, `bad story ref "${r}"`);
  if (!Array.isArray(t.traditions) || t.traditions.some((x) => !x.name?.trim() || !x.text?.trim())) warn(id, `${lang}.traditions incomplete`);
}

function check(info: PersonInfo) {
  const id = info.id;
  checkText(id, "he", info.he);
  checkText(id, "en", info.en);
  for (const k of ["story", "traditions"] as const) if ((info.he?.[k]?.length ?? 0) !== (info.en?.[k]?.length ?? 0)) warn(id, `he/en ${k} count differ`);
  if (!isL(info.era)) warn(id, "era missing");
  for (const p of info.places ?? []) {
    if (!findPlace(p.place)) warn(id, `unknown place "${p.place}"`);
    if (!isL(p.what)) warn(id, `place note incomplete (${p.place})`);
  }
  if (info.journey && !findJourney(info.journey)) warn(id, `unknown journey "${info.journey}"`);
  for (const f of info.family ?? []) {
    if (f.person && !findPerson(f.person)) warn(id, `unknown family person "${f.person}"`);
    if (!isL(f.name) || !isL(f.relation)) warn(id, "family entry incomplete");
  }
  for (const m of info.mentions ?? []) {
    if (!parseRef(m.ref)) warn(id, `bad ref "${m.ref}"`);
    if (!isL(m.note)) warn(id, `mention note incomplete (${m.ref})`);
  }
  for (const r of info.related ?? []) if (!findPerson(r)) warn(id, `unknown related person "${r}"`);
  for (const img of info.images ?? []) {
    if (!/^File:/.test(img.file)) warn(id, `image title should start with File: (${img.file})`);
    if (!["site", "artifact", "art", "map"].includes(img.kind)) warn(id, `bad image kind (${img.file})`);
    if (!isL(img.caption)) warn(id, `image caption incomplete (${img.file})`);
  }
}

mkdirSync(OUT, { recursive: true });
const infos: PersonInfo[] = [];
for (const f of readdirSync(SRC).filter((f) => f.endsWith(".json")).sort()) {
  const id = f.replace(/\.json$/, "");
  let info: PersonInfo;
  try {
    info = JSON.parse(readFileSync(join(SRC, f), "utf8"));
  } catch (e) {
    warn(id, `not valid JSON: ${(e as Error).message}`);
    continue;
  }
  if (info.id !== id) warn(id, `id inside is "${info.id}"`);
  if (!findPerson(id)) {
    warn(id, "no such person in shared/people.ts");
    continue;
  }
  check(info);
  infos.push(info);
}

const previous = new Map<string, PlaceImage>();
for (const info of infos) {
  const prev = join(OUT, `${info.id}.json`);
  if (existsSync(prev)) for (const img of (JSON.parse(readFileSync(prev, "utf8")) as PersonInfo).images) previous.set(img.file, img);
}
const titles = [...new Set(infos.flatMap((i) => (i.images ?? []).map((m) => m.file)))];
const found = offline ? new Map<string, Resolved | string>() : await resolveImages(titles);

/** id → cover and the places of their story; places → the people whose story passes through them. */
const index: Record<string, { cover?: string; places: string[] }> = {};
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
    images.push({ ...img, ...r });
  }
  writeFileSync(join(OUT, `${info.id}.json`), JSON.stringify({ ...info, images }));
  index[info.id] = { cover: images[0]?.thumb, places: (info.places ?? []).map((p) => p.place) };
  console.log(`${info.id.padEnd(10)} ${images.length}/${info.images?.length ?? 0} images, ${info.he?.story?.length ?? 0} chapters, ${info.places?.length ?? 0} places, ${info.mentions?.length ?? 0} verses`);
}
writeFileSync(join(OUT, "index.json"), JSON.stringify(index));
const missing = PEOPLE.filter((p) => !index[p.id]).map((p) => p.id);
console.log(`\n${infos.length}/${PEOPLE.length} people built${missing.length ? ` (not yet: ${missing.join(", ")})` : ""}${problems ? `, ${problems} problems` : ""}`);
process.exit(problems ? 1 : 0);
