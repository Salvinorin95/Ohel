// Isolated browser fixtures against a production build. No live accounts or remote services are used.
// npm run build && node scripts/readiness-ui-e2e.mjs
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import assert from "node:assert/strict";
const root = path.resolve("dist/client");
if (!fs.existsSync(path.join(root, "index.html"))) throw new Error("Run npm run build first");
const scratch = path.join(process.env.HOME, "AgentScratch");
fs.mkdirSync(scratch, { recursive: true });
const profile = fs.mkdtempSync(path.join(scratch, "Ohel-readiness-browser-"));
fs.writeFileSync(path.join(profile, ".agent-scratch"), JSON.stringify({ created_by: "codex", created_at: new Date().toISOString(), purpose: "Ohel isolated headless browser regression profile" }));
const review = path.resolve("review/readiness-20261117"); fs.mkdirSync(review, { recursive: true });
const types = { ".js":"text/javascript", ".mjs":"text/javascript", ".css":"text/css", ".json":"application/json", ".svg":"image/svg+xml", ".woff2":"font/woff2", ".woff":"font/woff" };
const server = http.createServer((req, res) => {
  let file = path.resolve(root, "." + new URL(req.url, "http://local").pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, "index.html");
  res.setHeader("content-type", types[path.extname(file)] ?? "text/html"); fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const B = `http://127.0.0.1:${server.address().port}`;
const debug = 9700 + Math.floor(Math.random() * 80);
const proc = spawn(process.env.CHROME ?? path.join(process.env.HOME, "Desktop/Google Chrome.app/Contents/MacOS/Google Chrome"), ["--headless=new", "--disable-webgl", `--remote-debugging-port=${debug}`, `--user-data-dir=${profile}`, "--no-first-run"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let socket;
try {
  let version;
  for (let i=0;i<80 && !version;i++) { await sleep(100); version = await fetch(`http://127.0.0.1:${debug}/json/version`).then(r=>r.json()).catch(()=>null); }
  assert.ok(version, "Chrome started");
  const tab = await fetch(`http://127.0.0.1:${debug}/json/new?about:blank`, { method:"PUT" }).then(r=>r.json());
  socket = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r=>socket.onopen=r);
  let id=0; const pending=new Map(); const exceptions=[];
  const send = (method, params={}) => new Promise((resolve,reject)=> { const n=++id; pending.set(n,{resolve,reject}); socket.send(JSON.stringify({id:n,method,params})); });
  const me={id:"fixture",name:"Study Tester",avatar:2,points:0,streak:1,mutedUntil:0,registered:true,username:"tester",bio:""};
  let study={resume:"I Samuel 17",bookmarks:[{ref:"I Samuel 17:1",note:"A saved private note",updated:1}]};
  let textFails=false;
  socket.onmessage=async e=> {
    const m=JSON.parse(e.data);
    if (pending.has(m.id)) { const p=pending.get(m.id); pending.delete(m.id); m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result); }
    if(m.method==="Runtime.exceptionThrown") exceptions.push(m.params.exceptionDetails.text);
    if(m.method!=="Fetch.requestPaused") return;
    const {requestId,request}=m.params, url=new URL(request.url);
    let status=200, data;
    if(url.origin!==B) {status=503;data={error:"blocked_external"};}
    else if(url.pathname==="/api/me") data={me,stats:{},badges:[],visited:[],read:[]};
    else if(url.pathname==="/api/session") data={token:"fixture",me};
    else if(url.pathname==="/api/study") {
      if(request.method==="POST") {const b=JSON.parse(request.postData); if(b.action==="resume") study.resume=b.ref; if(b.action==="bookmark") study.bookmarks=[...study.bookmarks.filter(x=>x.ref!==b.ref),{ref:b.ref,note:b.note,updated:2}]; if(b.action==="remove") study.bookmarks=study.bookmarks.filter(x=>x.ref!==b.ref);}
      data=study;
    } else if(url.pathname==="/api/text") {status=textFails?503:200;data=textFails?{error:"offline"}:{ref:"I Samuel 17",heRef:"שמואל א יז",he:["פסוק ראשון","פסוק שני"],en:["First verse","Second verse"],sources:{he:"Fixture Hebrew",en:"Fixture English",enLicense:"test"}};}
    else if(url.pathname.startsWith("/api/")) {status=503;data={error:"fixture_unavailable"};}
    else {await send("Fetch.continueRequest",{requestId});return;}
    await send("Fetch.fulfillRequest",{requestId,responseCode:status,responseHeaders:[{name:"content-type",value:"application/json"}],body:Buffer.from(JSON.stringify(data)).toString("base64")});
  };
  await send("Runtime.enable"); await send("Page.enable"); await send("Fetch.enable",{patterns:[{urlPattern:"*"}]});
  await send("Emulation.setDeviceMetricsOverride",{width:1100,height:900,deviceScaleFactor:1,mobile:false});
  await send("Page.addScriptToEvaluateOnNewDocument",{source:`localStorage.setItem('ohel.lang','en');localStorage.setItem('ohel.token','fixture');localStorage.setItem('ohel.me',${JSON.stringify(JSON.stringify(me))});`});
  const ev=async expression=> {const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const wait=async expression=> {for(let i=0;i<80;i++){if(await ev(expression))return;await sleep(100);}throw new Error("Wait failed: "+expression);};
  const shot=async name=> {const r=await send("Page.captureScreenshot",{format:"png"});fs.writeFileSync(path.join(review,name),Buffer.from(r.data,"base64"));};
  await send("Page.navigate",{url:B+"/"});
  await wait(`document.body.innerText.includes('A saved private note') && document.body.innerText.includes('Community updates are unavailable')`);
  assert.equal(await ev(`document.querySelectorAll('.guided-study button').length`),3); console.log("PASS guided session, saved library and home failure message");
  await shot("home-saved-study.png");
  await ev(`document.querySelector('.saved-study .link').click()`);
  await wait(`!!document.querySelector('#v-1.on')`);
  await ev(`document.querySelector('.verse-actions input').value='';document.querySelector('.verse-actions button').click()`);
  await wait(`document.body.innerText.includes('Saved to your study library')`);
  assert.equal(study.bookmarks.some(b=>b.ref==="I Samuel 17:1"),true);console.log("PASS saved verse opens highlighted and bookmark saves");
  await shot("reader-bookmark.png");
  textFails=true; await send("Page.reload");
  await wait(`document.body.innerText.includes('Showing a saved copy') && !!document.querySelector('#v-1')`);console.log("PASS reader survives unavailable text API using saved public chapter");
  await ev(`history.pushState(null,'','/map/elah');dispatchEvent(new PopStateEvent('popstate'))`);
  await wait(`!!document.querySelector('.map-fallback')`);
  assert.ok(await ev(`document.querySelectorAll('.map-fallback article').length > 50`));
  await ev(`document.querySelector('.map-fallback article .btn').click()`);
  await wait(`!!document.querySelector('.pp') || !!document.querySelector('.place-page')`);
  console.log("PASS unsupported WebGL provides place directory and opens a detailed text page");
  await sleep(500); await shot("map-text-fallback.png");
  await ev(`document.querySelector('.pp-x').click();history.pushState(null,'','/settings');dispatchEvent(new PopStateEvent('popstate'))`);
  await wait(`document.body.innerText.includes('Sign out on all other devices')`);
  await ev(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Sign out on all other devices')).click()`);
  await wait(`document.body.innerText.includes('Could not sign out other devices')`);
  assert.equal(await ev(`document.body.innerText.includes('Signed out everywhere else')`), false);
  console.log("PASS failed revocation displays failure without a false success message");
  await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await ev(`document.querySelector('.lang-btn').click();history.pushState(null,'','/read/I_Samuel/17/1');dispatchEvent(new PopStateEvent('popstate'))`);
  await wait(`document.documentElement.dir==='rtl' && !!document.querySelector('#v-1.on')`);
  assert.ok(await ev(`document.documentElement.scrollWidth <= innerWidth + 1`));
  await sleep(500); await shot("reader-mobile-hebrew.png");console.log("PASS Hebrew mobile reader and saved verse fit viewport");
  assert.deepEqual(exceptions,[]);console.log("PASS no uncaught browser runtime exceptions");
} finally { socket?.close();proc.kill();await new Promise(r=>server.close(r)); }
