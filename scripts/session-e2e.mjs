// Staying signed in (cookie copy of the key, personal link, sign-out), end to end in headless Chrome. LOCAL only. Usage: node scripts/session-e2e.mjs http://localhost:5173 (CHROME=path if not on the Desktop)
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const B = process.argv[2];
if (!/localhost/.test(B)) throw new Error("local only");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (c, l) => { console.log(`${c ? "✔" : "✘"} ${l}`); if (!c) fails++; };
const j = await (await fetch(`${B}/api/join`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Keep " + (Date.now() % 1000), avatar: 2 }) })).json();
// API level
let r = await fetch(`${B}/api/session`, { method: "POST", headers: { authorization: `Bearer ${j.token}` } });
const sc = r.headers.get("set-cookie") ?? "";
ok(r.status === 204 && /ohel_key=/.test(sc) && /HttpOnly/i.test(sc) && /Path=\/api\/session/.test(sc), "remember sets an HttpOnly cookie for /api/session only");
r = await fetch(`${B}/api/session`, { headers: { cookie: sc.split(";")[0] } });
const s = await r.json();
ok(r.ok && s.token === j.token && s.me?.id === j.me.id, "the cookie brings back the key");
ok((await fetch(`${B}/api/session`, { method: "POST", headers: { authorization: "Bearer ohel_nope" } })).status === 401, "a wrong key is not remembered");
ok((await fetch(`${B}/api/session`, { headers: { cookie: "ohel_key=ohel_nope" } })).status === 404, "a wrong cookie gives nothing");
ok((await fetch(`${B}/api/saved`, { method: "POST", body: "username=a&password=b" })).status === 204, "the password-save target keeps nothing");
// Browser level
const port = 9800 + Math.floor(Math.random() * 90);
const proc = spawn(process.env.CHROME ?? process.env.HOME + "/Desktop/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "keep-"))}`, "--no-first-run"], { stdio: "ignore" });
let v; for (let i = 0; i < 60 && !v; i++) { await sleep(250); v = await fetch(`http://127.0.0.1:${port}/json/version`).then((x) => x.json()).catch(() => null); }
const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((res) => (ws.onopen = res));
let id = 0; const w = new Map(); ws.onmessage = (e) => { const m = JSON.parse(e.data); if (w.has(m.id)) (w.get(m.id)(m.result), w.delete(m.id)); };
const send = (method, params = {}) => new Promise((res) => { const n = ++id; w.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
await send("Page.navigate", { url: `${B}/key#${encodeURIComponent(j.token)}` }); await sleep(3500);
ok((await ev("localStorage.getItem('ohel.token')")) === j.token, "the personal link signs in");
ok((await ev("location.pathname + location.hash")) === "/", "and wipes the key from the address bar");
await ev("localStorage.clear()");
await send("Page.navigate", { url: `${B}/` }); await sleep(3500);
ok((await ev("localStorage.getItem('ohel.token')")) === j.token, "a browser that forgot the key gets it back from the cookie");
await ev("fetch('/api/session', { method: 'DELETE' }).then(() => localStorage.clear())");
await send("Page.navigate", { url: `${B}/` }); await sleep(3000);
ok(!(await ev("localStorage.getItem('ohel.token')")), "after signing out it stays signed out");
ws.close(); proc.kill();
await fetch(`${B}/api/me`, { method: "DELETE", headers: { authorization: `Bearer ${j.token}` } });
console.log(fails ? `\n${fails} failed` : "\nall good");
process.exit(fails ? 1 : 0);
