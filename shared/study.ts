import { parseRef, refString } from "./books.ts";

export interface Study { resume: string | null; bookmarks: { ref: string; note: string; updated: number }[] }
export const emptyStudy = (): Study => ({ resume: null, bookmarks: [] });

/** Apply one bounded action to the current state, so devices don't replace each other's library. */
export function updateStudy(current: Study, action: Record<string, unknown>, now = Date.now()): Study | null {
  const parsed = typeof action.ref === "string" ? parseRef(action.ref) : null;
  if (!parsed) return null;
  const ref = refString(parsed);
  if (action.action === "resume") return { ...current, resume: ref };
  if (action.action === "remove") return { ...current, bookmarks: current.bookmarks.filter(b => b.ref !== ref) };
  if (action.action !== "bookmark" || typeof action.note !== "string" || action.note.length > 1000) return null;
  const existing = current.bookmarks.some(b => b.ref === ref);
  if (!existing && current.bookmarks.length >= 100) return null;
  return { ...current, bookmarks: [...current.bookmarks.filter(b => b.ref !== ref), { ref, note: action.note.trim(), updated: now }] };
}
