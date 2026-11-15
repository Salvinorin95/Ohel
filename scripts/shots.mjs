// Screenshots for the README, in Hebrew and English, taken from a LOCAL server with a demo conversation.
// Usage: node scripts/shots.mjs http://localhost:5300 [only-name]
//   Seeds a demo room and people on that local server (refuses any other host), then drives headless Chrome
//   through the shots below and writes docs/screenshots/<lang>/<name>.jpg.
// Chrome: set CHROME=/path/to/Google Chrome, or it looks in /Applications and ~/Desktop.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const B = process.argv[2] ?? "http://localhost:5300";
const only = process.argv[3];
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(B)) throw new Error("shots.mjs only runs against a local server (it posts demo messages)");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = new URL("../docs/screenshots/", import.meta.url).pathname;

// ── demo people and a conversation (local only) ──
async function api(path, body, token) {
  const r = await fetch(`${B}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}
function connect(room, token) {
  const ws = new WebSocket(`${B.replace(/^http/, "ws")}/api/rooms/${room}/ws`);
  const inbox = [];
  ws.onmessage = (e) => inbox.push(JSON.parse(e.data));
  const next = async (pred) => {
    for (let i = 0; i < 80; i++) {
      const k = inbox.findIndex(pred);
      if (k >= 0) return inbox.splice(k, 1)[0];
      await sleep(50);
    }
    throw new Error("demo: no reply from the room");
  };
  return new Promise((res) => (ws.onopen = () => (ws.send(JSON.stringify({ t: "hello", token })), res({ ws, next, send: (m) => ws.send(JSON.stringify(m)) }))));
}
async function seed() {
  const noa = await api("/api/join", { name: "נועה", avatar: 5 });
  const dan = await api("/api/join", { name: "Daniel", avatar: 2 });
  const yael = await api("/api/join", { name: "יעל", avatar: 6 });
  const made = await api("/api/rooms", { title: "למה שאול לא ברח מהגלבוע? Why didn't Saul run?", ref: "I Samuel 31", place: "gilboa" }, noa.token);
  const room = made.room.id;
  const [N, D, Y] = [await connect(room, noa.token), await connect(room, dan.token), await connect(room, yael.token)];
  for (const c of [N, D, Y]) await c.next((m) => m.t === "welcome");
  const say = async (c, m) => {
    c.send({ nonce: String(Math.random()), ...m, t: "say" });
    return (await c.next((x) => x.t === "msg" && x.msg.body === m.body)).msg;
  };
  const q = await say(N, { body: "קראתי עכשיו את שמואל א לא. למה שאול נשאר להילחם, כשהוא כבר ידע מה יקרה?", kind: "question", ref: "I Samuel 31:4", place: "gilboa" });
  const a = await say(D, { body: "Samuel told him the night before, at Endor: tomorrow you and your sons will be with me. He went out anyway. That's what gets me.", replyTo: q.id, ref: "I Samuel 28:19", place: "endor" });
  await say(Y, { body: "תסתכלו על המפה: הפלשתים חנו בשונם, ממש מול הגלבוע. לא הייתה לו לאן לסגת בלי להפקיר את כל העם.", replyTo: q.id, place: "shunem" });
  await say(N, { body: "וואו, לא שמתי לב כמה זה קרוב. ואז דוד כותב את הקינה: ״הָרֵי בַגִּלְבֹּעַ אַל טַל וְאַל מָטָר עֲלֵיכֶם״", ref: "II Samuel 1:21" });
  N.send({ t: "light", id: a.id });
  D.send({ t: "light", id: q.id });
  N.send({ t: "helpful", id: a.id });
  await sleep(600);
  for (const c of [N, D, Y]) c.ws.close();
  const me = await api("/api/me", null, noa.token);
  return { room, token: noa.token, me: me.me ?? me };
}

// ── headless Chrome over the DevTools protocol ──
function chromePath() {
  const c = [process.env.CHROME, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", join(homedir(), "Desktop/Google Chrome.app/Contents/MacOS/Google Chrome")];
  const p = c.find((x) => x && existsSync(x));
  if (!p) throw new Error("Chrome not found: set CHROME");
  return p;
}
async function chrome() {
  const port = 9300 + Math.floor(Math.random() * 600);
  const proc = spawn(chromePath(), [
    "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "ohel-shots-"))}`,
    "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--enable-unsafe-swiftshader", "--window-size=1440,900",
  ], { stdio: "ignore" });
  let ver;
  for (let i = 0; i < 60 && !ver; i++) {
    await sleep(250);
    ver = await fetch(`http://127.0.0.1:${port}/json/version`).then((r) => r.json()).catch(() => null);
  }
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const waiting = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && waiting.has(m.id)) (waiting.get(m.id)(m), waiting.delete(m.id));
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const n = ++id;
      waiting.set(n, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  return { send, close: () => (ws.close(), proc.kill()) };
}

const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true };
const DESK = { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false };

const SHOTS = (demo) => [
  { name: "home", size: PHONE, path: "/", wait: 4500 },
  { name: "map", size: DESK, path: "/map", wait: 9000 },
  { name: "place-card", size: PHONE, path: "/map/gilboa", wait: 9000 },
  { name: "place-page", size: DESK, path: "/place/mamre", wait: 9000 },
  { name: "place-page-phone", size: PHONE, path: "/place/eingedi", wait: 7000 },
  { name: "realm", size: DESK, path: "/place/nineveh", wait: 7000, then: `[...document.querySelectorAll(".pp-rulers li")].find((li) => /אשור|Assyri/.test(li.textContent))?.querySelector("button")?.click()`, after: 7000 },
  { name: "read", size: PHONE, path: "/read/I_Samuel/31", wait: 6000 },
  { name: "journey", size: DESK, path: "/journey/jacob", wait: 6000, then: `[...document.querySelectorAll(".journey-dots button")][2]?.click()`, after: 6000 },
  { name: "journey-phone", size: PHONE, path: "/journey/exodus", wait: 6000, then: `[...document.querySelectorAll(".journey-dots button")][2]?.click()`, after: 6000 },
  { name: "week", size: PHONE, path: "/week", wait: 5000 },
  { name: "room", size: PHONE, path: `/room/${demo.room}`, wait: 5000, signedIn: true },
  { name: "me", size: PHONE, path: "/me", wait: 4000, signedIn: true },
];

const demo = await seed();
console.log(`demo room ${demo.room}`);
const c = await chrome();
try {
  for (const lang of ["he", "en"]) {
    mkdirSync(join(OUT, lang), { recursive: true });
    for (const s of SHOTS(demo)) {
      if (only && s.name !== only) continue;
      await c.send("Emulation.setDeviceMetricsOverride", s.size);
      await c.send("Page.navigate", { url: `${B}/robots.txt` });
      await sleep(400);
      const store = { "ohel.lang": lang, ...(s.signedIn ? { "ohel.token": demo.token, "ohel.me": JSON.stringify(demo.me) } : {}) };
      await c.send("Runtime.evaluate", { expression: `localStorage.clear(); Object.entries(${JSON.stringify(store)}).forEach(([k, v]) => localStorage.setItem(k, v))` });
      await c.send("Page.navigate", { url: `${B}${s.path}` });
      await sleep(s.wait);
      if (s.then) {
        await c.send("Runtime.evaluate", { expression: s.then });
        await sleep(s.after ?? 3000);
      }
      const shot = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 82 });
      writeFileSync(join(OUT, lang, `${s.name}.jpg`), Buffer.from(shot.data, "base64"));
      console.log(`✔ ${lang}/${s.name}.jpg`);
    }
  }
} finally {
  c.close();
}
