// The account screens in headless Chrome: sign up from the sheet, upload a photo in Settings, write a few words,
// see the public profile, sign out and sign back in on a "new device". LOCAL only.
// Usage: node scripts/accounts-ui-e2e.mjs http://localhost:5173   (CHROME=path if Chrome isn't on the Desktop)
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const B = process.argv[2];
if (!/localhost|127\.0\.0\.1/.test(B)) throw new Error("local only");
const PHOTO = new URL("../public/og.jpg", import.meta.url).pathname;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (c, l) => { console.log(`${c ? "✔" : "✘"} ${l}`); if (!c) fails++; };
async function browser() {
  const port = 9700 + Math.floor(Math.random() * 90);
  const proc = spawn(process.env.CHROME ?? process.env.HOME + "/Desktop/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "acc-"))}`, "--no-first-run", "--window-size=430,900"], { stdio: "ignore" });
  let v; for (let i = 0; i < 60 && !v; i++) { await sleep(250); v = await fetch(`http://127.0.0.1:${port}/json/version`).then((x) => x.json()).catch(() => null); }
  const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((res) => (ws.onopen = res));
  let id = 0; const w = new Map(); ws.onmessage = (e) => { const m = JSON.parse(e.data); if (w.has(m.id)) (w.get(m.id)(m.result ?? m), w.delete(m.id)); };
  const send = (method, params = {}) => new Promise((res) => { const n = ++id; w.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
  const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
  const go = async (path, ms = 2500) => { await send("Page.navigate", { url: B + path }); await sleep(ms); };
  // type into a React input: set the value through the native setter, then fire input
  const type = (sel, v) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); const set = Object.getOwnPropertyDescriptor(el.__proto__, "value").set; set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
  const click = (text) => ev(`(() => { const b = [...document.querySelectorAll("button, a")].find((x) => x.textContent.trim().includes(${JSON.stringify(text)}) && !x.disabled); if (b) b.click(); return !!b; })()`);
  return { send, ev, go, type, click, close: () => (ws.close(), proc.kill()) };
}
const u = `ui_${Date.now() % 100000}`;
const pw = "תהלים 23 ירוק";
const a = await browser();
await a.go("/?lang=he", 3000);
await a.ev(`document.querySelector(".topbar .btn-glow, .topbar button.join-btn")?.click() ?? [...document.querySelectorAll("button")].find((b) => b.textContent.includes("בואו פנימה"))?.click()`);
await sleep(800);
ok(await a.ev(`!!document.querySelector(".join-tabs")`), "the sheet opens with sign up / sign in / guest");
await a.type('input[name="username"]', u);
await a.type('input[autocomplete="nickname"]', "בודק ממשק");
await a.type('input[name="password"]', pw);
await a.ev(`document.querySelector("form.join").requestSubmit()`);
await sleep(2500);
ok(await a.ev(`JSON.parse(localStorage.getItem("ohel.me") || "{}").registered === true`), "signing up in the sheet works");
ok(await a.ev(`document.body.textContent.includes("מעכשיו אפשר להיכנס מכל מכשיר")`), "the welcome says you can sign in anywhere");
await a.click("להמשיך");
await a.go("/settings?lang=he", 2500);
const doc = await a.send("DOM.getDocument", {});
const input = await a.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: 'input[type="file"]' });
await a.send("DOM.setFileInputFiles", { nodeId: input.nodeId, files: [PHOTO] });
await sleep(3500);
const photo = await a.ev(`JSON.parse(localStorage.getItem("ohel.me") || "{}").photo`);
ok(/^\/api\/photo\/\d+$/.test(photo ?? ""), "a photo from the phone is cropped, shrunk and uploaded");
const info = await a.ev(`fetch(${JSON.stringify(photo)}).then(async (r) => ({ type: r.headers.get("content-type"), size: (await r.arrayBuffer()).byteLength }))`);
ok(info && /image\/(webp|jpeg)/.test(info.type) && info.size < 120000, `stored small (${info?.type}, ${Math.round((info?.size ?? 0) / 1024)} KB)`);
ok(await a.ev(`!!document.querySelector(".settings-photo .orb-photo")`), "the new photo shows in Settings");
await a.type("textarea", "אוהב לקרוא את שמואל בבוקר");
await a.click("לשמור");
await sleep(1500);
ok(await a.ev(`JSON.parse(localStorage.getItem("ohel.me") || "{}").bio === "אוהב לקרוא את שמואל בבוקר"`), "a few words about me are saved");
const id = await a.ev(`JSON.parse(localStorage.getItem("ohel.me") || "{}").id`);
await a.close();
// another device: the public profile, then sign in with the password
const b = await browser();
await b.go(`/u/${id}?lang=he`, 3000);
ok(await b.ev(`document.body.textContent.includes("בודק ממשק") && document.body.textContent.includes("אוהב לקרוא את שמואל בבוקר") && !!document.querySelector(".me-card .orb-photo")`), "anyone sees the profile: name, photo, words");
await b.ev(`[...document.querySelectorAll("button")].find((x) => x.textContent.includes("בואו פנימה"))?.click()`);
await sleep(700);
await b.click("כניסה");
await sleep(400);
await b.type('input[name="username"]', u.toUpperCase());
await b.type('input[name="password"]', pw);
await b.ev(`document.querySelector("form.join").requestSubmit()`);
await sleep(3000);
ok(await b.ev(`JSON.parse(localStorage.getItem("ohel.me") || "{}").id === ${JSON.stringify(id)}`), "signing in on another device with the username and password brings the same person");
const tok = await b.ev(`localStorage.getItem("ohel.token")`);
await b.close();
await fetch(`${B}/api/me`, { method: "DELETE", headers: { authorization: `Bearer ${tok}` } });
console.log(fails ? `\n${fails} failed` : "\nall good");
process.exit(fails ? 1 : 0);
