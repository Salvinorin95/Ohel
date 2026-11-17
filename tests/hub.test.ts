import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { DatabaseSync } from "node:sqlite";

// Exercise the real Hub/SQL queries with an in-memory SQLite store. Only the Cloudflare host is replaced.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "cloudflare:workers") return { url: "test:cloudflare-workers", shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === "test:cloudflare-workers") return { format: "module", source: "export class DurableObject { constructor(ctx, env) { this.ctx=ctx; this.env=env; } }", shortCircuit: true };
    return next(url, context);
  },
});
Object.assign(globalThis, { WebSocketRequestResponsePair: class {} });
const { Hub } = await import("../worker/hub.ts");

function fixture() {
  const db = new DatabaseSync(":memory:");
  const sockets: FakeSocket[] = [];
  const sql = { exec(q: string, ...args: unknown[]) {
    let rows: Record<string, unknown>[];
    if (q.includes("CREATE TABLE")) { db.exec(q); rows = []; }
    else rows = db.prepare(q).all(...args as (string | number | null)[]);
    return { toArray: () => rows, [Symbol.iterator]: () => rows[Symbol.iterator]() };
  } };
  const ctx = { storage: { sql }, setWebSocketAutoResponse() {}, getWebSockets(room?: string) { return sockets.filter(s => s.readyState === 1 && (!room || s.at.room === room)); } };
  const hub = new Hub(ctx as never, {} as never);
  const call = async (path: string, token?: string, body?: unknown, method = body ? "POST" : "GET") => {
    const res = await hub.fetch(new Request("https://hub" + path, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) }));
    return { status: res.status, body: await res.json() as any };
  };
  const register = async (username = "tester") => (await call("/api/register", undefined, { username, name: "Tester User", pass: "a".repeat(64) })).body;
  const login = async (username = "tester") => (await call("/api/login", undefined, { username, pass: "a".repeat(64) })).body.token as string;
  const connect = async (token: string) => {
    const ws = new FakeSocket(); sockets.push(ws);
    await hub.webSocketMessage(ws as never, JSON.stringify({ t: "hello", token }));
    assert.ok(ws.at.uid); return ws;
  };
  return { db, hub, sockets, call, register, login, connect };
}
class FakeSocket {
  at: any = { room: "elah", uid: null, name: "", avatar: 0 };
  readyState = 1;
  sent: any[] = [];
  closed = 0;
  deserializeAttachment() { return this.at; }
  serializeAttachment(at: unknown) { this.at = at; }
  send(s: string) { this.sent.push(JSON.parse(s)); }
  close(code: number) { this.closed = code; this.readyState = 3; }
}

test("revocation closes an already-open other-device socket and preserves the caller", async () => {
  const f = fixture();
  try {
    const root = await f.register(); const a = await f.login(); const b = await f.login();
    const A = await f.connect(a), B = await f.connect(b);
    assert.equal((await f.call("/api/sessions", a, undefined, "DELETE")).status, 200);
    assert.equal(B.closed, 4001); assert.equal(B.at.uid, null); assert.equal(A.closed, 0);
    assert.equal((await f.call("/api/me", b)).status, 401);
    assert.equal((await f.call("/api/me", a)).status, 200);
    assert.equal((await f.call("/api/me", root.token)).status, 200);
  } finally { f.db.close(); }
});

test("password change revokes other sessions only after a valid password", async () => {
  const f = fixture();
  try {
    await f.register(); const a = await f.login(), b = await f.login(); const B = await f.connect(b);
    assert.equal((await f.call("/api/password", a, { pass: "b".repeat(64), old: "wrong" })).status, 401);
    assert.equal((await f.call("/api/me", b)).status, 200);
    assert.equal((await f.call("/api/password", a, { pass: "b".repeat(64), old: "a".repeat(64) })).status, 200);
    assert.equal(B.closed, 4001); assert.equal((await f.call("/api/me", b)).status, 401);
    assert.equal((await f.call("/api/me", a)).status, 200);
  } finally { f.db.close(); }
});

test("expired sessions fail HTTP and cannot send through a previously authenticated socket", async () => {
  const f = fixture();
  try {
    await f.register(); const a = await f.login(); const A = await f.connect(a);
    f.db.prepare("UPDATE sessions SET created = ?").run(Date.now() - 31 * 86400000);
    assert.equal((await f.call("/api/me", a)).status, 401);
    await f.hub.webSocketMessage(A as never, JSON.stringify({ t: "say", body: "expired message" }));
    assert.equal(A.closed, 4001); assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM messages").get()!.n, 0);
  } finally { f.db.close(); }
});

test("legacy socket attachments with only a uid must authenticate again", async () => {
  const f = fixture();
  try {
    const root = await f.register(); const A = new FakeSocket(); A.at.uid = root.me.id;
    await f.hub.webSocketMessage(A as never, JSON.stringify({ t: "say", body: "legacy attachment" }));
    assert.equal(A.closed, 4001); assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM messages").get()!.n, 0);
  } finally { f.db.close(); }
});

