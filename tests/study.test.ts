import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyStudy, updateStudy } from "../shared/study.ts";

test("a bookmark update preserves other device additions and enforces the bound", () => {
  let s = emptyStudy();
  for (let i = 1; i <= 100; i++) s = updateStudy(s, { action: "bookmark", ref: `Psalms ${i}`, note: "note" })!;
  assert.equal(s.bookmarks.length, 100);
  assert.equal(updateStudy(s, { action: "bookmark", ref: "Psalms 101", note: "extra" }), null);
  const replaced = updateStudy(s, { action: "bookmark", ref: "Psalms 1", note: "updated" })!;
  assert.equal(replaced.bookmarks.length, 100); assert.equal(replaced.bookmarks.at(-1)!.note, "updated");
  const removed = updateStudy(replaced, { action: "remove", ref: "Psalms 1" })!;
  assert.equal(removed.bookmarks.length, 99);
  assert.equal(updateStudy(s, { action: "resume", ref: "Genesis 999" }), null);
});
