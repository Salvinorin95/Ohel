// The Hebrew Bible (Tanakh) in its traditional three parts.
// `key` is the Sefaria title; chapter counts follow the Hebrew chapter division.

export type Section = "torah" | "neviim" | "ketuvim";

export interface Book {
  key: string;
  en: string;
  he: string;
  chapters: number;
  section: Section;
}

export const BOOKS: Book[] = [
  { key: "Genesis", en: "Genesis", he: "בראשית", chapters: 50, section: "torah" },
  { key: "Exodus", en: "Exodus", he: "שמות", chapters: 40, section: "torah" },
  { key: "Leviticus", en: "Leviticus", he: "ויקרא", chapters: 27, section: "torah" },
  { key: "Numbers", en: "Numbers", he: "במדבר", chapters: 36, section: "torah" },
  { key: "Deuteronomy", en: "Deuteronomy", he: "דברים", chapters: 34, section: "torah" },
  { key: "Joshua", en: "Joshua", he: "יהושע", chapters: 24, section: "neviim" },
  { key: "Judges", en: "Judges", he: "שופטים", chapters: 21, section: "neviim" },
  { key: "I Samuel", en: "1 Samuel", he: "שמואל א", chapters: 31, section: "neviim" },
  { key: "II Samuel", en: "2 Samuel", he: "שמואל ב", chapters: 24, section: "neviim" },
  { key: "I Kings", en: "1 Kings", he: "מלכים א", chapters: 22, section: "neviim" },
  { key: "II Kings", en: "2 Kings", he: "מלכים ב", chapters: 25, section: "neviim" },
  { key: "Isaiah", en: "Isaiah", he: "ישעיהו", chapters: 66, section: "neviim" },
  { key: "Jeremiah", en: "Jeremiah", he: "ירמיהו", chapters: 52, section: "neviim" },
  { key: "Ezekiel", en: "Ezekiel", he: "יחזקאל", chapters: 48, section: "neviim" },
  { key: "Hosea", en: "Hosea", he: "הושע", chapters: 14, section: "neviim" },
  { key: "Joel", en: "Joel", he: "יואל", chapters: 4, section: "neviim" },
  { key: "Amos", en: "Amos", he: "עמוס", chapters: 9, section: "neviim" },
  { key: "Obadiah", en: "Obadiah", he: "עובדיה", chapters: 1, section: "neviim" },
  { key: "Jonah", en: "Jonah", he: "יונה", chapters: 4, section: "neviim" },
  { key: "Micah", en: "Micah", he: "מיכה", chapters: 7, section: "neviim" },
  { key: "Nahum", en: "Nahum", he: "נחום", chapters: 3, section: "neviim" },
  { key: "Habakkuk", en: "Habakkuk", he: "חבקוק", chapters: 3, section: "neviim" },
  { key: "Zephaniah", en: "Zephaniah", he: "צפניה", chapters: 3, section: "neviim" },
  { key: "Haggai", en: "Haggai", he: "חגי", chapters: 2, section: "neviim" },
  { key: "Zechariah", en: "Zechariah", he: "זכריה", chapters: 14, section: "neviim" },
  { key: "Malachi", en: "Malachi", he: "מלאכי", chapters: 3, section: "neviim" },
  { key: "Psalms", en: "Psalms", he: "תהלים", chapters: 150, section: "ketuvim" },
  { key: "Proverbs", en: "Proverbs", he: "משלי", chapters: 31, section: "ketuvim" },
  { key: "Job", en: "Job", he: "איוב", chapters: 42, section: "ketuvim" },
  { key: "Song of Songs", en: "Song of Songs", he: "שיר השירים", chapters: 8, section: "ketuvim" },
  { key: "Ruth", en: "Ruth", he: "רות", chapters: 4, section: "ketuvim" },
  { key: "Lamentations", en: "Lamentations", he: "איכה", chapters: 5, section: "ketuvim" },
  { key: "Ecclesiastes", en: "Ecclesiastes", he: "קהלת", chapters: 12, section: "ketuvim" },
  { key: "Esther", en: "Esther", he: "אסתר", chapters: 10, section: "ketuvim" },
  { key: "Daniel", en: "Daniel", he: "דניאל", chapters: 12, section: "ketuvim" },
  { key: "Ezra", en: "Ezra", he: "עזרא", chapters: 10, section: "ketuvim" },
  { key: "Nehemiah", en: "Nehemiah", he: "נחמיה", chapters: 13, section: "ketuvim" },
  { key: "I Chronicles", en: "1 Chronicles", he: "דברי הימים א", chapters: 29, section: "ketuvim" },
  { key: "II Chronicles", en: "2 Chronicles", he: "דברי הימים ב", chapters: 36, section: "ketuvim" },
];

