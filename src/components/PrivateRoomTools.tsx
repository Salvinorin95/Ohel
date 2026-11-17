import { useEffect, useState } from "react";
import { api } from "../api.ts";
import { useApp } from "../state.tsx";

export function PrivateRoomTools({ id }: { id: string }) {
  const { t, token, me, toast } = useApp();
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const load = () => api<{ members: typeof members }>(`/api/rooms/${id}/members`, { token }).then(r => setMembers(r.members));
  useEffect(() => { if (open) void load().catch(() => toast({ kind: "warn", text: t("joinErr") })); }, [id, token, open]);
  const invite = async () => {
    setBusy(true);
    try {
      const r = await api<{ invite: string }>(`/api/rooms/${id}/invite`, { token, method: "POST" });
      setLink(`${location.origin}/room/${id}#invite=${encodeURIComponent(r.invite)}`);
    } catch { toast({ kind: "warn", text: t("joinErr") }); }
    finally { setBusy(false); }
  };
  const remove = async (uid: string) => {
    setBusy(true);
    try { await api(`/api/rooms/${id}/members/${uid}`, { token, method: "DELETE" }); await load(); }
    catch { toast({ kind: "warn", text: t("joinErr") }); }
    finally { setBusy(false); }
  };
  return <details className="private-tools glass" onToggle={e => setOpen(e.currentTarget.open)}>
    <summary>{t("privateRoom")}</summary>
    <p className="fine">{t("privateRoomHint")}</p><p className="fine">{t("inviteWarning")}</p>
    <button className="btn small" disabled={busy} onClick={() => void invite()}>{t("inviteCreate")}</button>
    {link && <label className="field"><span>{t("privateRoom")}</span><input readOnly value={link} onFocus={e => e.currentTarget.select()} dir="ltr" /></label>}
    <h3>{t("inviteMembers")}</h3>
    <ul>{members.map(m => <li key={m.id}>{m.name} {m.id !== me?.id && <button className="btn small" disabled={busy} onClick={() => void remove(m.id)}>{t("inviteRemove")}</button>}</li>)}</ul>
  </details>;
}
