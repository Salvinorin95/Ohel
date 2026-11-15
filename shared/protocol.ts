// Messages between the browser and the server.

export type Lang = "he" | "en";

export interface MapView {
  lng: number;
  lat: number;
  zoom: number;
  pitch: number;
  bearing: number;
  sat: boolean;
}

export interface QuizSide {
  q: string;
  options: string[];
  explain?: string; // sent once the quiz has ended
}

export interface QuizPublic {
  he: QuizSide;
  en: QuizSide;
  ref: string;
  ends: number;
  done: boolean;
  answer?: number; // index into options, sent once the quiz has ended
  solvers: { name: string; avatar: number }[];
}

export type MsgKind = "text" | "question" | "quiz" | "system";

export interface Msg {
  id: number;
  uid: string | null;
  name: string;
  avatar: number;
  kind: MsgKind;
  body: string;
  ref?: string | null;
  place?: string | null;
  view?: MapView | null;
  replyTo?: number | null;
  lights: number;
  lit?: boolean;
  helpful?: boolean;
  hidden?: boolean;
  quiz?: QuizPublic | null;
  at: number;
}

export interface Me {
  id: string;
  name: string;
  avatar: number;
  points: number;
  streak: number;
  mutedUntil: number;
  admin?: boolean; // one of the people who look after the tent
}

export interface Person {
  uid: string;
  name: string;
  avatar: number;
}

export interface RoomInfo {
  id: string;
  title: string;
  title_he?: string | null;
  title_en?: string | null;
  ref?: string | null;
  place?: string | null;
  starter: boolean;
  online: number;
  msgs: number;
  last: number;
}

export type ClientMsg =
  | { t: "hello"; token?: string }
  | { t: "say"; body: string; kind?: "text" | "question"; ref?: string; place?: string; view?: MapView; replyTo?: number; nonce?: string }
  | { t: "light"; id: number }
  | { t: "helpful"; id: number }
  | { t: "report"; id: number }
  | { t: "unsend"; id: number }
  | { t: "quiz" }
  | { t: "answer"; id: number; choice: number }
  | { t: "ping" };

export type ErrorCode =
  | "blocked"
  | "muted"
  | "banned"
  | "rate"
  | "auth"
  | "too_long"
  | "empty"
  | "quiz_busy"
  | "not_found";

export type ServerMsg =
  | { t: "welcome"; room: RoomInfo; history: Msg[]; me: Me | null; online: Person[]; guests: number; staff: string[] }
  | { t: "msg"; msg: Msg }
  | { t: "update"; id: number; lights?: number; helpful?: boolean; hidden?: boolean; quiz?: QuizPublic; msg?: Msg }
  | { t: "presence"; online: Person[]; guests: number }
  | { t: "error"; code: ErrorCode; nonce?: string; until?: number; strikes?: number }
  | { t: "points"; delta: number; total: number; reason: string; badges: string[] }
  | { t: "quizResult"; id: number; correct: boolean; choice: number }
  | { t: "pong" };

/** The question of the day, as everyone sees it (the right answer is not included). */
export interface DailyPublic {
  day: string;
  id: string;
  ref: string;
  he: { q: string; options: string[] };
  en: { q: string; options: string[] };
}
export interface DailyResult {
  choice: number;
  answer: number;
  correct: boolean;
  explain: { he: string; en: string };
}
/** This week's reading (Israel calendar, from Hebcal) and the places on Ohel's map that it mentions. */
export interface WeekInfo {
  date: string;
  name: { he: string; en: string };
  torah: string[]; // "Genesis 28:10-32:3"
  haftarah: string[];
  places: { id: string; n: number }[];
}

export interface Award {
  delta: number;
  total: number;
  badges: string[];
}

// ── looking after the tent (admins only) ─────────────────────────────
export interface AdminUser {
  id: string;
  name: string;
  avatar: number;
  strikes: number;
  mutedUntil: number;
  banned: boolean;
  msgs: number;
  created: number;
}

export interface AdminMsg {
  id: number;
  room: string;
  roomTitle: string;
  uid: string | null;
  name: string;
  avatar: number;
  kind: MsgKind;
  body: string; // the original words, even when hidden
  reports: number;
  hidden: boolean;
  at: number;
  user: AdminUser | null;
}

export interface AdminRoom {
  id: string;
  title: string;
  by: string;
  msgs: number;
  created: number;
  last: number;
}

export interface AdminData {
  stats: { people: number; newWeek: number; msgsDay: number; msgsWeek: number; rooms: number; online: number; guests: number };
  reported: AdminMsg[];
  latest: AdminMsg[];
  people: AdminUser[];
  rooms: AdminRoom[];
}

export type AdminAction =
  | { on: "msg"; id: number; action: "hide" | "restore" }
  | { on: "user"; id: string; action: "mute_hour" | "mute_day" | "unmute" | "ban" | "unban" }
  | { on: "room"; id: string; action: "delete" };
