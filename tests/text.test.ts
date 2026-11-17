import { test } from "node:test";
import assert from "node:assert/strict";
import { chapterText } from "../worker/text.ts";

const chapter = { heRef: "בראשית א", versions: [{ language: "he", versionTitle: "Hebrew source", text: ["<b>בראשית</b>"] }, { language: "en", versionTitle: "English source", text: ["In the beginning"] }] };
function cacheFixture() {
  const entries = new Map<string, Response>();
  return { entries, cache: { match: async (k: Request) => entries.get(k.url)?.clone(), put: async (k: Request, r: Response) => { entries.set(k.url, r.clone()); } } as unknown as Cache };
}
const req = () => new Request("https://ohel/api/text?ref=Genesis%201");

test("chapter cache stores only valid public text and serves fresh hits without fetching", async () => {
  const { cache } = cacheFixture(); const pending: Promise<unknown>[] = [];
  const ctx = { waitUntil(p: Promise<unknown>) { pending.push(p); } };
  const res = await chapterText(req(), ctx, { cache, fetcher: (async () => Response.json(chapter)) as typeof fetch });
  assert.equal(res.status, 200); assert.equal((await res.json() as any).he[0], "בראשית");
  await Promise.all(pending);
  const hit = await chapterText(req(), ctx, { cache, fetcher: (async () => { throw new Error("must not fetch"); }) as typeof fetch });
  assert.equal(hit.status, 200);
});

test("upstream failure serves a labeled longer-lived saved copy", async () => {
  const { cache, entries } = cacheFixture(); const pending: Promise<unknown>[] = [];
  const ctx = { waitUntil(p: Promise<unknown>) { pending.push(p); } };
  await chapterText(req(), ctx, { cache, fetcher: (async () => Response.json(chapter)) as typeof fetch });
  await Promise.all(pending);
  for (const key of entries.keys()) if (!key.endsWith("/saved")) entries.delete(key);
  const fallback = await chapterText(req(), ctx, { cache, fetcher: (async () => { throw new Error("offline"); }) as typeof fetch });
  assert.equal(fallback.status, 200); assert.equal((await fallback.json() as any).cached, true);
  assert.equal(fallback.headers.get("cache-control"), "no-store");
});

test("timeout and malformed/empty upstream text fail with a retryable response and never poison the cache", async () => {
  const { cache, entries } = cacheFixture(); const ctx = { waitUntil() {} };
  for (const body of [{}, { versions: [] }]) {
    const res = await chapterText(req(), ctx, { cache, fetcher: (async () => Response.json(body)) as typeof fetch });
    assert.equal(res.status, 503);
  }
  const keepAlive = setTimeout(() => {}, 50);
  try {
    const res = await chapterText(req(), ctx, { cache, timeoutMs: 5, fetcher: ((_url: unknown, init: RequestInit) => new Promise((_resolve, reject) => init.signal!.addEventListener("abort", () => reject(new Error("timeout"))))) as typeof fetch });
    assert.equal(res.status, 503); assert.equal(res.headers.get("retry-after"), "30"); assert.equal(entries.size, 0);
  } finally { clearTimeout(keepAlive); }
});

test("invalid chapter references never fetch upstream", async () => {
  const { cache } = cacheFixture();
  const res = await chapterText(new Request("https://ohel/api/text?ref=garbage"), { waitUntil() {} }, { cache, fetcher: (async () => { throw new Error("unexpected fetch"); }) as typeof fetch });
  assert.equal(res.status, 400);
});
