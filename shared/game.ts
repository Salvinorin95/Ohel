// Points, levels and badges. The server awards them; the client only displays them.

export const POINTS = {
  read: 5, // a chapter read (once per chapter per day)
  message: 1, // a message in a room (daily cap below)
  question: 2, // asking a question
  lightReceived: 2, // someone lit up your message
  helpful: 10, // your answer was marked helpful by the asker
  quizCorrect: 5,
  quizFirst: 3, // bonus for the first correct answer
  quizTogether: 2, // bonus for everyone when 2+ people solve it
  place: 2, // first visit to a place on the map
  room: 5, // opening a room
  dayStreak: 3, // first activity of the day
  daily: 6, // the question of the day, answered right
  dailyTry: 2, // the question of the day, answered (not right)
} as const;

export const DAILY_CAPS: Partial<Record<keyof typeof POINTS, number>> = {
  message: 25,
  question: 5,
  lightReceived: 15,
  room: 3,
};

export const LEVELS = [
  { at: 0, en: "Seed", he: "זרע" },
  { at: 30, en: "Sprout", he: "נבט" },
  { at: 100, en: "Root", he: "שורש" },
  { at: 250, en: "Branch", he: "ענף" },
  { at: 600, en: "Tree", he: "עץ" },
  { at: 1500, en: "Forest", he: "יער" },
  { at: 4000, en: "Light", he: "אור" },
];

export function levelFor(points: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && points >= LEVELS[i + 1].at) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  const progress = next ? (points - cur.at) / (next.at - cur.at) : 1;
  return { index: i, ...cur, next, progress };
}

export interface Stats {
  msgs: number;
  reads: number;
  places: number;
  quiz_ok: number;
  helpful: number;
  lights_got: number;
  rooms: number;
  questions: number;
  samuel_reads: number;
  best_streak: number;
  gilboa: number; // 1 = read I Samuel 31 and visited Gilboa
}

/** What badges look at: the stored counters plus the longest run of daily-question days. */
export type BadgeStats = Stats & { daily_best?: number };

export interface BadgeDef {
  id: string;
  glyph: string;
  en: string;
  he: string;
  how: { en: string; he: string };
  earned: (s: BadgeStats) => boolean;
}

export const BADGES: BadgeDef[] = [
  { id: "first_words", glyph: "💬", en: "First Words", he: "מילים ראשונות", how: { en: "Say something in a room", he: "לכתוב משהו בחדר" }, earned: (s) => s.msgs >= 1 },
  { id: "open_book", glyph: "📖", en: "Opened the Book", he: "פתחתי את הספר", how: { en: "Read your first chapter", he: "לקרוא פרק ראשון" }, earned: (s) => s.reads >= 1 },
  { id: "deep_reader", glyph: "🌊", en: "Deep Reader", he: "קורא מעמיק", how: { en: "Read 10 chapters", he: "לקרוא 10 פרקים" }, earned: (s) => s.reads >= 10 },
  { id: "scroll_keeper", glyph: "🌀", en: "Scroll Keeper", he: "שומר המגילה", how: { en: "Read 50 chapters", he: "לקרוא 50 פרקים" }, earned: (s) => s.reads >= 50 },
  { id: "wanderer", glyph: "🧭", en: "Wanderer", he: "נווד", how: { en: "Explore 5 places on the map", he: "לבקר ב־5 מקומות במפה" }, earned: (s) => s.places >= 5 },
  { id: "cartographer", glyph: "🗺️", en: "Cartographer", he: "משרטט מפות", how: { en: "Explore 20 places", he: "לבקר ב־20 מקומות" }, earned: (s) => s.places >= 20 },
  { id: "gilboa", glyph: "⛰️", en: "Mountains of Gilboa", he: "הרי הגלבוע", how: { en: "Read 1 Samuel 31 and stand on Gilboa in the map", he: "לקרוא את שמואל א ל״א ולעמוד על הגלבוע במפה" }, earned: (s) => s.gilboa >= 1 },
  { id: "house_of_david", glyph: "🎶", en: "House of David", he: "בית דוד", how: { en: "Read 10 chapters of Samuel", he: "לקרוא 10 פרקים בספר שמואל" }, earned: (s) => s.samuel_reads >= 10 },
  { id: "spark", glyph: "⚡", en: "Spark", he: "ניצוץ", how: { en: "Answer a quiz right", he: "לענות נכון על חידה" }, earned: (s) => s.quiz_ok >= 1 },
  { id: "owl_mind", glyph: "🦉", en: "Owl Mind", he: "ראש ינשוף", how: { en: "Answer 10 quizzes right", he: "לענות נכון על 10 חידות" }, earned: (s) => s.quiz_ok >= 10 },
  { id: "curious", glyph: "🔮", en: "Curious", he: "סקרן", how: { en: "Ask 5 questions", he: "לשאול 5 שאלות" }, earned: (s) => s.questions >= 5 },
  { id: "guide", glyph: "🔦", en: "Guide", he: "מורה דרך", how: { en: "Give an answer marked helpful", he: "לתת תשובה שסומנה כמועילה" }, earned: (s) => s.helpful >= 1 },
  { id: "wellspring", glyph: "💧", en: "Wellspring", he: "מעיין", how: { en: "10 helpful answers", he: "10 תשובות מועילות" }, earned: (s) => s.helpful >= 10 },
  { id: "lantern", glyph: "🏮", en: "Lantern", he: "פנס", how: { en: "Your words lit up others 10 times", he: "המילים שלך האירו לאחרים 10 פעמים" }, earned: (s) => s.lights_got >= 10 },
  { id: "tent_opener", glyph: "⛺", en: "Tent Opener", he: "פותח אוהל", how: { en: "Open a room", he: "לפתוח חדר" }, earned: (s) => s.rooms >= 1 },
  { id: "seven_days", glyph: "🌙", en: "Seven Days", he: "שבעה ימים", how: { en: "Come back 7 days in a row", he: "לחזור 7 ימים ברצף" }, earned: (s) => s.best_streak >= 7 },
  { id: "daily_seven", glyph: "🔥", en: "Seven Questions", he: "שבע שאלות", how: { en: "Answer the question of the day 7 days in a row", he: "לענות על שאלת היום 7 ימים ברצף" }, earned: (s) => (s.daily_best ?? 0) >= 7 },
];

export const findBadge = (id: string) => BADGES.find((b) => b.id === id);

/** The eight avatar orbs: each is a pair of hues. */
export const ORBS: [number, number][] = [
  [300, 190], [270, 45], [190, 320], [140, 280], [20, 300], [50, 170], [330, 220], [230, 90],
];
