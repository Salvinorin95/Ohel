import { useRef, useState } from "react";
import { useApp } from "../state.tsx";

/** True inside the browsers built into WhatsApp, Instagram, Facebook and the like, which often forget everything. */
export const inAppBrowser = () => /WhatsApp|Instagram|FBAN|FBAV|FB_IAB|Line\/|Telegram|TikTok|Snapchat/i.test(navigator.userAgent);

/** The personal sign-in link: the key rides after the #, which never reaches any server or visit count. */
export const keyLink = (token: string) => `${location.origin}/key#${encodeURIComponent(token)}`;

/**
 * Ways to keep this user: save the key in the phone's or computer's passwords (a real form submission, which is
 * what makes browsers offer to save), or keep a personal sign-in link (e.g. sent to yourself on WhatsApp).
 */
export function SaveUser({ compact }: { compact?: boolean }) {
  const { t, token, me, toast } = useApp();
  const form = useRef<HTMLFormElement>(null);
  const [saved, setSaved] = useState(false);
  if (!token || !me) return null;

  const savePassword = async () => {
    // Chrome and Android: the browser's own save dialog.
    const PC = (window as unknown as { PasswordCredential?: new (d: { id: string; password: string; name: string }) => Credential }).PasswordCredential;
    if (PC && navigator.credentials?.store) {
      try {
        await navigator.credentials.store(new PC({ id: me.name, password: token, name: me.name }));
        setSaved(true);
        return;
      } catch {
        /* fall through to the form */
      }
    }
    // Safari, iPhone, Firefox: submitting a real form with a password field brings up "Save password?".
    form.current?.requestSubmit();
    setSaved(true);
  };

  const link = keyLink(token);
  const shareLink = async () => {
    const text = t("keyLinkShareText");
    if (navigator.share) return void navigator.share({ title: "Ohel", text, url: link }).catch(() => {});
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${link}`)}`, "_blank", "noopener");
  };
  const copyLink = async () => {
    await navigator.clipboard?.writeText(link).catch(() => {});
    toast({ kind: "info", text: t("copied") });
  };

  return (
    <div className={compact ? "save-user compact" : "save-user"}>
      {inAppBrowser() && <p className="save-warn">⚠️ {t("inAppWarn")}</p>}
      <div className="save-opt">
        <button className="btn btn-glow small" onClick={() => void savePassword()}>
          🔐 {t("savePassword")}
        </button>
        <p className="fine">{saved ? t("savePasswordDone") : t("savePasswordHint")}</p>
      </div>
      <div className="save-opt">
        <div className="place-actions">
          <button className="btn small" onClick={() => void shareLink()}>
            📲 {t("keyLinkShare")}
          </button>
          <button className="btn small glass" onClick={() => void copyLink()}>
            🔗 {t("keyLinkCopy")}
          </button>
        </div>
        <p className="fine">{t("keyLinkHint")}</p>
      </div>
      {/* The form the password managers watch. It posts to an endpoint that keeps nothing, inside a hidden frame. */}
      <form ref={form} method="post" action="/api/saved" target="ohel-save-frame" className="sr-only" aria-hidden="true" autoComplete="on">
        <input type="text" name="username" autoComplete="username" value={me.name} readOnly tabIndex={-1} />
        <input type="password" name="password" autoComplete="new-password" value={token} readOnly tabIndex={-1} />
        <button type="submit" tabIndex={-1}>save</button>
      </form>
      <iframe name="ohel-save-frame" title="save" className="sr-only" tabIndex={-1} aria-hidden="true" />
    </div>
  );
}
