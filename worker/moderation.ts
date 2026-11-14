// Keeps slurs and curses out of Ohel, in Hebrew and English.
//
// The Bible's own vocabulary stays allowed: "זונה" (Rahab, Jephthah's mother),
// "הכושי" (the runner in 2 Samuel 18), "כוס" (a cup), "ass" (Balaam's donkey),
// "shittim" (acacia wood), "bastard", "whore" and "piss" (all in the KJV).
// Only the insulting phrases built from them are blocked.

export type Severity = 1 | 2; // 1 = curse, 2 = slur or hate

const CONFUSABLE: Record<string, string> = {
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "і": "i", "ѕ": "s", "ј": "j", "ԁ": "d", "ӏ": "l",
};
const FINALS: Record<string, string> = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
const LEET: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "9": "g", "@": "a", "$": "s", "!": "i", "|": "i",
};

/** Lower-case, strip accents, niqqud, cantillation and invisible characters, unify look-alike and final letters. */
export function baseNormalize(text: string): string {
  let s = text.normalize("NFKD").toLowerCase();
  s = s.replace(/[־׀׃׆]/g, " "); // maqaf, paseq, sof pasuq, nun hafukha act as spaces
  s = s.replace(/[̀-֑ͯ-ׇ]/g, ""); // Latin accents, Hebrew points and cantillation
  s = s.replace(/[​-‏‪-‮⁠-⁤﻿­]/g, "");
  let out = "";
  for (const c of s) out += CONFUSABLE[c] ?? FINALS[c] ?? c;
  return out;
}

const JOINERS = /[.*_\-~'"`׳״+]/g;
const LETTER = /[a-zא-ת]/;

function leet(token: string): string {
  if (!LETTER.test(token)) return token; // leave plain numbers alone ("1 Samuel 31")
  let out = "";
  for (const c of token) out += LEET[c] ?? c;
  return out;
}

function tokenize(s: string): string[] {
  return s
    .split(/[^a-z0-9א-ת@$!|]+/)
    .map(leet)
    .map((t) => t.replace(/[^a-z0-9א-ת]/g, ""))
    .filter(Boolean);
}

/** "f u c k" → "fuck": runs of three or more single letters are glued back together. */
function glueSpaced(tokens: string[]): string[] {
  const out: string[] = [];
  let run = "";
  let n = 0;
  const flush = () => {
    if (n >= 3) out.push(run);
    run = "";
    n = 0;
  };
  for (const t of tokens) {
    if (t.length === 1) {
      run += t;
      n++;
    } else flush();
  }
  flush();
  return out;
}

const HE_PREFIX = "(?:[והשלבכמ]{0,2})";
const EN_SUFFIX = "(?:s|es|ed|er|ers|ing|in|y|ies)?";
const HE_SUFFIX = "(?:ים|ות|ית|ת|ה)?";

const isHebrew = (w: string) => /[א-ת]/.test(w);
const stretch = (w: string) =>
  [...baseNormalize(w)].map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "+").join("");

interface Rule {
  re: RegExp;
  sev: Severity;
  on: "token" | "text" | "raw";
}
const rules: Rule[] = [];

/** Blocked anywhere inside a word ("bullshitting", "בנזונה"). */
function inside(sev: Severity, ...words: string[]) {
  for (const w of words) rules.push({ re: new RegExp(stretch(w)), sev, on: "token" });
}
/** Blocked as a whole word, with ordinary prefixes (Hebrew) or suffixes. */
function word(sev: Severity, ...words: string[]) {
  for (const w of words) {
    const he = isHebrew(w);
    rules.push({ re: new RegExp(`^${he ? HE_PREFIX : ""}${stretch(w)}${he ? HE_SUFFIX : EN_SUFFIX}$`), sev, on: "token" });
  }
}
/** Blocked as a whole word exactly as written (no prefixes), e.g. "כושי" but not "הכושי". */
function exact(sev: Severity, ...words: string[]) {
  for (const w of words) rules.push({ re: new RegExp(`^${stretch(w)}$`), sev, on: "token" });
}
/** A pattern over the normalized text (words separated by single spaces). */
function phrase(sev: Severity, pattern: string) {
  rules.push({ re: new RegExp(`(?:^| )(?:${baseNormalize(pattern)})(?: |$)`), sev, on: "text" });
}
/** A pattern over the lower-cased text with punctuation kept (for spellings that need an apostrophe). */
function raw(sev: Severity, pattern: string) {
  rules.push({ re: new RegExp(pattern), sev, on: "raw" });
}

