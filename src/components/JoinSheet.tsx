import { useState } from "react";
import { ORBS } from "../../shared/game.ts";
import type { Me } from "../../shared/protocol.ts";
import { api, ApiError, type Profile } from "../api.ts";
import type { Key } from "../i18n.ts";
import { useApp } from "../state.tsx";
import { Orb } from "./Orb.tsx";
import { Sheet } from "./Sheet.tsx";

export function JoinSheet() {
  const { t, setSession, closeJoin, celebrate } = useApp();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(() => Math.floor(Math.random() * ORBS.length));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [keyMode, setKeyMode] = useState(false);
  const [key, setKey] = useState("");

  const join = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ token: string; me: Me }>("/api/join", { body: { name, avatar } });
      setSession(r.token, r.me);
      closeJoin(true);
      celebrate({ delta: 0, total: r.me.points, badges: [] }, "");
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
    <Sheet title={t("joinTitle")} onClose={() => closeJoin(false)}>
      {!keyMode ? (
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
          {err && <p className="err">{err}</p>}
          <button className="btn btn-glow big" disabled={busy || name.trim().length < 2}>
            {t("joinGo")}
          </button>
          <p className="fine">{t("joinNoEmail")}</p>
          <p className="fine">{t("kindness")}</p>
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
          <label className="field">
            <span>{t("yourKey")}</span>
            <input autoFocus value={key} placeholder={t("keyPh")} onChange={(e) => setKey(e.target.value)} dir="ltr" spellCheck={false} />
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