test("study bookmarks and reading position sync across sessions, remain private and delete with the account", async () => {
  const f = fixture();
  try {
    const root = await f.register(); const a = await f.login(), b = await f.login(); const other = await f.register("another");
    assert.equal((await f.call("/api/study", a, { action: "bookmark", ref: "I Samuel 17:4", note: "My private note" })).status, 200);
    await f.call("/api/study", b, { action: "resume", ref: "I Samuel 18" });
    const saved = (await f.call("/api/study", a)).body;
    assert.equal(saved.resume, "I Samuel 18"); assert.equal(saved.bookmarks[0].note, "My private note");
    assert.equal((await f.call("/api/study", other.token)).body.bookmarks.length, 0);
    assert.equal((await f.call("/api/study")).status, 401);
    assert.equal((await f.call("/api/study", a, { action: "bookmark", ref: "invalid", note: "x" })).status, 400);
    assert.equal((await f.call("/api/study", a, { action: "bookmark", ref: "Genesis 1", note: "x".repeat(1001) })).status, 400);
    await f.call("/api/me", root.token, undefined, "DELETE");
    assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM study WHERE uid = ?").get(root.me.id)!.n, 0);
  } finally { f.db.close(); }
});

test("recovery-key replacement invalidates old keys, all sessions and existing chats", async () => {
  const f = fixture();
  try {
    const root = await f.register(); const a = await f.login(), b = await f.login();
    const R = await f.connect(root.token), A = await f.connect(a), B = await f.connect(b);
    const rejected = await f.call("/api/recovery-key", a, { pass: "wrong" });
    assert.equal(rejected.status, 401); assert.equal((await f.call("/api/me", root.token)).status, 200);
    assert.equal((await f.call("/api/recovery-key", root.token, { nextKey: root.token })).status, 400);
    assert.equal((await f.call("/api/recovery-key", root.token, { nextKey: "weak" })).status, 400);
    const candidate = "ohel_" + "Q".repeat(32);
    const rotated = await f.call("/api/recovery-key", a, { pass: "a".repeat(64), nextKey: candidate });
    assert.equal(rotated.body.token, candidate);
    assert.equal(rotated.status, 200); assert.notEqual(rotated.body.token, root.token);
    for (const token of [root.token, a, b]) assert.equal((await f.call("/api/me", token)).status, 401);
    assert.equal((await f.call("/api/me", rotated.body.token)).status, 200);
    assert.ok([R, A, B].every(ws => ws.closed === 4001));
    assert.equal(typeof await f.login(), "string"); // Password recovery remains possible.
  } finally { f.db.close(); }
});

test("private room access blocks listings, metadata, histories and pre-hello broadcasts", async () => {
  const f = fixture();
  try {
    const host = await f.register(), member = await f.register("visitor"), outsider = await f.register("outsider");
    const created = await f.call("/api/rooms", host.token, { title: "Private study group", private: true });
    assert.equal(created.status, 200); const id = created.body.room.id;
    assert.equal(created.body.room.private, true);
    assert.ok(!(await f.call("/api/rooms")).body.rooms.some((r: any) => r.id === id));
    assert.ok((await f.call("/api/rooms", host.token)).body.rooms.some((r: any) => r.id === id));
    assert.equal((await f.call(`/api/rooms/${id}`, outsider.token)).status, 404);
    assert.equal((await f.call(`/api/rooms/${id}`)).status, 404);
    const blocked = new FakeSocket(); blocked.at.room = id; f.sockets.push(blocked);
    await f.hub.webSocketMessage(blocked as never, JSON.stringify({ t: "hello", token: outsider.token }));
    assert.equal(blocked.closed, 4004); assert.ok(!blocked.sent.some(m => m.t === "welcome"));
    const preHello = new FakeSocket(); preHello.at.room = id; f.sockets.push(preHello);
    const H = new FakeSocket(); H.at.room = id; f.sockets.push(H);
    await f.hub.webSocketMessage(H as never, JSON.stringify({ t: "hello", token: host.token }));
    await f.hub.webSocketMessage(H as never, JSON.stringify({ t: "say", body: "Private message" }));
    assert.equal(preHello.sent.length, 0);
    assert.equal((await f.call(`/api/rooms/${id}/invite`, outsider.token, {}, "POST")).status, 403);
    const invite = (await f.call(`/api/rooms/${id}/invite`, host.token, {}, "POST")).body.invite;
    assert.equal((await f.call(`/api/rooms/${id}/join`, member.token, { invite: "wrong" })).status, 404);
    assert.equal((await f.call(`/api/rooms/${id}/join`, member.token, { invite })).status, 200);
    assert.equal((await f.call(`/api/rooms/${id}`, member.token)).status, 200);
    const M = new FakeSocket(); M.at.room = id; f.sockets.push(M);
    await f.hub.webSocketMessage(M as never, JSON.stringify({ t: "hello", token: member.token }));
    assert.ok(M.sent.find(m => m.t === "welcome").history.some((m: any) => m.body === "Private message"));
    const members = (await f.call(`/api/rooms/${id}/members`, host.token)).body.members;
    assert.equal(members.length, 2);
    assert.equal((await f.call(`/api/rooms/${id}/members`, outsider.token)).status, 403);
    const next = (await f.call(`/api/rooms/${id}/invite`, host.token, {}, "POST")).body.invite;
    assert.notEqual(next, invite);
    assert.equal((await f.call(`/api/rooms/${id}/join`, outsider.token, { invite })).status, 404);
    assert.equal((await f.call(`/api/rooms/${id}`, member.token)).status, 200); // Replacing a link doesn't remove members.
    assert.equal((await f.call(`/api/rooms/${id}/members/${member.me.id}`, host.token, undefined, "DELETE")).status, 200);
    assert.equal(M.closed, 4004);
    assert.equal((await f.call(`/api/rooms/${id}`, member.token)).status, 404);
    assert.ok(!(await f.call("/api/rooms", member.token)).body.rooms.some((r: any) => r.id === id));
  } finally { f.db.close(); }
});
