// End-to-end check of the admin tools: report → hide → bring back → pause → block → unblock → delete room.
// Needs an admin's key (a user whose id is in ADMIN_IDS, e.g. in .dev.vars):
//   OHEL_ADMIN_TOKEN=ohel_... node scripts/admin-e2e.mjs [base-url]
// It opens its own test room and deletes it, and removes the two test people it creates.
const B = process.argv[2] ?? "http://localhost:5179";
const WSB = B.replace(/^http/, "ws");
const ADMIN = process.env.OHEL_ADMIN_TOKEN;
if (!ADMIN) throw new Error("Set OHEL_ADMIN_TOKEN to an admin's key");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (cond, label) => { console.log(`${cond ? "✔" : "✘"} ${label}`); if (!cond) fails++; };

const call = async (path, token, body, method) => {
  const r = await fetch(`${B}${path}`, {
    method: method ?? (body ? "POST" : "GET"),
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: await r.json().catch(() => ({})) };
};
const join = async (name, avatar) => (await call("/api/join", null, { name, avatar })).data;
const act = (token, a) => call("/api/admin", token, a);

function connect(room, token) {
  const ws = new WebSocket(`${WSB}/api/rooms/${room}/ws`);
  const inbox = [];
  const waiters = [];
  let closed = null;
  ws.onclose = (e) => { closed = e.code; for (const w of [...waiters]) if (w.onClose) w.res({ t: "_closed", code: e.code }); };
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    inbox.push(m);
    for (const w of [...waiters]) if (w.pred(m)) { waiters.splice(waiters.indexOf(w), 1); w.res(m); }
  };
  const wait = (pred, ms = 4000, onClose = false) =>
    new Promise((res, rej) => {
      const hit = inbox.find(pred);
      if (hit) { inbox.splice(inbox.indexOf(hit), 1); return res(hit); }
      if (onClose && closed !== null) return res({ t: "_closed", code: closed });
      const w = { pred: (m) => { if (pred(m)) { inbox.splice(inbox.indexOf(m), 1); return true; } return false; }, res, onClose };
      waiters.push(w);
      setTimeout(() => rej(new Error("timeout")), ms);
    });
  const send = (m) => ws.send(JSON.stringify(m));
  return new Promise((res) => (ws.onopen = () => { send({ t: "hello", token }); res({ ws, wait, send, closedCode: () => closed }); }));
}

const meA = await call("/api/me", ADMIN);
ok(meA.data.me?.admin === true, "admin key belongs to an admin");
const adminId = meA.data.me.id;

const b = await join(`Rowdy ${Date.now() % 1000}`, 1);
const c = await join(`Calm ${Date.now() % 1000}`, 6);
ok(b.token && c.token, "two test people joined");
ok(b.me.admin === undefined && (await call("/api/admin", b.token)).status === 403, "non-admins can't open the admin page");

const made = (await call("/api/rooms", b.token, { title: "Test: admin check" })).data;
const room = made.room.id;
ok(!!room, `test room opened (${room})`);

const Bw = await connect(room, b.token);
const Cw = await connect(room, c.token);
const Aw = await connect(room, ADMIN);
const welcome = await Cw.wait((m) => m.t === "welcome");
ok(Array.isArray(welcome.staff) && welcome.staff.includes(adminId), "room tells everyone who the team is");
await Bw.wait((m) => m.t === "welcome");
await Aw.wait((m) => m.t === "welcome");

Bw.send({ t: "say", body: "this is a rude but clean message", nonce: "b1" });
const msg = (await Cw.wait((m) => m.t === "msg" && m.msg.uid === b.me.id)).msg;
Cw.send({ t: "report", id: msg.id });
await sleep(150);

const data = (await call("/api/admin", ADMIN)).data;
ok(data.stats?.people >= 3 && data.stats.online >= 3, `stats: ${data.stats.people} people, ${data.stats.online} here now`);
const rep = data.reported.find((m) => m.id === msg.id);
ok(rep && rep.reports === 1 && rep.body === msg.body && rep.user?.id === b.me.id, "reported message shows up with its writer");
ok(data.rooms.some((r) => r.id === room), "test room listed under rooms people opened");

ok((await act(ADMIN, { on: "msg", id: msg.id, action: "hide" })).status === 200, "hide for everyone");
const hid = await Cw.wait((m) => m.t === "update" && m.id === msg.id && m.hidden);
ok(!!hid, "everyone in the room sees it disappear");

await act(ADMIN, { on: "msg", id: msg.id, action: "restore" });
const back = await Cw.wait((m) => m.t === "update" && m.id === msg.id && m.msg);
ok(back.msg.body === msg.body && !back.msg.hidden, "bring back restores the words for everyone");
ok(!(await call("/api/admin", ADMIN)).data.reported.some((m) => m.id === msg.id), "bringing back clears the reports");

const muted = await act(ADMIN, { on: "user", id: b.me.id, action: "mute_hour" });
ok(muted.data.user?.mutedUntil > Date.now() + 50 * 60_000, "pause for an hour");
Bw.send({ t: "say", body: "can I still talk?", nonce: "b2" });
const err = await Bw.wait((m) => m.t === "error" && m.nonce === "b2");
ok(err.code === "muted", "paused person can't post");

await act(ADMIN, { on: "user", id: b.me.id, action: "unmute" });
Bw.send({ t: "say", body: "back again, sorry", nonce: "b3" });
ok(!!(await Cw.wait((m) => m.t === "msg" && m.msg.body === "back again, sorry")), "after the pause ends they can post");

ok((await act(ADMIN, { on: "user", id: adminId, action: "ban" })).status === 403, "an admin can't block themselves");

await act(ADMIN, { on: "user", id: b.me.id, action: "ban" });
const banned = await Bw.wait((m) => m.t === "error" && m.code === "banned");
ok(!!banned, "blocked person is told and disconnected");
ok((await call("/api/me", b.token)).status === 401, "blocked key stops working");
const people = (await call("/api/admin", ADMIN)).data.people;
ok(people.some((u) => u.id === b.me.id && u.banned), "blocked person listed for the team");

await act(ADMIN, { on: "user", id: b.me.id, action: "unban" });
ok((await call("/api/me", b.token)).status === 200, "unblock lets them back in");

ok((await act(ADMIN, { on: "room", id: "gilboa", action: "delete" })).status === 400, "starter rooms can't be deleted");
await act(ADMIN, { on: "room", id: room, action: "delete" });
const gone = await Cw.wait((m) => m.t === "_closed", 4000, true);
ok(gone.code === 4004, "people in a deleted room are sent out");
ok((await call(`/api/rooms/${room}`)).status === 404, "deleted room is gone");

await call("/api/me", b.token, undefined, "DELETE");
await call("/api/me", c.token, undefined, "DELETE");
for (const w of [Bw, Cw, Aw]) try { w.ws.close(); } catch {}
console.log(fails ? `\n${fails} failed` : "\nall good");
process.exit(fails ? 1 : 0);
