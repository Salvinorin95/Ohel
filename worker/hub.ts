import { DurableObject } from "cloudflare:workers";
import { BADGES, DAILY_CAPS, POINTS, type Stats } from "../shared/game.ts";
import { findBook, parseRef, refString } from "../shared/books.ts";
import { findPlace } from "../shared/places.ts";
import type { AdminAction, AdminData, AdminMsg, AdminUser, ClientMsg, ErrorCode, MapView, Me, Msg, Person, QuizPublic, RoomInfo, ServerMsg } from "../shared/protocol.ts";
import { check, checkName, type Severity } from "./moderation.ts";
import { findQuestion, pickQuestion } from "./quiz.ts";

// One Durable Object holds the whole community: people, rooms, messages, points.
// Each open room is a set of hibernating WebSockets tagged with the room id.

const HOUR = 3600_000;
const DAY = 24 * HOUR;
const HISTORY = 80;
const QUIZ_MS = 25_000;
const MAX_BODY = 800;

type PointKind = keyof typeof POINTS;

interface Attachment {
  room: string;
  uid: string | null;
  name: string;
  avatar: number;
}

interface QuizState {
  qid: string;
  order: number[]; // order[shown index] = original index; original 0 is right
  ends: number;
  done: boolean;
  solvers: { uid: string; name: string; avatar: number }[];
}

interface UserRow extends Stats {
  id: string;
  name: string;
  avatar: number;
  points: number;
  last_day: string | null;
  streak: number;
  strikes: number;
  last_strike: number;
  muted_until: number;
  banned: number;
  ip_hash: string | null;
  week: string | null;
  week_points: number;
  [k: string]: SqlStorageValue;
}

interface MsgRow {
  id: number;
  room: string;
  uid: string | null;
  name: string;
  avatar: number;
  kind: string;
  body: string;
  ref: string | null;
  place: string | null;
  view: string | null;
  reply_to: number | null;
  lights: number;
  helpful: number;
  hidden: number;
  reports: number;
  quiz: string | null;
  at: number;
  [k: string]: SqlStorageValue;
}

interface RoomRow {
  id: string;
  title: string;
  title_he: string | null;
  title_en: string | null;
  ref: string | null;
  place: string | null;
  created_by: string | null;
  created_at: number;
  last_at: number;
  msgs: number;
  starter: number;
  recent_quiz: string;
  quiz_open: number | null;
  [k: string]: SqlStorageValue;
}

const STARTER_ROOMS: Omit<RoomRow, "created_by" | "created_at" | "last_at" | "msgs" | "starter" | "recent_quiz" | "quiz_open">[] = [
  { id: "gilboa", title: "", title_en: "Saul's last battle on Mount Gilboa", title_he: "הקרב האחרון של שאול בהר הגלבוע", ref: "I Samuel 31", place: "gilboa" },
  { id: "david-king", title: "", title_en: "David the king and his stories", title_he: "דוד המלך והסיפורים שלו", ref: "II Samuel 5", place: "cityofdavid" },
  { id: "elah", title: "", title_en: "David and Goliath in the Valley of Elah", title_he: "דוד וגלית בעמק האלה", ref: "I Samuel 17", place: "elah" },
  { id: "carmel", title: "", title_en: "Elijah on Mount Carmel", title_he: "אליהו בהר הכרמל", ref: "I Kings 18", place: "carmel" },
  { id: "beginning", title: "", title_en: "In the beginning", title_he: "בראשית", ref: "Genesis 1", place: null },
  { id: "ruth", title: "", title_en: "Ruth in the fields of Bethlehem", title_he: "רות בשדות בית לחם", ref: "Ruth 1", place: "bethlehem" },
  { id: "jonah", title: "", title_en: "Jonah, the sea and Nineveh", title_he: "יונה, הים ונינוה", ref: "Jonah 1", place: "nineveh" },
  { id: "open-tent", title: "", title_en: "The open tent: anything goes", title_he: "האוהל הפתוח: על הכל", ref: null, place: null },
];

const today = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
function weekOf(t = Date.now()) {
  const d = new Date(t);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay()); // weeks start on Sunday
  return d.toISOString().slice(0, 10);
}

function randomId(bytes = 9) {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(s: string) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const fail = (code: string, status = 400, extra: Record<string, unknown> = {}) => json({ error: code, ...extra }, status);

function cleanView(v: unknown): MapView | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const n = (x: unknown, lo: number, hi: number) => (typeof x === "number" && Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : null);
  const lng = n(o.lng, -180, 180), lat = n(o.lat, -85, 85), zoom = n(o.zoom, 1, 20);
  if (lng === null || lat === null || zoom === null) return null;
  return { lng, lat, zoom, pitch: n(o.pitch, 0, 85) ?? 0, bearing: n(o.bearing, -180, 180) ?? 0, sat: o.sat !== false };
}

