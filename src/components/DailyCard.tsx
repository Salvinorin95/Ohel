import { useEffect, useRef, useState } from "react";
import { parseRef, refLabel } from "../../shared/books.ts";
import type { DailyPublic, DailyResult } from "../../shared/protocol.ts";
import { getDaily, postDaily } from "../api.ts";
import { useApp } from "../state.tsx";

/** One question a day, the same for everyone. Answering keeps a run going; seven in a row earns a badge. */
export function DailyCard() {
  const { t, lang, go, token, askJoin, celebrate } = useApp();
  const [q, setQ] = useState<DailyPublic | null>(null);
  const [mine, setMine] = useState<DailyResult | null>(null);
  const [run, setRun] = useState(0);
  const [busy, setBusy] = useState(false);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    let live = true;
    if (!token) {
      setMine(null);
      setRun(0);
    }
    getDaily(token)
      .then((d) => {
        if (!live) return;
        setQ(d);
        // Never wipe an answer given a moment ago (this reload can cross paths with it right after signing up).
        setMine((cur) => d.mine ?? cur);
        setRun((cur) => Math.max(cur, d.run ?? 0));
      })
      .catch(() => live && setQ(null));
    return () => {
      live = false;
    };
  }, [token]);

  if (!q) return null;
  const side = q[lang];
  const ref = parseRef(q.ref);

  const answer = async (i: number) => {
    // Right after signing up the new key is already saved, even if this card hasn't re-rendered with it yet.
    const tok = tokenRef.current ?? localStorage.getItem("ohel.token");
    if (!tok) return askJoin(() => void answer(i));
    if (busy || mine) return;
    setBusy(true);
    try {
      const r = await postDaily(tok, i);
      setMine(r.mine);
      setRun(r.run);
      if (r.award) celebrate(r.award, r.mine.correct ? "daily" : "dailyTry");
    } catch {
      /* a network hiccup: the buttons stay so they can try again */
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="daily-card glass">
      <div className="today-head">
        <h2>❓ {t("dailyTitle")}</h2>
        {run > 0 && (
          <span className="pill daily-run">
            🔥 {run === 1 ? t("dailyRunOne") : `${run} ${t("dailyRun")}`}
          </span>
        )}
      </div>
      <p className="daily-q" dir="auto">
        {side.q}
      </p>
      <div className="daily-opts">
        {side.options.map((o, i) => {
          const state = !mine ? "" : i === mine.answer ? " right" : i === mine.choice ? " wrong" : " dim";
          return (
            <button key={i} className={`daily-opt${state}`} disabled={!!mine || busy} onClick={() => void answer(i)} dir="auto">
              {o}
            </button>
          );
        })}
      </div>
      {mine ? (
        <div className="daily-after">
          <p className={mine.correct ? "daily-verdict right" : "daily-verdict wrong"}>
            {mine.correct ? `✓ ${t("dailyRight")}` : `${t("dailyWrong")} ${side.options[mine.answer]}`}
          </p>
          <p className="daily-explain" dir="auto">
            {mine.explain[lang]}
          </p>
          <div className="place-actions">
            {ref && (
              <button className="chip" onClick={() => go({ name: "read", book: ref.book, chapter: ref.chapter })}>
                📖 {refLabel(q.ref, lang)}
              </button>
            )}
            <span className="muted small">{t("dailyTomorrow")}</span>
          </div>
        </div>
      ) : (
        !token && <p className="muted small">{t("dailyJoinHint")}</p>
      )}
    </section>
  );
}
