// End-to-end check of the live server: two people talk, ask, light, report and play a quiz.
// Usage: node scripts/e2e.mjs [base-url]
const B = process.argv[2] ?? "http://localhost:5179";
const WSB = B.replace(/^http/, "ws");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (cond, label) => { console.log(`${cond ? "✔" : "✘"} ${label}`); if (!cond) fails++; };

async function join(name, avatar) {
  const r = await fetch(`${B}/api/join`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, avatar }) });
  return r.json();
}
function connect(room, token) {
  const ws = new WebSocket(`${WSB}/api/rooms/${room}/ws`);
  const inbox = [];
  const waiters = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    inbox.push(m);
    for (const w of [...waiters]) if (w.pred(m)) { waiters.splice(waiters.indexOf(w), 1); w.res(m); }
  };
  const wait = (pred, ms = 4000) =>
    new Promise((res, rej) => {
      const hit = inbox.find(pred);
      if (hit) { inbox.splice(inbox.indexOf(hit), 1); return res(hit); }
      const w = { pred: (m) => { if (pred(m)) { inbox.splice(inbox.indexOf(m), 1); return true; } return false; }, res };
      waiters.push(w);
      setTimeout(() => rej(new Error("timeout")), ms);
    });
  const send = (m) => ws.send(JSON.stringify(m));
  return new Promise((res) => (ws.onopen = () => { send({ t: "hello", token }); res({ ws, wait, send, inbox }); }));
}

