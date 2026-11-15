// The deep page for one place: setting, peoples, rulers, population, archaeology, images, mentions.
// Authored in content/places/<id>.json (see content/places/README.md), built by scripts/build-places.ts (`npm run places`)
// into public/data/places/<id>.json with image URLs and credits filled in from Wikimedia Commons.

export type L = { he: string; en: string };

/** Realms a place can name as its rulers. Most have borders in public/data/realms.json (scripts/build-realms.mjs,
 *  from Cliopatria); united, aram, ammon, moab and edom have no borders in that dataset, so they show as text only. */
export const REALMS = {
  ur3: { he: "שומר וערי המדינה שלה (בימי שושלת אור השלישית)", en: "Sumer and its city-states (Third Dynasty of Ur)", period: { he: "בערך 2100–2000 לפנה״ס", en: "c. 2100–2000 BCE" } },
  egypt_nk: { he: "מצרים, הממלכה החדשה", en: "Egypt, New Kingdom", period: { he: "בערך 1550–1070 לפנה״ס", en: "c. 1550–1070 BCE" } },
  hatti: { he: "האימפריה החתית", en: "Hittite Empire", period: { he: "בערך 1400–1180 לפנה״ס", en: "c. 1400–1180 BCE" } },
  philistia: { he: "ערי הפלשתים", en: "The Philistine cities", period: { he: "בערך 1150–604 לפנה״ס", en: "c. 1150–604 BCE" } },
  united: { he: "הממלכה המאוחדת (דוד ושלמה)", en: "United Monarchy (David and Solomon)", period: { he: "בערך 1000–930 לפנה״ס", en: "c. 1000–930 BCE" } },
  israel: { he: "ממלכת ישראל", en: "Kingdom of Israel", period: { he: "בערך 930–720 לפנה״ס", en: "c. 930–720 BCE" } },
  judah: { he: "ממלכת יהודה", en: "Kingdom of Judah", period: { he: "בערך 930–586 לפנה״ס", en: "c. 930–586 BCE" } },
  aram: { he: "ארם דמשק", en: "Aram-Damascus", period: { he: "בערך 950–732 לפנה״ס", en: "c. 950–732 BCE" } },
  phoenicia: { he: "ערי פיניקיה (צור וצידון)", en: "Phoenician cities (Tyre and Sidon)", period: { he: "בערך 1200–332 לפנה״ס", en: "c. 1200–332 BCE" } },
  ammon: { he: "עמון", en: "Ammon", period: { he: "בערך 1000–580 לפנה״ס", en: "c. 1000–580 BCE" } },
  moab: { he: "מואב", en: "Moab", period: { he: "בערך 1000–580 לפנה״ס", en: "c. 1000–580 BCE" } },
  edom: { he: "אדום", en: "Edom", period: { he: "בערך 900–550 לפנה״ס", en: "c. 900–550 BCE" } },
  urartu: { he: "אורארטו (ממלכת אררט)", en: "Urartu (Kingdom of Ararat)", period: { he: "בערך 860–590 לפנה״ס", en: "c. 860–590 BCE" } },
  assyria: { he: "האימפריה האשורית החדשה", en: "Neo-Assyrian Empire", period: { he: "בשיאה, בערך 670 לפנה״ס", en: "at its height, c. 670 BCE" } },
  elam: { he: "עילם", en: "Elam", period: { he: "בערך 1500–640 לפנה״ס", en: "c. 1500–640 BCE" } },
  babylonia: { he: "האימפריה הבבלית החדשה", en: "Neo-Babylonian Empire", period: { he: "בשיאה, בערך 560 לפנה״ס", en: "at its height, c. 560 BCE" } },
  persia: { he: "האימפריה הפרסית (האחמנית)", en: "Achaemenid Persian Empire", period: { he: "בשיאה, בערך 500 לפנה״ס", en: "at its height, c. 500 BCE" } },
} as const;

export type RealmId = keyof typeof REALMS;

export type ImageKind = "site" | "artifact" | "art" | "map";

export interface PlaceImage {
  file: string; // Wikimedia Commons title, e.g. "File:Nineveh Adad gate exterior entrance.JPG"
  kind: ImageKind;
  caption: L;
  // filled in by scripts/build-places.ts:
  thumb?: string; // ~960px wide
  full?: string; // the file page on Commons
  width?: number;
  height?: number;
  credit?: string; // author, plain text
  license?: string; // e.g. "CC BY-SA 4.0", "Public domain"
}

export interface PlaceText {
  summary: string; // 2-3 sentences
  setting: string; // the place and its surroundings: terrain, water, roads, climate, what you see today
  peoples: { name: string; text: string }[]; // who lived here over time
  population: string; // estimates with the era and a comparison, honest about uncertainty
  archaeology: { title: string; text: string }[];
}

export interface PlaceInfo {
  id: string;
  he: PlaceText;
  en: PlaceText;
  rulers: { realm: RealmId | null; name: L; period: L; note: L }[]; // who ruled here, oldest first
  timeline: { year: number; text: L }[]; // year < 0 = BCE, oldest first
  mentions: { ref: string; note: L }[]; // where the Bible mentions it ("I Samuel 31:8")
  images: PlaceImage[];
  wiki: { he?: string; en?: string }; // Wikipedia article titles
  related: string[]; // ids of other places in shared/places.ts
  sources: { title: string; url: string }[];
}
