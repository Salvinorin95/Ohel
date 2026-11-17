import { test } from "node:test";
import assert from "node:assert/strict";
import { discover } from "../shared/discovery.ts";

test("English and Hebrew names find the same person and linked places", () => {
  for (const q of ["David", "דוד", "דָּוִד"]) {
    const hits = discover(q);
    assert.ok(hits.some(h => h.kind === "person" && h.id === "david"));
    assert.ok(hits.some(h => h.kind === "place"));
  }
});
test("English and Hebrew reference aliases link the reader and chapter places", () => {
  for (const q of ["1 Samuel 17", "I Samuel 17", "שמואל א 17:4"]) {
    const hits = discover(q), first = hits[0];
    assert.equal(first.kind, "reference");
    if (first.kind === "reference") { assert.equal(first.ref.book, "I Samuel"); assert.equal(first.ref.chapter, 17); }
    assert.ok(hits.some(h => h.kind === "place" && h.id === "elah"));
  }
  assert.ok(discover("אברהם").some(h => h.kind === "journey" && h.id === "abraham"));
  assert.deepEqual(discover(" "), []);
  assert.ok(!discover("Genesis 999").some(h => h.kind === "reference"));
});