export const SECTION_NAMES: Record<Section, { en: string; he: string }> = {
  torah: { en: "Torah", he: "תורה" },
  neviim: { en: "Prophets", he: "נביאים" },
  ketuvim: { en: "Writings", he: "כתובים" },
};

const byKey = new Map(BOOKS.map((b) => [b.key, b]));
export const findBook = (key: string) => byKey.get(key);

/** A chapter or verse reference: "I Samuel 31" or "I Samuel 31:4". */
export interface Ref {
  book: string;
  chapter: number;
  verse?: number;
}

export function parseRef(s: string | null | undefined): Ref | null {
  if (!s) return null;
  const m = /^(.+?)\s+(\d+)(?::(\d+))?$/.exec(s.trim());
  if (!m) return null;
  const book = findBook(m[1]);
  if (!book) return null;
  const chapter = Number(m[2]);
  if (chapter < 1 || chapter > book.chapters) return null;
  const verse = m[3] ? Number(m[3]) : undefined;
  if (verse !== undefined && (verse < 1 || verse > 200)) return null;
  return { book: book.key, chapter, verse };
}

export const refString = (r: Ref) => `${r.book} ${r.chapter}${r.verse ? `:${r.verse}` : ""}`;

const HEB_UNITS = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
const HEB_TENS = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
const HEB_HUNDREDS = ["", "ק", "ר", "ש", "ת"];

/** Hebrew numerals as used for chapters and verses (15 = ט״ו, 16 = ט״ז). */
export function hebNum(n: number): string {
  let s = HEB_HUNDREDS[Math.floor(n / 100)] ?? "";
  const rest = n % 100;
  if (rest === 15) s += "טו";
  else if (rest === 16) s += "טז";
  else s += HEB_TENS[Math.floor(rest / 10)] + HEB_UNITS[rest % 10];
  if (s.length === 1) return s + "׳";
  return s.slice(0, -1) + "״" + s.slice(-1);
}

export function refLabel(s: string, lang: "he" | "en"): string {
  const r = parseRef(s);
  if (!r) return s;
  const b = findBook(r.book)!;
  if (lang === "he") return `${b.he} ${hebNum(r.chapter)}${r.verse ? `, ${hebNum(r.verse)}` : ""}`;
  return `${b.en} ${r.chapter}${r.verse ? `:${r.verse}` : ""}`;
}

/** A reading span as people say it: "Genesis 28:10-32:3" → "בראשית כ״ח, י׳ – ל״ב, ג׳" / "Genesis 28:10–32:3". */
export function spanLabel(s: string, lang: "he" | "en"): string {
  const m = /^(.+?)\s+(\d+):(\d+)\s*-\s*(?:(\d+):)?(\d+)$/.exec(s.trim());
  const b = m && findBook(m[1]);
  if (!m || !b) return s;
  const [c1, v1, c2, v2] = [Number(m[2]), Number(m[3]), m[4] ? Number(m[4]) : Number(m[2]), Number(m[5])];
  if (lang === "he") return `${b.he} ${hebNum(c1)}, ${hebNum(v1)} – ${c2 !== c1 ? `${hebNum(c2)}, ` : ""}${hebNum(v2)}`;
  return `${b.en} ${c1}:${v1}–${c2 !== c1 ? `${c2}:` : ""}${v2}`;
}
