import { useEffect, useState } from "react";
import { parseRef, refLabel } from "../../shared/books.ts";
import type { Study } from "../../shared/study.ts";
import { getStudy, saveStudy } from "../api.ts";
import { useApp } from "../state.tsx";

export function StudyCard() {
  const { token, lang, t, go, toast } = useApp();
  const [study, setStudy] = useState<Study | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setStudy(null); setFailed(false);
    if (token) getStudy(token).then(s => { if (live) setStudy(s); }, () => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [token, attempt]);
  if (!token) return null;
  const open = (ref: string) => {
    const r = parseRef(ref);
    if (r) go({ name: "read", book: r.book, chapter: r.chapter, verse: r.verse });
  };
  const remove = async (ref: string) => {
    try { setStudy(await saveStudy(token, "remove", ref)); }
    catch { toast({ kind: "warn", text: t("studySaveFailed") }); }
  };
  return <section className="glass card">
    <h2>{t("studyTitle")}</h2><p className="fine">{t("studyHint")}</p>
    {failed && <p role="status">{t("studyLoadFailed")} <button className="link" onClick={() => setAttempt(a => a + 1)}>{t("retry")}</button></p>}
    {study?.resume && <button className="btn" onClick={() => open(study.resume!)}>{t("studyResume")} · {refLabel(study.resume, lang)}</button>}
    {study && study.bookmarks.length > 0 && <ul className="saved-study">{[...study.bookmarks].reverse().map(b => <li key={b.ref}><button className="link" onClick={() => open(b.ref)}>{refLabel(b.ref, lang)}</button>{b.note && <p dir="auto">{b.note}</p>}<button className="btn small" onClick={() => void remove(b.ref)}>{t("studyRemove")}</button></li>)}</ul>}
  </section>;
}
