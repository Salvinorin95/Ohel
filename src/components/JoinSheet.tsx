import { useState } from "react";
import { ORBS } from "../../shared/game.ts";
import type { Me } from "../../shared/protocol.ts";
import { stretch } from "../../shared/stretch.ts";
import { api, ApiError, type Profile } from "../api.ts";
import type { Key } from "../i18n.ts";
import { useApp } from "../state.tsx";
import { Orb } from "./Orb.tsx";
import { inAppBrowser, SaveUser } from "./SaveUser.tsx";
import { Sheet } from "./Sheet.tsx";

type Mode = "register" | "login" | "guest" | "key";

/** Coming in: sign up (username + password, from any device), sign in, come in as a guest, or use a key. */
export function JoinSheet() {
  const { t, setSession, closeJoin, celebrate, go } = useApp();
  const [mode, setMode] = useState<Mode>("register");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(() => Math.floor(Math.random() * ORBS.length));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState("");
  const [welcome, setWelcome] = useState<{ me: Me; registered: boolean } | null>(null);

  const errText = (e: unknown) => {
    const code = e instanceof ApiError ? e.code : "";
    if (code.startsWith("name_")) return t(`nameErr_${code.slice(5)}` as Key);
    if (code === "key") return t("keyErr");
    if (code === "rate") return t(mode === "login" ? "err_login_rate" : "err_rate");
    const k = `err_${code}` as Key;
    return t(k) !== k ? t(k) : t("joinErr");
  };
  const run = async (f: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      await f();
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const register = () =>
    run(async () => {
      if (password.length < 8) throw new ApiError("short_password", 400, {});
      const pass = await stretch(username, password);
      const r = await api<{ token: string; me: Me }>("/api/register", { body: { username: username.trim(), pass, name: name.trim() || username.trim(), avatar } });
      setSession(r.token, r.me);
      celebrate({ delta: 0, total: r.me.points, badges: [] }, "");
      setWelcome({ me: r.me, registered: true });
    });
  const login = () =>
    run(async () => {
      const pass = await stretch(username, password);
      const r = await api<{ token: string; me: Me }>("/api/login", { body: { username: username.trim(), pass } });
      setSession(r.token, r.me);
      closeJoin(true);
    });
  const guest = () =>
    run(async () => {
      const r = await api<{ token: string; me: Me }>("/api/join", { body: { name, avatar } });
      setSession(r.token, r.me);
      celebrate({ delta: 0, total: r.me.points, badges: [] }, "");
      // A guest lives only on this device: a moment to keep it (passwords or a personal link).
      setWelcome({ me: r.me, registered: false });
    });
  const useKey = () =>
    run(async () => {
      const token = key.trim();
      try {
        const p = await api<Profile>("/api/me", { token });
        setSession(token, p.me);
        closeJoin(true);
      } catch {
        throw new ApiError("key", 401, {});
      }
    });

  const tabs = (
    <div className="seg join-tabs" role="tablist">
      {(["register", "login", "guest"] as const).map((m) => (
        <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? "on" : ""} onClick={() => (setMode(m), setErr(""))}>
          {t(m === "register" ? "tabRegister" : m === "login" ? "tabLogin" : "tabGuest")}
        </button>
      ))}
    </div>
  );
  const colours = (
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
  );
  const usernameField = (autoComplete: string) => (
    <label className="field">
      <span>{t("username")}</span>
      <input
        name="username"
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={username}
        maxLength={20}
        onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
        dir="auto"
      />
    </label>
  );
  const passwordField = (autoComplete: "new-password" | "current-password") => (
    <label className="field">
      <span>{t("password")}</span>
      <input type="password" name="password" autoComplete={autoComplete} value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
      {autoComplete === "new-password" && <span className="fine">{t("passwordHint")}</span>}
    </label>
  );
  const errLine = err && <p className="err">{err}</p>;
  const inApp = inAppBrowser() && <p className="save-warn">⚠️ {t("inAppWarn")}</p>;

  return (
    <Sheet title={welcome ? (welcome.registered ? t("welcomeIn") : t("saveUserTitle")) : t("joinTitle")} onClose={() => closeJoin(!!welcome)}>
      {welcome ? (
        <div className="join join-welcome">
          <div className="join-preview">
            <Orb avatar={welcome.me.avatar} name={welcome.me.name} size={72} ring />
          </div>
          <h3 dir="auto">
            ✨ {t("welcomeIn")}, {welcome.me.name}
          </h3>
          {welcome.registered ? (
            <p className="muted">{t("registeredWelcome")}</p>
          ) : (
            <>
              <p className="muted">{t("saveUserHint")}</p>
              <SaveUser compact />
            </>
          )}
          <button className="btn btn-glow big" onClick={() => closeJoin(true)}>
            {t("welcomeContinue")}
          </button>
          {welcome.registered && (
            <button type="button" className="link" onClick={() => (closeJoin(true), go({ name: "settings" }))}>
              📷 {t("toSettings")}
            </button>
          )}
        </div>
      ) : mode === "register" ? (
        <form className="join" onSubmit={(e) => (e.preventDefault(), void register())}>
          {tabs}
          <div className="join-preview">
            <Orb avatar={avatar} name={name || username || "?"} size={64} ring />
          </div>
          {usernameField("username")}
          <p className="fine join-under">{t("usernameHint")}</p>
          <label className="field">
            <span>{t("displayName")}</span>
            <input value={name} maxLength={24} placeholder={username || t("joinNamePh")} onChange={(e) => setName(e.target.value)} dir="auto" autoComplete="nickname" />
          </label>
          {passwordField("new-password")}
          {colours}
          {inApp}
          {errLine}
          <button className="btn btn-glow big" disabled={busy || username.trim().length < 3 || !password}>
            {t("registerGo")}
          </button>
          <p className="fine">{t("registerHint")}</p>
        </form>
      ) : mode === "login" ? (
        <form className="join" onSubmit={(e) => (e.preventDefault(), void login())}>
          {tabs}
          {usernameField("username")}
          {passwordField("current-password")}
          {errLine}
          <button className="btn btn-glow big" disabled={busy || username.trim().length < 3 || !password}>
            {t("loginGo")}
          </button>
          <button type="button" className="link" onClick={() => (setMode("key"), setErr(""))}>
            🔑 {t("forgotPassword")}
          </button>
        </form>
      ) : mode === "guest" ? (
        <form className="join" onSubmit={(e) => (e.preventDefault(), void guest())}>
          {tabs}
          <div className="join-preview">
            <Orb avatar={avatar} name={name || "?"} size={64} ring />
          </div>
          <label className="field">
            <span>{t("joinName")}</span>
            <input autoFocus value={name} maxLength={24} placeholder={t("joinNamePh")} onChange={(e) => setName(e.target.value)} dir="auto" />
          </label>
          {colours}
          {inApp}
          {errLine}
          <button className="btn btn-glow big" disabled={busy || name.trim().length < 2}>
            {t("guestGo")}
          </button>
          <p className="fine">{t("guestHint")}</p>
          <p className="fine">
            {t("kindness")}{" "}
            <button type="button" className="link small" onClick={() => (closeJoin(false), go({ name: "about" }))}>
              {t("rulesLink")}
            </button>
          </p>
          <button type="button" className="link" onClick={() => (setMode("key"), setErr(""))}>
            {t("haveKey")}
          </button>
        </form>
      ) : (
        <form className="join" onSubmit={(e) => (e.preventDefault(), void useKey())}>
          {/* Named like a sign-in form, so a key saved in the phone's passwords is offered here. */}
          <input type="text" name="username" autoComplete="username" className="sr-only" tabIndex={-1} aria-hidden="true" />
          <label className="field">
            <span>{t("yourKey")}</span>
            <input autoFocus type="password" name="password" autoComplete="current-password" value={key} placeholder={t("keyPh")} onChange={(e) => setKey(e.target.value)} dir="ltr" spellCheck={false} />
          </label>
          {errLine}
          <button className="btn btn-glow big" disabled={busy || key.trim().length < 10}>
            {t("useKey")}
          </button>
          <button type="button" className="link" onClick={() => (setMode("login"), setErr(""))}>
            {t("back")}
          </button>
        </form>
      )}
    </Sheet>
  );
}
