import { useEffect, useRef, useState } from "react";
import { BADGES, levelFor, ORBS } from "../../shared/game.ts";
import type { Me, PublicProfile } from "../../shared/protocol.ts";
import { stretch } from "../../shared/stretch.ts";
import { adminAct, api, ApiError } from "../api.ts";
import { Orb } from "../components/Orb.tsx";
import { SaveUser } from "../components/SaveUser.tsx";
import type { Key } from "../i18n.ts";
import { useApp } from "../state.tsx";

/** A photo from the phone, cropped to a centred square and shrunk to 320 px, as WebP (or JPEG where WebP can't be made). */
async function shrinkPhoto(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 320;
  canvas.getContext("2d")!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, 320, 320);
  bmp.close();
  const as = (type: string, q: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));
  const webp = await as("image/webp", 0.85);
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await as("image/jpeg", 0.85);
  if (!jpeg) throw new Error("encode");
  return jpeg;
}

/** /settings: photo, name, colour, a few words; sign up (for guests) or change the password; language; sessions. */
export function Settings() {
  const { t, lang, setLang, token, me, setSession, askJoin, toast, go } = useApp();
  const [name, setName] = useState(me?.name ?? "");
  const [bio, setBio] = useState(me?.bio ?? "");
  const [avatar, setAvatar] = useState(me?.avatar ?? 0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [old, setOld] = useState("");
  const [accErr, setAccErr] = useState("");
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = `${t("settings")} · Ohel`;
  }, [t]);
  useEffect(() => {
    if (me) {
      setName(me.name);
      setBio(me.bio ?? "");
      setAvatar(me.avatar);
    }
    // only when switching person, not on every refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  if (!token || !me) {
    return (
      <div className="profile">
        <section className="glass card">
          <h1>⚙️ {t("settings")}</h1>
          <button className="btn btn-glow" onClick={() => askJoin()}>
            {t("joinTitle")}
          </button>
        </section>
      </div>
    );
  }

  const errOf = (e: unknown, prefix: string) => {
    const code = e instanceof ApiError ? e.code : "";
    if (code.startsWith("name_")) return t(`nameErr_${code.slice(5)}` as Key);
    const k = `${prefix}${code}` as Key;
    return t(k) !== k ? t(k) : t("joinErr");
  };
  const update = (m: Me) => setSession(token, m);

  const saveProfile = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ me: Me }>("/api/profile", { token, body: { name: name.trim(), bio, avatar } });
      update(r.me);
      toast({ kind: "info", text: t("saved"), glyph: "✓" });
    } catch (e) {
      setErr(errOf(e, "saveErr_"));
    } finally {
      setBusy(false);
    }
  };
  const upload = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setErr("");
    try {
      const blob = await shrinkPhoto(f);
      const res = await fetch("/api/photo", { method: "POST", headers: { "content-type": blob.type, authorization: `Bearer ${token}` }, body: blob });
      if (!res.ok) throw new Error(String(res.status));
      update(((await res.json()) as { me: Me }).me);
    } catch {
      setErr(t("photoErr"));
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  };
  const removePhoto = async () => {
    const r = await api<{ me: Me }>("/api/photo", { method: "DELETE", token }).catch(() => null);
    if (r) update(r.me);
  };
  const register = async () => {
    setAccErr("");
    if (pw.length < 8) return setAccErr(t("err_short_password"));
    try {
      const r = await api<{ me: Me }>("/api/register", { token, body: { username: username.trim(), pass: await stretch(username, pw) } });
      update(r.me);
      setPw("");
      toast({ kind: "info", text: t("registeredWelcome"), glyph: "✓" });
    } catch (e) {
      setAccErr(errOf(e, "err_"));
    }
  };
  const changePassword = async () => {
    setAccErr("");
    if (pw.length < 8) return setAccErr(t("err_short_password"));
    try {
      const u = me.username ?? "";
      await api("/api/password", { token, body: { pass: await stretch(u, pw), old: old ? await stretch(u, old) : "" } });
      setPw("");
      setOld("");
      toast({ kind: "info", text: t("passwordChanged"), glyph: "✓" });
    } catch (e) {
      setAccErr(errOf(e, "err_"));
    }
  };
  const rotateKey = async () => {
    if (!confirm(t("rotateKeyConfirm"))) return;
    setBusy(true); setAccErr("");
    try {
      const bytes = crypto.getRandomValues(new Uint8Array(24));
      const nextKey = "ohel_" + btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      // Persist before rotating, so a lost response cannot strand a guest without their new key.
      localStorage.setItem("ohel.pendingRecoveryKey", nextKey);
      const r = await api<{ token: string; me: Me }>("/api/recovery-key", { token, body: { nextKey, pass: old ? await stretch(me.username ?? "", old) : "" } });
      setSession(r.token, r.me); localStorage.removeItem("ohel.pendingRecoveryKey"); setOld("");
      toast({ kind: "info", text: t("rotateKeyDone") });
    } catch (e) { setAccErr(errOf(e, "err_")); }
    finally { setBusy(false); }
  };
  const signOutOthers = async () => {
    setBusy(true);
    setAccErr("");
    try {
      await api("/api/sessions", { method: "DELETE", token });
      toast({ kind: "info", text: t("signedOutAll"), glyph: "✓" });
    } catch {
      setAccErr(t("sessionRevokeFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="profile settings">
      <section className="glass card">
        <h1>⚙️ {t("settings")}</h1>
        <h2>{t("settingsProfile")}</h2>
        <div className="settings-photo">
          <Orb avatar={avatar} name={name || me.name} size={96} ring photo={me.photo} />
          <div className="place-actions">
            <button className="btn btn-glow small" disabled={busy} onClick={() => file.current?.click()}>
              📷 {t("photoUpload")}
            </button>
            {me.photo && (
              <button className="btn small" disabled={busy} onClick={() => void removePhoto()}>
                {t("photoRemove")}
              </button>
            )}
          </div>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => void upload(e.target.files?.[0])} />
        </div>
        <label className="field">
          <span>{t("displayName")}</span>
          <input value={name} maxLength={24} onChange={(e) => setName(e.target.value)} dir="auto" />
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
        <label className="field">
          <span>{t("bio")}</span>
          <textarea value={bio} maxLength={280} rows={3} placeholder={t("bioPh")} onChange={(e) => setBio(e.target.value)} dir="auto" />
          <span className="fine">{[...bio].length}/280</span>
        </label>
        {err && <p className="err">{err}</p>}
        <div className="place-actions">
          <button className="btn btn-glow" disabled={busy || name.trim().length < 2} onClick={() => void saveProfile()}>
            {t("save")}
          </button>
          <button className="btn glass" onClick={() => go({ name: "user", id: me.id })}>
            👤 {t("settingsProfile")}
          </button>
        </div>
      </section>

      <section className="glass card">
        <h2>{t("settingsAccount")}</h2>
        {me.registered ? (
          <form className="join" onSubmit={(e) => (e.preventDefault(), void changePassword())}>
            <p>
              {t("accountRegistered")} <b dir="auto">{me.username}</b>
            </p>
            <input type="text" name="username" autoComplete="username" value={me.username ?? ""} readOnly className="sr-only" tabIndex={-1} />
            <label className="field">
              <span>{t("passwordOld")}</span>
              <input type="password" autoComplete="current-password" value={old} onChange={(e) => setOld(e.target.value)} dir="ltr" />
            </label>
            <label className="field">
              <span>{t("passwordNew")}</span>
              <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} dir="ltr" />
              <span className="fine">{t("passwordHint")}</span>
            </label>
            {accErr && <p className="err">{accErr}</p>}
            <button className="btn small" disabled={!pw}>
              {t("changePassword")}
            </button>
          </form>
        ) : (
          <form className="join" onSubmit={(e) => (e.preventDefault(), void register())}>
            <p className="muted">{t("accountGuest")}</p>
            <label className="field">
              <span>{t("username")}</span>
              <input name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} maxLength={20} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} dir="auto" />
              <span className="fine">{t("usernameHint")}</span>
            </label>
            <label className="field">
              <span>{t("password")}</span>
              <input type="password" name="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} dir="ltr" />
              <span className="fine">{t("passwordHint")}</span>
            </label>
            {accErr && <p className="err">{accErr}</p>}
            <button className="btn btn-glow small" disabled={username.trim().length < 3 || !pw}>
              {t("registerGo")}
            </button>
          </form>
        )}
        {!me.registered && (
          <div className="settings-keep">
            <h3>🔐 {t("saveUserTitle")}</h3>
            <SaveUser />
          </div>
        )}
        {me.registered && <p className="fine">{t("sessionPolicy")}</p>}
        <p className="fine">{t("rotateKeyWarning")}</p>
        <button className="btn small" disabled={busy} onClick={() => void rotateKey()}>{t("rotateKey")}</button>
        {me.registered && (
          <button className="btn small glass" disabled={busy} onClick={() => void signOutOthers()}>
            🚪 {t("signOutAll")}
          </button>
        )}
      </section>

      <section className="glass card">
        <h2>{t("settingsLang")}</h2>
        <div className="seg">
          <button className={lang === "he" ? "on" : ""} onClick={() => setLang("he")}>
            עברית
          </button>
          <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>
            English
          </button>
        </div>
      </section>
    </div>
  );
}

