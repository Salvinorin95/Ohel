import { useEffect, useState } from "react";
import { BADGES, LEVELS, POINTS, levelFor } from "../../shared/game.ts";
import { api, type Profile as P } from "../api.ts";
import { Orb } from "../components/Orb.tsx";
import { useApp } from "../state.tsx";

export function Profile() {
  const { t, lang, token, me, refreshMe, setSession, askJoin, toast, go } = useApp();
  const [p, setP] = useState<P | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [sure, setSure] = useState(false);

  useEffect(() => {
    document.title = `${t("navMe")} · Ohel`;
    if (token) void refreshMe().then(setP);
  }, [token, refreshMe, t]);

  if (!token || !me) {
    return (
      <div className="profile">
        <div className="glass card center">
          <p>{t("notJoined")}</p>
          <button className="btn btn-glow big" onClick={() => askJoin()}>
            {t("joinTitle")}
          </button>
          <p className="fine">{t("joinNoEmail")}</p>
        </div>
      </div>
    );
  }

  const lv = levelFor(me.points);
  const earned = new Map(p?.badges.map((b) => [b.badge, b.at]) ?? []);
  const copyKey = async () => {
    await navigator.clipboard?.writeText(token).catch(() => {});
    toast({ kind: "info", text: t("copied") });
  };
  const del = async () => {
    if (!sure) return setSure(true);
    await api("/api/me", { method: "DELETE", token }).catch(() => {});
    setSession(null, null);
    go({ name: "home" });
  };

  return (
    <div className="profile">
      <section className="glass card me-card">
        <Orb avatar={me.avatar} name={me.name} size={84} ring />
        <h1 dir="auto">{me.name}</h1>
        <div className="level">
          <span className="level-name grad">
            {t("level")}: {lv[lang]}
          </span>
          <span className="pts">
            {me.points} {t("points")}
          </span>
        </div>
        <div className="progress" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${Math.round(lv.progress * 100)}%` }} />
        </div>
        {lv.next && (
          <p className="muted small">
            {lv.next.at - me.points} {t("points")} {t("toNext")} {lv.next[lang]}
          </p>
        )}
        <div className="level-path">
          {LEVELS.map((l, i) => (
            <span key={l.at} className={i <= lv.index ? "lp on" : "lp"}>
              {l[lang]}
            </span>
          ))}
        </div>
        {me.streak > 1 && (
          <p className="streak">
            🌙 {me.streak} {t("streak")}
          </p>
        )}
      </section>

      <section className="glass card">
        <h2>{t("badges")}</h2>
        <div className="badges">
          {BADGES.map((b) => {
            const has = earned.has(b.id);
            return (
              <div key={b.id} className={has ? "badge on" : "badge"} title={b.how[lang]}>
                <span className="badge-glyph">{b.glyph}</span>
                <span className="badge-name">{b[lang]}</span>
                <span className="badge-how">{b.how[lang]}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass card">
        <h2>{t("howToEarn")}</h2>
        <ul className="earn">
          <li><span>📖 {t("earnRead")}</span><b>+{POINTS.read}</b></li>
          <li><span>💬 {t("earnMsg")}</span><b>+{POINTS.message}</b></li>
          <li><span>⚡ {t("earnQuiz")}</span><b>+{POINTS.quizCorrect}</b></li>
          <li><span>🔦 {t("earnHelpful")}</span><b>+{POINTS.helpful}</b></li>
          <li><span>✨ {t("earnLight")}</span><b>+{POINTS.lightReceived}</b></li>
          <li><span>📍 {t("earnPlace")}</span><b>+{POINTS.place}</b></li>
        </ul>
      </section>

      <section className="glass card">
        <h2>🔑 {t("yourKey")}</h2>
        <p className="muted">{t("yourKeyHint")}</p>
        {showKey ? (
          <div className="key-row">
            <code dir="ltr">{token}</code>
            <button className="btn small" onClick={() => void copyKey()}>
              {t("copy")}
            </button>
          </div>
        ) : (
          <button className="btn small" onClick={() => setShowKey(true)}>
            {t("showKey")}
          </button>
        )}
        <p className="fine">
          {t("yourId")}: <code dir="ltr" className="id-code">{me.id}</code>
        </p>
      </section>

      {me.admin && (
        <section className="glass card admin-link">
          <h2>🛡️ {t("adminTitle")}</h2>
          <p className="muted">{t("adminHint")}</p>
          <button className="btn btn-glow small" onClick={() => go({ name: "admin" })}>
            {t("adminOpen")}
          </button>
        </section>
      )}

      <section className="glass card leave">
        <div>
          <button className="btn" onClick={() => setSession(null, null)}>
            🚪 {t("signOut")}
          </button>
          <p className="fine">{t("signOutHint")}</p>
        </div>
        <div>
          <button className={sure ? "btn danger on" : "btn danger"} onClick={() => void del()} onBlur={() => setSure(false)}>
            {t("deleteMe")}
          </button>
          {sure && <p className="fine warn">{t("deleteSure")}</p>}
        </div>
      </section>

      <button className="link center-link" onClick={() => go({ name: "about" })}>
        {t("rulesLink")}
      </button>
    </div>
  );
}
