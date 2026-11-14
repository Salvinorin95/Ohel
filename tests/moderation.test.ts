import { test } from "node:test";
import assert from "node:assert/strict";
import { check, checkName } from "../worker/moderation.ts";

const blocked = [
  "you fucking idiot", "f u c k this", "f.u.c.k", "sh1t", "FUUUCK", "bullshit", "son of a bitch",
  "כוס אמק", "כוסאמא שלך", "כוס עמק", "יא בן זונה", "בנזונה", "שרמוטה", "לך תזדיין", "מניאק", "המניאק הזה", "יא מפגר",
  "על הזין שלי", "חתיכת חרא", "kus emek", "ya zona",
  "nigger", "n1gger", "faggot", "kike", "ערבוש", "צ'חצ'ח", "קוקסינל", "כושי מסריח", "כושי", "death to jews", "מוות לערבים",
  "ערבים מסריחים", "heil hitler", "שתמות",
];
const allowed = [
  "רחב הזונה הסתירה את המרגלים", "יפתח היה בן אשה זונה", "ויאמר יואב לכושי לך הגד למלך", "כוסי רויה",
  "Balaam's ass spoke", "shittim wood", "the camp at Shittim", "a bastard shall not enter", "damn", "hell and Sheol",
  "I Samuel 31:4", "1 Samuel 31", "שמואל א פרק לא", "הָרֵי בַגִּלְבֹּעַ אַל טַל וְאַל מָטָר", "Niger", "scrap the plan",
  "the cocoon", "a raccoon", "spice", "conspicuous", "title", "Cushite", "assemble", "class", "passage", "Shunem",
  "מות תמות", "עזאזל", "הזונות", "מגדל בבל", "Dick", "classic", "assassin", "cucumber", "circumstance",
];

for (const s of blocked) test(`blocks: ${s}`, () => assert.equal(check(s).ok, false, s));
for (const s of allowed) test(`allows: ${s}`, () => assert.equal(check(s).ok, true, s));

test("slurs are severity 2, curses 1", () => {
  assert.equal(check("kike").severity, 2);
  assert.equal(check("shit").severity, 1);
});

test("names", () => {
  assert.equal(checkName("Matti").ok, true);
  assert.equal(checkName("מתי").ok, true);
  assert.equal(checkName("x").ok, false);
  assert.equal(checkName("Admin").ok, false);
  assert.equal(checkName("<script>").ok, false);
  assert.equal(checkName("fuckface").ok, false);
});