// ── Slurs and hate (severity 2) ─────────────────────────────────────
inside(2, "nigger", "nigga", "faggot", "sandnigger", "raghead", "towelhead", "wetback", "christkiller", "jewboy", "holohoax", "shiksa", "shikse", "tranny", "trannies", "жид");
word(2, "kike", "spic", "chink", "gook", "coon", "fag", "dyke", "heeb", "hymie", "beaner", "paki", "aravush");
inside(2, "ערבוש", "קוקסינל", "אשכנאצי", "פרענק");
word(2, "יהודונ");
exact(2, "כושי", "כושים", "כושית", "כושון", "כושונים");
raw(2, "צ['׳]ח['׳]?צ['׳]ח");
raw(2, "(^|\\D)1488(\\D|$)");
phrase(2, "(death|deth) to( all)?( the)? (jews|arabs|muslims|christians|gays|blacks|whites|druze)");
phrase(2, "kill( all)?( the)? (jews|arabs|muslims|christians|gays|blacks)");
phrase(2, "gas the (jews|kikes)");
phrase(2, "(heil|sieg heil) hitler|sieg heil|hitler (was|is) right|white power");
phrase(2, "מוות ל(ערבים|יהודים|נוצרים|מוסלמים|דרוזים|הומואים|אתיופים|רוסים)");
phrase(2, "(הומו|הומואים|לסבית|לסביות|ערבי|ערבים|יהודי|יהודים|אתיופי|אתיופים|רוסי|רוסים|מרוקאי|מרוקאים|דוס|דוסים|חילוני|חילונים|נוצרי|נוצרים|מוסלמי|מוסלמים|דתי|דתיים) (מסריח|מסריחים|מסריחה|מגעיל|מגעילים|מגעילה|זבל|מזדיין|מזדיינים)");

// ── Curses (severity 1) ────────────────────────────────────────────
inside(1, "fuck", "fck", "motherf", "cunt", "cocksuck", "asshole", "bullshit", "horseshit", "shithead", "dipshit", "dumbass", "dickhead", "wanker", "twat", "bitch", "slut", "dildo", "porn", "jerkoff", "blowjob", "sonofabitch");
word(1, "shit", "fuk", "fuq", "stfu", "tits", "titties", "retard", "manyak", "kusemek", "kusima", "kibinimat", "sharmuta");
inside(1, "שרמוט", "בנזונ", "בתזונ", "זדיינ", "כוסאמ", "כוסעמק", "כוסאחות", "כוסאחת", "כוסאוחת", "כוסראבאכ", "קיבינימט");
word(1, "מניאק", "מפגר", "חרא", "סעמק", "סעמאק");
exact(1, "שתמות", "שתמותי", "שתמותו");
phrase(1, "(בנ|בת|יא|יה|איזה) (זונה|זונות|שרמוטה)");
phrase(1, "ו?כו+ס+ ?(אמא|אמק|אמכ|אמו|אמה|אמאשכ|אמאשלכ|עמק|עמכ|אחותכ|אחתכ|אוחתק|אחותק|ראבאכ|רבאכ|אבוכ)");
phrase(1, "על ה?זינ|(תמצוצ|למצוצ|מצוצ|מוצצ|יא) (לי )?(את )?ה?זינ|זיינ אותכ|לכ תזדיינ");
phrase(1, "(kus|cus) ?(emek|ima|imak|ochtak|okhtak|achotak)|(ben|bat|ya) zona|son of a (bitch|whore)|go to hell");
phrase(1, "piece of shit|eat shit|suck (my|a) (dick|cock)|kiss my ass");

export interface Verdict {
  ok: boolean;
  severity?: Severity;
}

export function check(text: string): Verdict {
  const base = baseNormalize(text);
  const natural = tokenize(base);
  const squashed = tokenize(base.replace(JOINERS, ""));
  const glued = glueSpaced(natural);
  const tokens = [...new Set([...natural, ...squashed, ...glued])];
  const joined = natural.join(" ");
  const rawText = base;

  let worst: Severity | 0 = 0;
  for (const r of rules) {
    if (r.sev <= worst) continue;
    const hit =
      r.on === "token" ? tokens.some((t) => r.re.test(t)) : r.on === "text" ? r.re.test(joined) : r.re.test(rawText);
    if (hit) worst = r.sev;
  }
  return worst ? { ok: false, severity: worst } : { ok: true };
}

const RESERVED = /(admin|moderator|^mod$|ohel|staff|official|אוהל|מנהל|מודרטור|צוות)/;

/** Display names: 2–24 characters, letters/digits/spaces, clean, and not pretending to be staff. */
export function checkName(name: string): { ok: true; name: string } | { ok: false; reason: "length" | "chars" | "blocked" | "reserved" } {
  const n = name.normalize("NFC").replace(/\s+/g, " ").trim();
  if ([...n].length < 2 || [...n].length > 24) return { ok: false, reason: "length" };
  if (!/^[\p{L}\p{M}\p{N} ._'\-]+$/u.test(n)) return { ok: false, reason: "chars" };
  if (!check(n).ok) return { ok: false, reason: "blocked" };
  if (RESERVED.test(baseNormalize(n))) return { ok: false, reason: "reserved" };
  return { ok: true, name: n };
}