/** /u/<id>: anyone's profile. Admins can remove a photo or words that don't belong. */
export function UserPage({ id }: { id: string }) {
  const { t, lang, me, token, go } = useApp();
  const [p, setP] = useState<PublicProfile | null | undefined>(undefined);
  const load = () => api<PublicProfile>(`/api/users/${encodeURIComponent(id)}`).then(setP, () => setP(null));
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => {
    if (p) document.title = `${p.name} · Ohel`;
  }, [p]);
  if (p === undefined) return <div className="loading-shimmer">{t("loading")}</div>;
  if (p === null) return <p className="muted profile">{t("profileNotFound")}</p>;
  const lv = levelFor(p.points);
  const mod = async (action: "clear_photo" | "clear_bio") => {
    if (token) await adminAct(token, { on: "user", id: p.id, action }).catch(() => {});
    void load();
  };
  const joined = new Intl.DateTimeFormat(lang === "he" ? "he-IL" : "en", { month: "long", year: "numeric" }).format(p.joined);
  return (
    <div className="profile">
      <section className="glass card me-card">
        <Orb avatar={p.avatar} name={p.name} size={110} ring photo={p.photo} />
        <h1 dir="auto">{p.name}</h1>
        <div className="place-actions user-pills">
          <span className="pill">{p.registered ? t("profileMember") : t("profileGuest")}</span>
          {p.admin && <span className="pill pill-known">{t("adminTitle")}</span>}
          <span className="pill">
            {lv[lang]} · ✨ {p.points}
          </span>
        </div>
        {p.bio && (
          <p className="user-bio" dir="auto">
            {p.bio}
          </p>
        )}
        <p className="fine">
          {t("profileJoined")} {joined}
        </p>
        {me?.id === p.id && (
          <button className="btn small" onClick={() => go({ name: "settings" })}>
            ⚙️ {t("settings")}
          </button>
        )}
      </section>
      {p.badges.length > 0 && (
        <section className="glass card">
          <h2>🏅 {t("profileBadges")}</h2>
          <div className="badges">
            {BADGES.filter((b) => p.badges.includes(b.id)).map((b) => (
              <div key={b.id} className="badge on" title={b.how[lang]}>
                <span className="badge-glyph">{b.glyph}</span>
                <span className="badge-name">{b[lang]}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      {me?.admin && me.id !== p.id && (
        <section className="glass card admin-link">
          <h2>🛡️ {t("adminTitle")}</h2>
          <div className="place-actions">
            {p.photo && (
              <button className="btn small danger" onClick={() => void mod("clear_photo")}>
                {t("adminClearPhoto")}
              </button>
            )}
            {p.bio && (
              <button className="btn small danger" onClick={() => void mod("clear_bio")}>
                {t("adminClearBio")}
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