const a = await join(`Avi ${Date.now() % 1000}`, 2);
const b = await join(`Noa ${Date.now() % 1000}`, 5);
ok(a.token && b.token, "two people joined");
// A private test room so people browsing the real rooms don't change the result.
const made = await (await fetch(`${B}/api/rooms`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${a.token}` }, body: JSON.stringify({ title: "Test: why Endor?", ref: "I Samuel 28", place: "endor" }) })).json();
const room = made.room.id;
ok(made.room.ref === "I Samuel 28" && made.room.place === "endor", `room opened (${room}), +${made.award.delta}`);

const A = await connect(room, a.token);
const welcomeA = await A.wait((m) => m.t === "welcome");
ok(welcomeA.me?.name === a.me.name, "A welcomed with identity");
const Bc = await connect(room, b.token);
await Bc.wait((m) => m.t === "welcome");
const pres = await A.wait((m) => m.t === "presence" && m.online.length >= 2);
ok(pres.online.some((p) => p.name === b.me.name), "A sees B arrive");

A.send({ t: "say", body: "Why did Saul go to Endor the night before?", kind: "question", ref: "I Samuel 28:7", place: "endor", nonce: "n1" });
const q = (await Bc.wait((m) => m.t === "msg" && m.msg.kind === "question")).msg;
ok(q.ref === "I Samuel 28:7" && q.place === "endor", "question with verse and place reached B");

Bc.send({ t: "say", body: "כי שמואל מת והוא לא קיבל תשובה, לא בחלומות ולא באורים", replyTo: q.id, nonce: "n2" });
const ans = (await A.wait((m) => m.t === "msg" && m.msg.replyTo === q.id)).msg;
ok(ans.body.startsWith("כי שמואל"), "Hebrew answer arrives as a reply");

A.send({ t: "light", id: ans.id });
const lit = await Bc.wait((m) => m.t === "update" && m.id === ans.id && m.lights === 1);
ok(lit, "light shows up for everyone");
const ptsLight = await Bc.wait((m) => m.t === "points" && m.reason === "light");
ok(ptsLight.delta >= 2, `B got points for being lit up (+${ptsLight.delta})`);

A.send({ t: "helpful", id: ans.id });
await Bc.wait((m) => m.t === "update" && m.id === ans.id && m.helpful === true);
const ptsHelp = await Bc.wait((m) => m.t === "points" && m.reason === "helpful");
ok(ptsHelp.delta >= 10 && ptsHelp.badges.includes("guide"), `helpful answer: +${ptsHelp.delta}, badges ${ptsHelp.badges}`);

Bc.send({ t: "helpful", id: q.id });
await sleep(300);
ok(!Bc.inbox.some((m) => m.t === "update" && m.id === q.id && m.helpful), "only the asker can mark helpful");

Bc.send({ t: "say", body: "יא בן זונה", nonce: "bad1" });
const blocked = await Bc.wait((m) => m.t === "error");
ok(blocked.code === "blocked" && blocked.nonce === "bad1", `curse blocked (strikes ${blocked.strikes})`);
await sleep(300);
ok(!A.inbox.some((m) => m.t === "msg" && m.msg.body.includes("זונה")), "A never saw it");

A.send({ t: "say", body: "רחב הזונה הסתירה את המרגלים על הגג", nonce: "ok1" });
const rahab = await Bc.wait((m) => m.t === "msg" && m.msg.body.includes("רחב"));
ok(!!rahab, "biblical wording about Rahab is allowed");

A.send({ t: "quiz" });
const quiz = (await Bc.wait((m) => m.t === "msg" && m.msg.kind === "quiz")).msg;
ok(quiz.quiz.he.options.length === 4 && quiz.quiz.en.q.length > 5 && quiz.quiz.answer === undefined, `quiz started, answer hidden: "${quiz.quiz.en.q}"`);
A.send({ t: "quiz" });
ok((await A.wait((m) => m.t === "error")).code === "quiz_busy", "second quiz refused while one runs");

// Find the right option by trying: A answers 0; B answers what A didn't get.
A.send({ t: "answer", id: quiz.id, choice: 0 });
const ra = await A.wait((m) => m.t === "quizResult");
const bChoice = ra.correct ? 0 : 1;
Bc.send({ t: "answer", id: quiz.id, choice: bChoice });
const rb = await Bc.wait((m) => m.t === "quizResult");
const end = await A.wait((m) => m.t === "update" && m.id === quiz.id && m.quiz.done, 6000);
ok(end.quiz.done && typeof end.quiz.answer === "number" && end.quiz.en.explain, `quiz ended early when everyone answered (answer ${end.quiz.answer})`);
ok(ra.correct === (end.quiz.answer === 0), "A's result matches the revealed answer");
ok(rb.correct === (end.quiz.answer === bChoice), "B's result matches too");

// Reports: a third and fourth person report A's message → hidden at 3 reports.
const c = await join(`Lev ${Date.now() % 1000}`, 1);
const d = await join(`Tamar ${Date.now() % 1000}`, 3);
const C = await connect(room, c.token);
const D = await connect(room, d.token);
await C.wait((m) => m.t === "welcome");
await D.wait((m) => m.t === "welcome");
A.send({ t: "say", body: "a message people will report", nonce: "r" });
const victim = (await Bc.wait((m) => m.t === "msg" && m.msg.body.startsWith("a message people"))).msg;
for (const X of [Bc, C, D]) X.send({ t: "report", id: victim.id });
const hid = await A.wait((m) => m.t === "update" && m.id === victim.id && m.hidden);
ok(hid, "hidden after three reports");

// Reading and map rewards over HTTP.
const read = await (await fetch(`${B}/api/read`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${a.token}` }, body: JSON.stringify({ ref: "I Samuel 31" }) })).json();
ok(read.award.delta >= 5, `read reward +${read.award.delta}`);
const again = await (await fetch(`${B}/api/read`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${a.token}` }, body: JSON.stringify({ ref: "I Samuel 31" }) })).json();
ok(again.award.delta === 0, "same chapter twice in a day gives nothing");
const visit = await (await fetch(`${B}/api/visit`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${a.token}` }, body: JSON.stringify({ place: "gilboa" }) })).json();
ok(visit.award.badges.includes("gilboa"), `Gilboa badge after reading 1 Sam 31 + visiting (${visit.award.badges})`);

const me = await (await fetch(`${B}/api/me`, { headers: { authorization: `Bearer ${a.token}` } })).json();
ok(me.badges.length >= 4, `A has ${me.me.points} points and badges: ${me.badges.map((x) => x.badge).join(", ")}`);
const board = await (await fetch(`${B}/api/leaderboard`)).json();
ok(board.week.length >= 2, `weekly board: ${board.week.map((x) => `${x.name} ${x.points}`).join(" · ")}`);

// Leaving: delete D and make sure the token stops working.
const del = await fetch(`${B}/api/me`, { method: "DELETE", headers: { authorization: `Bearer ${d.token}` } });
ok(del.ok, "account deleted");
const gone = await fetch(`${B}/api/me`, { headers: { authorization: `Bearer ${d.token}` } });
ok(gone.status === 401, "deleted key no longer opens anything");

for (const X of [A, Bc, C, D]) X.ws.close();
console.log(fails ? `\n${fails} FAILED` : "\nall good");
process.exit(fails ? 1 : 0);
