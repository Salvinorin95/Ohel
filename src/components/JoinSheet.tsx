import { useState } from "react";
import { ORBS } from "../../shared/game.ts";
import type { Me } from "../../shared/protocol.ts";
import { api, ApiError, type Profile } from "../api.ts";
import type { Key } from "../i18n.ts";
import { useApp } from "../state.tsx";
import { Orb } from "./Orb.tsx";
import { Sheet } from "./Sheet.tsx";
import { inAppBrowser, SaveUser } from "./SaveUser.tsx";

export function JoinSheet() {
  const { t, setSession, closeJoin, celebrate, go } = useApp();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(() => Math.floor(Math.random() * ORBS.length));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [keyMode, setKeyMode] = useState(false);
  const [key, setKey] = useState("");
  const [welcome, setWelcome] = useState<Me | null>(null);

  const join = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ token: string; me: Me }>("/api/join", { body: { name, avatar } });
      setSession(r.token, r.me);
      celebrate({ delta: 0, total: r.me.points, badges: [] }, "");
      // Before going on: a moment to keep this user (passwords or a personal link), so tomorrow isn't a new person.
      setWelcome(r.me);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "";
      setErr(code.startsWith("name_") ? t(`nameErr_${code.slice(5)}` as Key) : t("joinErr"));
    } finally {
      setBusy(false);
    }
  };

  const useKey = async () => {
    setBusy(true);
    setErr("");
    try {
      const token = key.trim();
      const p = await api<Profile>("/api/me", { token });
      setSession(token, p.me);
      closeJoin(true);
    } catch {
      setErr(t("keyErr"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={welcome ? t("saveUserTitle") : t("joinTitle")} onClose={() => closeJoin(!!welcome)}>
      {welcome ? (
        <div className="join join-welcome">
          <div className="join-preview">
            <Orb avatar={welcome.avatar} name={welcome.name} size={72} ring />
          </div>
          <h3 dir="auto">
            ✨ {t("welcomeIn")}, {welcome.name}
          </h3>
          <p className="muted">{t("saveUserHint")}</p>
          <SaveUser compact />
          <button className="btn btn-glow big" onClick={() => closeJoin(true)}>
            {t("welcomeContinue")}
          </button>
        </div>
      ) : !keyMode ? (
        <form
          className="join"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) void join();
          }}
        >
          <div className="join-preview">
            <Orb avatar={avatar} name={name || "?"} size={72} ring />
          </div>
          <label className="field">
            <span>{t("joinName")}</span>
            <input autoFocus value={name} maxLength={24} placeholder={t("joinNamePh")} onChange={(e) => setName(e.target.value)} dir="auto" />
          </label>
          <div className="field">
            <span>{t("joinOrb")}</span>
            <div className="orb-pick">
              {ORBS.map((_, i) => (
                <button type="button" key={i} className={i === avatar ? "orb-choice on" : "orb-choice"} onClick={() => setAvatar(i)} aria-label={`${i + 1}`}>
                  <Orb avatar={i} size={34} />
                </button>
              ))}
            </div>
          </div>
          {inAppBrowser() && <p className="save-warn">⚠️ {t("inAppWarn")}</p>}
          {err && <p className="err">{err}</p>}
          <button className="btn btn-glow big" disabled={busy || name.trim().length < 2}>
            {t("joinGo")}
          </button>
          <p className="fine">{t("joinNoEmail")}</p>
          <p className="fine">
            {t("kindness")}{" "}
            <button type="button" className="link small" onClick={() => (closeJoin(false), go({ name: "about" }))}>
              {t("rulesLink")}
            </button>
          </p>
          <button type="button" className="link" onClick={() => setKeyMode(true)}>
            {t("haveKey")}
          </button>
        </form>
      ) : (
        <form
          className="join"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) void useKey();
          }}
        >
          {/* Named like a sign-in form, so a key saved in the phone's passwords is offered here. */}
          <input type="text" name="username" autoComplete="username" className="sr-only" tabIndex={-1} aria-hidden="true" />
          <label className="field">
            <span>{t("yourKey")}</span>
            <input
              autoFocus
              type="password"
              name="password"
              autoComplete="current-password"
              value={key}
              placeholder={t("keyPh")}
              onChange={(e) => setKey(e.target.value)}
              dir="ltr"
              spellCheck={false}
            />
          </label>
          {err && <p className="err">{err}</p>}
          <button className="btn btn-glow big" disabled={busy || key.trim().length < 10}>
            {t("useKey")}
          </button>
          <button type="button" className="link" onClick={() => setKeyMode(false)}>
            {t("back")}
          </button>
        </form>
      )}
    </Sheet>
  );
}