export class Hub extends DurableObject<Env> {
  private sql: SqlStorage;
  private salt = "";
  private rate = new Map<string, number[]>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.migrate();
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('{"t":"ping"}', '{"t":"pong"}'));
  }

  // ── storage ─────────────────────────────────────────────────────────
  private migrate() {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, avatar INTEGER NOT NULL, token_hash TEXT UNIQUE NOT NULL,
        points INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL, last_day TEXT, streak INTEGER NOT NULL DEFAULT 0,
        best_streak INTEGER NOT NULL DEFAULT 0, strikes INTEGER NOT NULL DEFAULT 0, last_strike INTEGER NOT NULL DEFAULT 0,
        muted_until INTEGER NOT NULL DEFAULT 0, banned INTEGER NOT NULL DEFAULT 0, ip_hash TEXT,
        msgs INTEGER NOT NULL DEFAULT 0, reads INTEGER NOT NULL DEFAULT 0, places INTEGER NOT NULL DEFAULT 0,
        quiz_ok INTEGER NOT NULL DEFAULT 0, helpful INTEGER NOT NULL DEFAULT 0, lights_got INTEGER NOT NULL DEFAULT 0,
        rooms INTEGER NOT NULL DEFAULT 0, questions INTEGER NOT NULL DEFAULT 0, samuel_reads INTEGER NOT NULL DEFAULT 0,
        gilboa INTEGER NOT NULL DEFAULT 0, week TEXT, week_points INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS daily (uid TEXT, day TEXT, kind TEXT, n INTEGER, PRIMARY KEY (uid, day, kind));
      CREATE TABLE IF NOT EXISTS chapters (uid TEXT, ref TEXT, last_day TEXT, PRIMARY KEY (uid, ref));
      CREATE TABLE IF NOT EXISTS visits (uid TEXT, place TEXT, at INTEGER, PRIMARY KEY (uid, place));
      CREATE TABLE IF NOT EXISTS badges (uid TEXT, badge TEXT, at INTEGER, PRIMARY KEY (uid, badge));
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY, title TEXT NOT NULL DEFAULT '', title_he TEXT, title_en TEXT, ref TEXT, place TEXT,
        created_by TEXT, created_at INTEGER, last_at INTEGER, msgs INTEGER NOT NULL DEFAULT 0, starter INTEGER NOT NULL DEFAULT 0,
        recent_quiz TEXT NOT NULL DEFAULT '[]', quiz_open INTEGER
      );
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT NOT NULL, uid TEXT, name TEXT NOT NULL, avatar INTEGER NOT NULL,
        kind TEXT NOT NULL, body TEXT NOT NULL, ref TEXT, place TEXT, view TEXT, reply_to INTEGER,
        lights INTEGER NOT NULL DEFAULT 0, helpful INTEGER NOT NULL DEFAULT 0, hidden INTEGER NOT NULL DEFAULT 0,
        reports INTEGER NOT NULL DEFAULT 0, quiz TEXT, at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS messages_room ON messages (room, id);
      CREATE TABLE IF NOT EXISTS lights (msg INTEGER, uid TEXT, PRIMARY KEY (msg, uid));
      CREATE TABLE IF NOT EXISTS reports (msg INTEGER, uid TEXT, PRIMARY KEY (msg, uid));
      CREATE TABLE IF NOT EXISTS answers (msg INTEGER, uid TEXT, choice INTEGER, correct INTEGER, at INTEGER, PRIMARY KEY (msg, uid));
      CREATE TABLE IF NOT EXISTS bans (ip_hash TEXT PRIMARY KEY, until INTEGER);
      CREATE TABLE IF NOT EXISTS joins (ip_hash TEXT, day TEXT, n INTEGER, PRIMARY KEY (ip_hash, day));
    `);
    const salt = this.sql.exec<{ v: string }>("SELECT v FROM meta WHERE k = 'salt'").toArray()[0];
    if (salt) this.salt = salt.v;
    else {
      this.salt = randomId(16);
      this.sql.exec("INSERT INTO meta (k, v) VALUES ('salt', ?)", this.salt);
    }
    const now = Date.now();
    for (const r of STARTER_ROOMS) {
      this.sql.exec(
        `INSERT INTO rooms (id, title, title_he, title_en, ref, place, created_at, last_at, starter) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON CONFLICT (id) DO UPDATE SET title_he = excluded.title_he, title_en = excluded.title_en, ref = excluded.ref, place = excluded.place`,
        r.id, r.title_en, r.title_he, r.title_en, r.ref, r.place, now, 0,
      );
    }
  }

  private one<T extends Record<string, SqlStorageValue>>(q: string, ...args: unknown[]): T | undefined {
    return this.sql.exec<T>(q, ...args).toArray()[0];
  }

  private user(id: string | null | undefined) {
    return id ? this.one<UserRow>("SELECT * FROM users WHERE id = ?", id) : undefined;
  }

  private async userByToken(token: string | null | undefined) {
    if (!token || token.length > 200) return undefined;
    const u = this.one<UserRow>("SELECT * FROM users WHERE token_hash = ?", await sha256(token));
    return u && !u.banned ? u : undefined;
  }

  private meOf(u: UserRow): Me {
    return { id: u.id, name: u.name, avatar: u.avatar, points: u.points, streak: u.streak, mutedUntil: u.muted_until, ...(this.isAdmin(u.id) ? { admin: true } : {}) };
  }

  /** The people who look after the tent: user ids in the ADMIN_IDS secret, comma separated. */
  private adminIds(): string[] {
    return String(this.env.ADMIN_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private isAdmin(uid: string | null | undefined) {
    return !!uid && this.adminIds().includes(uid);
  }

  // ── points and badges ───────────────────────────────────────────────
  /** Award points of a kind (respecting daily caps and the day streak), then check for new badges. */
  private award(uid: string, kind: PointKind | null, extra = 0): { delta: number; total: number; badges: string[] } {
    const u = this.user(uid);
    if (!u) return { delta: 0, total: 0, badges: [] };
    const day = today();
    let delta = extra;

    if (kind) {
      let allowed = true;
      const cap = DAILY_CAPS[kind];
      if (cap) {
        const row = this.one<{ n: number }>("SELECT n FROM daily WHERE uid = ? AND day = ? AND kind = ?", uid, day, kind);
        if ((row?.n ?? 0) >= cap) allowed = false;
        else this.sql.exec("INSERT INTO daily (uid, day, kind, n) VALUES (?, ?, ?, 1) ON CONFLICT DO UPDATE SET n = n + 1", uid, day, kind);
      }
      if (allowed) delta += POINTS[kind];
    }

    let { streak, best_streak } = u;
    if (u.last_day !== day) {
      streak = u.last_day === today(Date.now() - DAY) ? u.streak + 1 : 1;
      best_streak = Math.max(best_streak, streak);
      delta += POINTS.dayStreak;
    }
    const week = weekOf();
    const weekPoints = (u.week === week ? u.week_points : 0) + delta;
    this.sql.exec(
      "UPDATE users SET points = points + ?, last_day = ?, streak = ?, best_streak = ?, week = ?, week_points = ? WHERE id = ?",
      delta, day, streak, best_streak, week, weekPoints, uid,
    );
    return { delta, total: u.points + delta, badges: this.checkBadges(uid) };
  }

  private bump(uid: string, column: keyof Stats, by = 1) {
    this.sql.exec(`UPDATE users SET ${column} = ${column} + ? WHERE id = ?`, by, uid);
  }

  private checkBadges(uid: string): string[] {
    const u = this.user(uid);
    if (!u) return [];
    const have = new Set(this.sql.exec<{ badge: string }>("SELECT badge FROM badges WHERE uid = ?", uid).toArray().map((r) => r.badge));
    const fresh: string[] = [];
    for (const b of BADGES) {
      if (!have.has(b.id) && b.earned(u)) {
        this.sql.exec("INSERT INTO badges (uid, badge, at) VALUES (?, ?, ?)", uid, b.id, Date.now());
        fresh.push(b.id);
      }
    }
    return fresh;
  }

  /** Tell everyone signed in as `uid` (any room, any tab) about points they just got. */
  private notifyPoints(uid: string, reason: string, a: { delta: number; total: number; badges: string[] }) {
    if (!a.delta && !a.badges.length) return;
    const m: ServerMsg = { t: "points", reason, ...a };
    for (const ws of this.ctx.getWebSockets()) {
      const at = ws.deserializeAttachment() as Attachment | null;
      if (at?.uid === uid) this.send(ws, m);
    }
  }

  // ── moderation ──────────────────────────────────────────────────────
  /** Strikes fade by one per clean week. 3 → muted an hour, 6 → muted a day, 9 → gone. */
  private strike(uid: string, n: Severity) {
    const u = this.user(uid);
    if (!u) return { strikes: 0, until: 0 };
    const now = Date.now();
    const faded = Math.max(0, u.strikes - Math.floor((now - u.last_strike) / (7 * DAY)));
    const strikes = faded + n;
    let until = u.muted_until;
    let banned = 0;
    if (strikes >= 9) banned = 1;
    else if (strikes >= 6) until = Math.max(until, now + DAY);
    else if (strikes >= 3) until = Math.max(until, now + HOUR);
    this.sql.exec("UPDATE users SET strikes = ?, last_strike = ?, muted_until = ? WHERE id = ?", strikes, now, until, uid);
    if (banned) this.ban(uid);
    return { strikes, until, banned };
  }

  /** No more posting, and no new sign-ups from the same address for 30 days. */
  private ban(uid: string) {
    const u = this.user(uid);
    if (!u) return;
    this.sql.exec("UPDATE users SET banned = 1 WHERE id = ?", uid);
    if (u.ip_hash) this.sql.exec("INSERT OR REPLACE INTO bans (ip_hash, until) VALUES (?, ?)", u.ip_hash, Date.now() + 30 * DAY);
    for (const ws of this.ctx.getWebSockets()) {
      const at = ws.deserializeAttachment() as Attachment | null;
      if (at?.uid === uid) {
        this.send(ws, { t: "error", code: "banned" });
        ws.close(4003, "banned");
      }
    }
  }

  private rateOk(uid: string) {
    const now = Date.now();
    const recent = (this.rate.get(uid) ?? []).filter((t) => now - t < 10_000);
    if (recent.length >= 6) return false;
    recent.push(now);
    this.rate.set(uid, recent);
    return true;
  }

  // ── rooms and messages ──────────────────────────────────────────────
  private room(id: string) {
    return this.one<RoomRow>("SELECT * FROM rooms WHERE id = ?", id);
  }

  private roomInfo(r: RoomRow): RoomInfo {
    return {
      id: r.id, title: r.title, title_he: r.title_he, title_en: r.title_en, ref: r.ref, place: r.place,
      starter: !!r.starter, online: this.ctx.getWebSockets(r.id).length, msgs: r.msgs, last: r.last_at,
    };
  }

  private quizPublic(q: QuizState): QuizPublic {
    const Q = findQuestion(q.qid)!;
    const side = (L: "he" | "en") => ({
      q: Q[L].q,
      options: q.order.map((i) => Q[L].options[i]),
      ...(q.done ? { explain: Q[L].explain } : {}),
    });
    return {
      he: side("he"), en: side("en"), ref: Q.ref, ends: q.ends, done: q.done,
      ...(q.done ? { answer: q.order.indexOf(0) } : {}),
      solvers: q.solvers.map(({ name, avatar }) => ({ name, avatar })),
    };
  }

  private toMsg(r: MsgRow, lit = false): Msg {
    const hidden = !!r.hidden;
    return {
      id: r.id, uid: r.uid, name: r.name, avatar: r.avatar, kind: r.kind as Msg["kind"],
      body: hidden ? "" : r.body, ref: hidden ? null : r.ref, place: hidden ? null : r.place,
      view: hidden || !r.view ? null : JSON.parse(r.view), replyTo: r.reply_to, lights: r.lights, lit,
      helpful: !!r.helpful, hidden, quiz: r.quiz && !hidden ? this.quizPublic(JSON.parse(r.quiz)) : null, at: r.at,
    };
  }

  private send(ws: WebSocket, m: ServerMsg) {
    try {
      ws.send(JSON.stringify(m));
    } catch {
      /* socket already gone */
    }
  }

  private broadcast(room: string, m: ServerMsg) {
    const s = JSON.stringify(m);
    for (const ws of this.ctx.getWebSockets(room)) {
      try {
        ws.send(s);
      } catch {
        /* closed */
      }
    }
  }

  private presence(room: string, except?: WebSocket) {
    const people = new Map<string, Person>();
    let guests = 0;
    for (const ws of this.ctx.getWebSockets(room)) {
      if (ws === except || ws.readyState !== WebSocket.OPEN) continue;
      const at = ws.deserializeAttachment() as Attachment | null;
      if (at?.uid) people.set(at.uid, { uid: at.uid, name: at.name, avatar: at.avatar });
      else guests++;
    }
    return { online: [...people.values()], guests };
  }

  private insertMsg(room: string, m: Omit<MsgRow, "id" | "room" | "lights" | "helpful" | "hidden" | "reports" | "at">): MsgRow {
    const at = Date.now();
    const row = this.one<MsgRow>(
      `INSERT INTO messages (room, uid, name, avatar, kind, body, ref, place, view, reply_to, quiz, at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      room, m.uid, m.name, m.avatar, m.kind, m.body, m.ref, m.place, m.view, m.reply_to, m.quiz, at,
    )!;
    this.sql.exec("UPDATE rooms SET last_at = ?, msgs = msgs + 1 WHERE id = ?", at, room);
    return row;
  }

  // ── HTTP ────────────────────────────────────────────────────────────
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    const ws = /^\/api\/rooms\/([\w-]{1,40})\/ws$/.exec(path);
    if (ws) {
      if (req.headers.get("upgrade") !== "websocket") return fail("expected_websocket", 426);
      const room = this.room(ws[1]);
      if (!room) return fail("not_found", 404);
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1], [room.id]);
      pair[1].serializeAttachment({ room: room.id, uid: null, name: "", avatar: 0 } satisfies Attachment);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    if (path === "/api/join" && method === "POST") return this.join(req);
    if (path === "/api/rooms" && method === "GET") return this.listRooms();
    if (path === "/api/leaderboard" && method === "GET") return this.leaderboard();
    const roomMatch = /^\/api\/rooms\/([\w-]{1,40})$/.exec(path);
    if (roomMatch && method === "GET") {
      const r = this.room(roomMatch[1]);
      return r ? json(this.roomInfo(r)) : fail("not_found", 404);
    }

    const me = await this.userByToken(auth);
    if (!me) return fail("auth", 401);
    if (path === "/api/me" && method === "GET") return this.profile(me);
    if (path === "/api/me" && method === "DELETE") return this.deleteMe(me);
    if (path === "/api/rooms" && method === "POST") return this.createRoom(me, req);
    if (path === "/api/read" && method === "POST") return this.read(me, req);
    if (path === "/api/visit" && method === "POST") return this.visit(me, req);
    if (path.startsWith("/api/admin")) {
      if (!this.isAdmin(me.id)) return fail("forbidden", 403);
      if (path === "/api/admin" && method === "GET") return json(this.adminData());
      if (path === "/api/admin" && method === "POST") return this.adminAct(me, (await this.body(req)) as unknown as AdminAction);
    }
    return fail("not_found", 404);
  }

  private async body(req: Request): Promise<Record<string, unknown>> {
    try {
      const b = await req.json();
      return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }

  private async join(req: Request) {
    const b = await this.body(req);
    const checked = checkName(String(b.name ?? ""));
    if (!checked.ok) return fail(`name_${checked.reason}`);
    const avatar = Math.max(0, Math.min(7, Math.floor(Number(b.avatar) || 0)));
    const rawIp = req.headers.get("x-ohel-ip") ?? "";
    // A classroom or a family can share one address, so the daily limit is generous; local dev is exempt.
    const ip = rawIp === "127.0.0.1" || rawIp === "::1" ? "" : rawIp;
    const ipHash = ip ? (await sha256(this.salt + ip)).slice(0, 32) : null;
    const day = today();
    if (ipHash) {
      const ban = this.one<{ until: number }>("SELECT until FROM bans WHERE ip_hash = ?", ipHash);
      if (ban && ban.until > Date.now()) return fail("banned", 403);
      const j = this.one<{ n: number }>("SELECT n FROM joins WHERE ip_hash = ? AND day = ?", ipHash, day);
      if ((j?.n ?? 0) >= 30) return fail("rate", 429);
      this.sql.exec("INSERT INTO joins (ip_hash, day, n) VALUES (?, ?, 1) ON CONFLICT DO UPDATE SET n = n + 1", ipHash, day);
    }
    const id = randomId(9);
    const token = `ohel_${randomId(24)}`;
    this.sql.exec(
      "INSERT INTO users (id, name, avatar, token_hash, created, ip_hash) VALUES (?, ?, ?, ?, ?, ?)",
      id, checked.name, avatar, await sha256(token), Date.now(), ipHash,
    );
    this.award(id, null);
    return json({ token, me: this.meOf(this.user(id)!) });
  }

  private profile(u: UserRow) {
    const badges = this.sql.exec<{ badge: string; at: number }>("SELECT badge, at FROM badges WHERE uid = ? ORDER BY at", u.id).toArray();
    const stats: Stats = {
      msgs: u.msgs, reads: u.reads, places: u.places, quiz_ok: u.quiz_ok, helpful: u.helpful, lights_got: u.lights_got,
      rooms: u.rooms, questions: u.questions, samuel_reads: u.samuel_reads, best_streak: u.best_streak, gilboa: u.gilboa,
    };
    const visited = this.sql.exec<{ place: string }>("SELECT place FROM visits WHERE uid = ?", u.id).toArray().map((r) => r.place);
    const read = this.sql.exec<{ ref: string }>("SELECT ref FROM chapters WHERE uid = ?", u.id).toArray().map((r) => r.ref);
    return json({ me: this.meOf(u), stats, badges, visited, read });
  }

  private deleteMe(u: UserRow) {
    for (const ws of this.ctx.getWebSockets()) {
      const at = ws.deserializeAttachment() as Attachment | null;
      if (at?.uid === u.id) ws.close(4000, "left");
    }
    this.sql.exec("UPDATE messages SET uid = NULL, name = '' WHERE uid = ?", u.id);
    for (const t of ["daily", "chapters", "visits", "badges"]) this.sql.exec(`DELETE FROM ${t} WHERE uid = ?`, u.id);
    this.sql.exec("DELETE FROM users WHERE id = ?", u.id);
    return json({ ok: true });
  }

  private listRooms() {
    const rows = this.sql
      .exec<RoomRow>("SELECT * FROM rooms ORDER BY starter DESC, last_at DESC LIMIT 80")
      .toArray()
      .map((r) => this.roomInfo(r));
    const starters = rows.filter((r) => r.starter);
    const mine = rows.filter((r) => !r.starter).sort((a, b) => b.online - a.online || b.last - a.last);
    return json({ rooms: [...starters, ...mine] });
  }

  private leaderboard() {
    const week = this.sql
      .exec<{ name: string; avatar: number; week_points: number }>(
        "SELECT name, avatar, week_points FROM users WHERE week = ? AND week_points > 0 AND banned = 0 ORDER BY week_points DESC LIMIT 10",
        weekOf(),
      )
      .toArray()
      .map((r) => ({ name: r.name, avatar: r.avatar, points: r.week_points }));
    const all = this.sql
      .exec<{ name: string; avatar: number; points: number }>(
        "SELECT name, avatar, points FROM users WHERE points > 0 AND banned = 0 ORDER BY points DESC LIMIT 10",
      )
      .toArray();
    return json({ week, all });
  }

  private async createRoom(u: UserRow, req: Request) {
    if (u.muted_until > Date.now()) return fail("muted", 403, { until: u.muted_until });
    const b = await this.body(req);
    const title = String(b.title ?? "").replace(/\s+/g, " ").trim();
    if ([...title].length < 3 || [...title].length > 80) return fail("title_length");
    const v = check(title);
    if (!v.ok) {
      const s = this.strike(u.id, v.severity!);
      return fail("blocked", 400, s);
    }
    const ref = parseRef(typeof b.ref === "string" ? b.ref : null);
    const place = findPlace(typeof b.place === "string" ? b.place : null);
    const id = randomId(6);
    const now = Date.now();
    this.sql.exec(
      "INSERT INTO rooms (id, title, ref, place, created_by, created_at, last_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      id, title, ref ? refString({ ...ref, verse: undefined }) : null, place?.id ?? null, u.id, now, now,
    );
    this.bump(u.id, "rooms");
    const a = this.award(u.id, "room");
    return json({ room: this.roomInfo(this.room(id)!), award: a });
  }

  private async read(u: UserRow, req: Request) {
    const b = await this.body(req);
    const r = parseRef(typeof b.ref === "string" ? b.ref : null);
    if (!r) return fail("bad_ref");
    const ref = `${r.book} ${r.chapter}`;
    const day = today();
    const prev = this.one<{ last_day: string }>("SELECT last_day FROM chapters WHERE uid = ? AND ref = ?", u.id, ref);
    if (prev?.last_day === day) return json({ award: { delta: 0, total: u.points, badges: [] } });
    this.sql.exec("INSERT INTO chapters (uid, ref, last_day) VALUES (?, ?, ?) ON CONFLICT DO UPDATE SET last_day = excluded.last_day", u.id, ref, day);
    if (!prev) {
      this.bump(u.id, "reads");
      if (r.book === "I Samuel" || r.book === "II Samuel") this.bump(u.id, "samuel_reads");
    }
    this.gilboaCheck(u.id);
    return json({ award: this.award(u.id, "read") });
  }

  private async visit(u: UserRow, req: Request) {
    const b = await this.body(req);
    const p = findPlace(typeof b.place === "string" ? b.place : null);
    if (!p) return fail("bad_place");
    const had = this.one("SELECT 1 AS x FROM visits WHERE uid = ? AND place = ?", u.id, p.id);
    if (had) return json({ award: { delta: 0, total: u.points, badges: [] } });
    this.sql.exec("INSERT INTO visits (uid, place, at) VALUES (?, ?, ?)", u.id, p.id, Date.now());
    this.bump(u.id, "places");
    this.gilboaCheck(u.id);
    return json({ award: this.award(u.id, "place") });
  }

  private gilboaCheck(uid: string) {
    const read = this.one("SELECT 1 AS x FROM chapters WHERE uid = ? AND ref = 'I Samuel 31'", uid);
    const been = this.one("SELECT 1 AS x FROM visits WHERE uid = ? AND place = 'gilboa'", uid);
    if (read && been) this.sql.exec("UPDATE users SET gilboa = 1 WHERE id = ?", uid);
  }

  // ── WebSockets ──────────────────────────────────────────────────────
  async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer) {
    if (typeof data !== "string" || data.length > 4000) return;
    let m: ClientMsg;
    try {
      m = JSON.parse(data);
    } catch {
      return;
    }
    const at = ws.deserializeAttachment() as Attachment;
    const err = (code: ErrorCode, extra: Partial<Extract<ServerMsg, { t: "error" }>> = {}) => this.send(ws, { t: "error", code, ...extra });

    if (m.t === "hello") {
      const u = await this.userByToken(m.token);
      const next: Attachment = u ? { room: at.room, uid: u.id, name: u.name, avatar: u.avatar } : { ...at, uid: null };
      ws.serializeAttachment(next);
      const room = this.room(at.room);
      if (!room) return ws.close(4004, "not_found");
      const rows = this.sql
        .exec<MsgRow>("SELECT * FROM (SELECT * FROM messages WHERE room = ? ORDER BY id DESC LIMIT ?) ORDER BY id", at.room, HISTORY)
        .toArray();
      const lit = new Set<number>();
      if (u && rows.length) {
        for (const r of this.sql.exec<{ msg: number }>("SELECT msg FROM lights WHERE uid = ? AND msg >= ?", u.id, rows[0].id)) lit.add(r.msg);
      }
      const p = this.presence(at.room);
      this.send(ws, {
        t: "welcome", room: this.roomInfo(room), history: rows.map((r) => this.toMsg(r, lit.has(r.id))), me: u ? this.meOf(u) : null,
        staff: this.adminIds(), ...p,
      });
      this.broadcast(at.room, { t: "presence", ...p });
      return;
    }

    if (!at.uid) return err("auth");
    const u = this.user(at.uid);
    if (!u || u.banned) return err("banned");

    switch (m.t) {
      case "say": {
        if (u.muted_until > Date.now()) return err("muted", { nonce: m.nonce, until: u.muted_until });
        const body = String(m.body ?? "").replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
        if (!body) return err("empty", { nonce: m.nonce });
        if ([...body].length > MAX_BODY) return err("too_long", { nonce: m.nonce });
        if (!this.rateOk(u.id)) return err("rate", { nonce: m.nonce });
        const v = check(body);
        if (!v.ok) {
          const s = this.strike(u.id, v.severity!);
          return err("blocked", { nonce: m.nonce, strikes: s.strikes, until: s.until });
        }
        const kind = m.kind === "question" ? "question" : "text";
        const ref = parseRef(m.ref);
        const place = findPlace(m.place);
        const view = cleanView(m.view);
        let replyTo: number | null = null;
        if (typeof m.replyTo === "number") {
          const parent = this.one<{ id: number }>("SELECT id FROM messages WHERE id = ? AND room = ?", m.replyTo, at.room);
          replyTo = parent?.id ?? null;
        }
        const row = this.insertMsg(at.room, {
          uid: u.id, name: u.name, avatar: u.avatar, kind, body, ref: ref ? refString(ref) : null, place: place?.id ?? null,
          view: view ? JSON.stringify(view) : null, reply_to: replyTo, quiz: null,
        });
        this.broadcast(at.room, { t: "msg", msg: this.toMsg(row) });
        this.bump(u.id, "msgs");
        if (kind === "question") this.bump(u.id, "questions");
        const a = this.award(u.id, kind === "question" ? "question" : "message");
        this.notifyPoints(u.id, kind, a);
        return;
      }

      case "light": {
        const r = this.one<MsgRow>("SELECT * FROM messages WHERE id = ? AND room = ?", m.id, at.room);
        if (!r || r.hidden || !r.uid || r.uid === u.id || r.kind === "quiz") return;
        const fresh = this.sql.exec("INSERT OR IGNORE INTO lights (msg, uid) VALUES (?, ?) RETURNING msg", r.id, u.id).toArray().length > 0;
        if (!fresh) return;
        this.sql.exec("UPDATE messages SET lights = lights + 1 WHERE id = ?", r.id);
        this.broadcast(at.room, { t: "update", id: r.id, lights: r.lights + 1 });
        this.bump(r.uid, "lights_got");
        this.notifyPoints(r.uid, "light", this.award(r.uid, "lightReceived"));
        return;
      }

      case "helpful": {
        const r = this.one<MsgRow>("SELECT * FROM messages WHERE id = ? AND room = ?", m.id, at.room);
        if (!r || r.hidden || r.helpful || !r.uid || r.uid === u.id || !r.reply_to) return;
        const q = this.one<MsgRow>("SELECT * FROM messages WHERE id = ?", r.reply_to);
        if (!q || q.uid !== u.id || q.kind !== "question") return;
        this.sql.exec("UPDATE messages SET helpful = 1 WHERE id = ?", r.id);
        this.broadcast(at.room, { t: "update", id: r.id, helpful: true });
        this.bump(r.uid, "helpful");
        this.notifyPoints(r.uid, "helpful", this.award(r.uid, "helpful"));
        return;
      }

      case "report": {
        const r = this.one<MsgRow>("SELECT * FROM messages WHERE id = ? AND room = ?", m.id, at.room);
        if (!r || r.hidden || r.uid === u.id) return;
        const fresh = this.sql.exec("INSERT OR IGNORE INTO reports (msg, uid) VALUES (?, ?) RETURNING msg", r.id, u.id).toArray().length > 0;
        if (!fresh) return;
        const reports = r.reports + 1;
        const hide = reports >= 3;
        this.sql.exec("UPDATE messages SET reports = ?, hidden = ? WHERE id = ?", reports, hide ? 1 : 0, r.id);
        if (hide) {
          this.broadcast(at.room, { t: "update", id: r.id, hidden: true });
          if (r.uid) this.strike(r.uid, 1);
        }
        return;
      }

      case "unsend": {
        const r = this.one<MsgRow>("SELECT * FROM messages WHERE id = ? AND room = ?", m.id, at.room);
        if (!r || r.uid !== u.id || r.hidden) return;
        this.sql.exec("UPDATE messages SET hidden = 1 WHERE id = ?", r.id);
        this.broadcast(at.room, { t: "update", id: r.id, hidden: true });
        return;
      }

      case "quiz":
        return this.startQuiz(ws, at.room, u);

      case "answer":
        return this.answer(ws, at.room, u, m.id, m.choice);
    }
  }

  async webSocketClose(ws: WebSocket, code?: number) {
    try {
      ws.close(code === 1005 || !code ? 1000 : code, "bye");
    } catch {
      /* already closed */
    }
    const at = ws.deserializeAttachment() as Attachment | null;
    if (at) this.broadcast(at.room, { t: "presence", ...this.presence(at.room, ws) });
  }

  async webSocketError(ws: WebSocket) {
    await this.webSocketClose(ws, 1011);
  }

  // ── looking after the tent ──────────────────────────────────────────
  private adminUser(u: UserRow | undefined): AdminUser | null {
    if (!u) return null;
    return {
      id: u.id, name: u.name, avatar: u.avatar, strikes: u.strikes, mutedUntil: u.muted_until, banned: !!u.banned,
      msgs: u.msgs, created: Number(u.created),
    };
  }

  private adminMsgs(where: string, limit: number): AdminMsg[] {
    const rows = this.sql
      .exec<MsgRow & { room_title: string; title_he: string | null }>(
        `SELECT m.*, r.title AS room_title, r.title_he FROM messages m LEFT JOIN rooms r ON r.id = m.room
         WHERE ${where} ORDER BY m.id DESC LIMIT ?`,
        limit,
      )
      .toArray();
    return rows.map((r) => ({
      id: r.id, room: r.room, roomTitle: (r.title_he || r.room_title || r.room) as string, uid: r.uid, name: r.name, avatar: r.avatar,
      kind: r.kind as AdminMsg["kind"], body: r.body, reports: r.reports, hidden: !!r.hidden, at: r.at,
      user: this.adminUser(this.user(r.uid)),
    }));
  }

  private adminData(): AdminData {
    const now = Date.now();
    const count = (q: string, ...a: unknown[]) => this.one<{ n: number }>(q, ...a)?.n ?? 0;
    const uids = new Set<string>();
    let guests = 0;
    for (const ws of this.ctx.getWebSockets()) {
      const at = ws.deserializeAttachment() as Attachment | null;
      if (at?.uid) uids.add(at.uid);
      else guests++;
    }
    return {
      stats: {
        people: count("SELECT COUNT(*) AS n FROM users"),
        newWeek: count("SELECT COUNT(*) AS n FROM users WHERE created > ?", now - 7 * DAY),
        msgsDay: count("SELECT COUNT(*) AS n FROM messages WHERE at > ? AND kind != 'quiz'", now - DAY),
        msgsWeek: count("SELECT COUNT(*) AS n FROM messages WHERE at > ? AND kind != 'quiz'", now - 7 * DAY),
        rooms: count("SELECT COUNT(*) AS n FROM rooms WHERE starter = 0"),
        online: uids.size,
        guests,
      },
      reported: this.adminMsgs("m.reports > 0", 50),
      latest: this.adminMsgs("m.kind != 'quiz'", 40),
      people: this.sql
        .exec<UserRow>("SELECT * FROM users WHERE banned = 1 OR muted_until > ? OR strikes > 0 ORDER BY banned DESC, muted_until DESC LIMIT 100", now)
        .toArray()
        .map((u) => this.adminUser(u)!),
      rooms: this.sql
        .exec<RoomRow & { by_name: string | null }>(
          "SELECT r.*, u.name AS by_name FROM rooms r LEFT JOIN users u ON u.id = r.created_by WHERE r.starter = 0 ORDER BY r.last_at DESC LIMIT 100",
        )
        .toArray()
        .map((r) => ({ id: r.id, title: r.title, by: r.by_name ?? "", msgs: r.msgs, created: r.created_at, last: r.last_at })),
    };
  }

  private adminAct(me: UserRow, a: AdminAction) {
    const now = Date.now();
    if (a?.on === "msg" && typeof a.id === "number") {
      const r = this.one<MsgRow>("SELECT * FROM messages WHERE id = ?", a.id);
      if (!r) return fail("not_found", 404);
      if (a.action === "hide") {
        this.sql.exec("UPDATE messages SET hidden = 1 WHERE id = ?", r.id);
        if (r.quiz) this.sql.exec("UPDATE rooms SET quiz_open = NULL WHERE quiz_open = ?", r.id);
        this.broadcast(r.room, { t: "update", id: r.id, hidden: true });
      } else if (a.action === "restore") {
        this.sql.exec("UPDATE messages SET hidden = 0, reports = 0 WHERE id = ?", r.id);
        this.sql.exec("DELETE FROM reports WHERE msg = ?", r.id);
        this.broadcast(r.room, { t: "update", id: r.id, msg: this.toMsg(this.one<MsgRow>("SELECT * FROM messages WHERE id = ?", r.id)!) });
      } else return fail("bad_action");
      return json({ ok: true });
    }
    if (a?.on === "user" && typeof a.id === "string") {
      const u = this.user(a.id);
      if (!u) return fail("not_found", 404);
      if (u.id === me.id || this.isAdmin(u.id)) return fail("forbidden", 403);
      switch (a.action) {
        case "mute_hour":
        case "mute_day": {
          const until = now + (a.action === "mute_hour" ? HOUR : DAY);
          this.sql.exec("UPDATE users SET muted_until = ? WHERE id = ?", until, u.id);
          break;
        }
        case "unmute":
          this.sql.exec("UPDATE users SET muted_until = 0, strikes = 0 WHERE id = ?", u.id);
          break;
        case "ban":
          this.ban(u.id);
          break;
        case "unban":
          this.sql.exec("UPDATE users SET banned = 0, strikes = 0, muted_until = 0 WHERE id = ?", u.id);
          if (u.ip_hash) this.sql.exec("DELETE FROM bans WHERE ip_hash = ?", u.ip_hash);
          break;
        default:
          return fail("bad_action");
      }
      return json({ ok: true, user: this.adminUser(this.user(u.id)) });
    }
    if (a?.on === "room" && typeof a.id === "string" && a.action === "delete") {
      const r = this.room(a.id);
      if (!r) return fail("not_found", 404);
      if (r.starter) return fail("starter_room");
      const ids = "SELECT id FROM messages WHERE room = ?";
      for (const t of ["lights", "reports", "answers"]) this.sql.exec(`DELETE FROM ${t} WHERE msg IN (${ids})`, r.id);
      this.sql.exec("DELETE FROM messages WHERE room = ?", r.id);
      this.sql.exec("DELETE FROM rooms WHERE id = ?", r.id);
      for (const ws of this.ctx.getWebSockets(r.id)) {
        this.send(ws, { t: "error", code: "not_found" });
        ws.close(4004, "room_gone");
      }
      return json({ ok: true });
    }
    return fail("bad_action");
  }

  // ── quiz rounds ─────────────────────────────────────────────────────
  private async startQuiz(ws: WebSocket, roomId: string, u: UserRow) {
    const room = this.room(roomId)!;
    if (room.quiz_open) {
      const open = this.one<MsgRow>("SELECT * FROM messages WHERE id = ?", room.quiz_open);
      const q = open?.quiz ? (JSON.parse(open.quiz) as QuizState) : null;
      if (q && !q.done && q.ends > Date.now()) return this.send(ws, { t: "error", code: "quiz_busy" });
    }
    const recent: string[] = JSON.parse(room.recent_quiz || "[]");
    const book = room.ref ? parseRef(room.ref)?.book ?? null : null;
    const Q = pickQuestion(book, recent);
    const order = [0, 1, 2, 3];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); // Fisher–Yates: every order equally likely
      [order[i], order[j]] = [order[j], order[i]];
    }
    const state: QuizState = { qid: Q.id, order, ends: Date.now() + QUIZ_MS, done: false, solvers: [] };
    const row = this.insertMsg(roomId, {
      uid: u.id, name: u.name, avatar: u.avatar, kind: "quiz", body: "", ref: null, place: null, view: null, reply_to: null,
      quiz: JSON.stringify(state),
    });
    this.sql.exec("UPDATE rooms SET quiz_open = ?, recent_quiz = ? WHERE id = ?", row.id, JSON.stringify([Q.id, ...recent].slice(0, 20)), roomId);
    this.broadcast(roomId, { t: "msg", msg: this.toMsg(row) });
    await this.scheduleAlarm();
  }

  private async answer(ws: WebSocket, roomId: string, u: UserRow, id: number, choice: number) {
    const r = this.one<MsgRow>("SELECT * FROM messages WHERE id = ? AND room = ? AND kind = 'quiz'", id, roomId);
    if (!r?.quiz || !Number.isInteger(choice) || choice < 0 || choice > 3) return;
    const q = JSON.parse(r.quiz) as QuizState;
    if (q.done || q.ends < Date.now()) return;
    const correct = q.order[choice] === 0;
    const fresh = this.sql
      .exec("INSERT OR IGNORE INTO answers (msg, uid, choice, correct, at) VALUES (?, ?, ?, ?, ?) RETURNING msg", id, u.id, choice, correct ? 1 : 0, Date.now())
      .toArray().length > 0;
    if (!fresh) return;
    this.send(ws, { t: "quizResult", id, correct, choice });
    if (correct) {
      const first = q.solvers.length === 0;
      q.solvers.push({ uid: u.id, name: u.name, avatar: u.avatar });
      this.sql.exec("UPDATE messages SET quiz = ? WHERE id = ?", JSON.stringify(q), id);
      this.bump(u.id, "quiz_ok");
      this.notifyPoints(u.id, "quiz", this.award(u.id, "quizCorrect", first ? POINTS.quizFirst : 0));
      this.broadcast(roomId, { t: "update", id, quiz: this.quizPublic(q) });
    }
    // Everyone here has answered: no need to wait for the clock.
    const answered = this.one<{ n: number }>("SELECT COUNT(*) AS n FROM answers WHERE msg = ?", id)!.n;
    if (answered >= this.presence(roomId).online.length) this.finishQuiz(id);
  }

  private finishQuiz(id: number) {
    const r = this.one<MsgRow>("SELECT * FROM messages WHERE id = ?", id);
    if (!r?.quiz) return;
    const q = JSON.parse(r.quiz) as QuizState;
    if (q.done) return;
    q.done = true;
    q.ends = Math.min(q.ends, Date.now());
    this.sql.exec("UPDATE messages SET quiz = ? WHERE id = ?", JSON.stringify(q), id);
    this.sql.exec("UPDATE rooms SET quiz_open = NULL WHERE quiz_open = ?", id);
    if (q.solvers.length >= 2) {
      for (const s of q.solvers) this.notifyPoints(s.uid, "together", this.award(s.uid, null, POINTS.quizTogether));
    }
    this.broadcast(r.room, { t: "update", id, quiz: this.quizPublic(q) });
  }

  private async scheduleAlarm() {
    let next = Infinity;
    for (const r of this.sql.exec<{ quiz: string }>(
      "SELECT m.quiz FROM rooms r JOIN messages m ON m.id = r.quiz_open WHERE r.quiz_open IS NOT NULL",
    )) {
      const q = JSON.parse(r.quiz) as QuizState;
      if (!q.done) next = Math.min(next, q.ends);
    }
    if (next < Infinity) {
      const cur = await this.ctx.storage.getAlarm();
      if (!cur || cur > next) await this.ctx.storage.setAlarm(next);
    }
  }

  async alarm() {
    const now = Date.now();
    for (const r of this.sql
      .exec<{ id: number; quiz: string }>("SELECT m.id, m.quiz FROM rooms r JOIN messages m ON m.id = r.quiz_open WHERE r.quiz_open IS NOT NULL")
      .toArray()) {
      const q = JSON.parse(r.quiz) as QuizState;
      if (q.done || q.ends <= now + 100) this.finishQuiz(r.id);
    }
    await this.scheduleAlarm();
  }
}
