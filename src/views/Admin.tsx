import { useCallback, useEffect, useState } from "react";
import type { AdminAction, AdminData, AdminMsg, AdminUser } from "../../shared/protocol.ts";
import { adminAct, adminGet } from "../api.ts";
import { Orb } from "../components/Orb.tsx";
import { dateTimeOf, type Key } from "../i18n.ts";
import { useApp } from "../state.tsx";

// Looking after the tent: how busy it is, what people reported, who's paused, and the rooms people opened.

/** A button that asks for a second tap before doing something hard to undo. */
function SureButton({ label, sure, onGo, className = "" }: { label: string; sure: string; onGo: () => void; className?: string }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      className={`${className} ${armed ? "on" : ""}`.trim()}
      onClick={() => (armed ? (setArmed(false), onGo()) : setArmed(true))}
      onBlur={() => setArmed(false)}
    >
      {armed ? sure : label}
    </button>
  );
}

function UserTags({ u }: { u: AdminUser }) {
  const { t, lang } = useApp();
  const now = Date.now();
  return (
    <>
      {u.banned && <span className="pill pill-danger">{t("blockedTag")}</span>}
      {!u.banned && u.mutedUntil > now && (
        <span className="pill pill-traditional">
          {t("pausedUntil")} {dateTimeOf(u.mutedUntil, lang)}
        </span>
      )}
      {u.strikes > 0 && (
        <span className="pill pill-debated">
          {u.strikes} {t("strikesN")}
        </span>
      )}
    </>
  );
}

function UserActions({ u, act }: { u: AdminUser; act: (a: AdminAction) => void }) {
  const { t } = useApp();
  const paused = u.mutedUntil > Date.now();
  if (u.banned) {
    return (
      <button className="mod" onClick={() => act({ on: "user", id: u.id, action: "unban" })}>
        {t("modUnban")}
      </button>
    );
  }
  return (
    <>
      {paused || u.strikes > 0 ? (
        <button className="mod" onClick={() => act({ on: "user", id: u.id, action: "unmute" })}>
          {t("modUnmute")}
        </button>
      ) : null}
      {!paused && (
        <>
          <button className="mod" onClick={() => act({ on: "user", id: u.id, action: "mute_hour" })}>
            {t("modMuteHour")}
          </button>
          <button className="mod" onClick={() => act({ on: "user", id: u.id, action: "mute_day" })}>
            {t("modMuteDay")}
          </button>
        </>
      )}
      <SureButton className="mod danger" label={t("modBan")} sure={t("modBanSure")} onGo={() => act({ on: "user", id: u.id, action: "ban" })} />
    </>
  );
}

function MsgItem({ m, act, meId }: { m: AdminMsg; act: (a: AdminAction) => void; meId: string }) {
  const { t, lang, go } = useApp();
  const u = m.user;
  return (
    <li className={m.hidden ? "mod-item is-hidden" : "mod-item"}>
      <div className="mod-who">
        <Orb avatar={m.avatar} name={m.name || "?"} size={30} />
        <div>
          <div className="mod-line">
            <b dir="auto">{m.name || t("someoneLeft")}</b>
            {u && <UserTags u={u} />}
            {m.reports > 0 && (
              <span className="pill pill-danger">
                {m.reports} {t("reportsN")}
              </span>
            )}
            {m.hidden && <span className="pill pill-muted">{t("hiddenTag")}</span>}
          </div>
          <div className="fine">
            <button className="link small" onClick={() => go({ name: "room", id: m.room })} dir="auto">
              {m.roomTitle}
            </button>{" "}
            · {dateTimeOf(m.at, lang)}
          </div>
        </div>
      </div>
      <p className="mod-body" dir="auto">
        {m.body}
      </p>
      <div className="msg-actions">
        {m.hidden ? (
          <button className="mod" onClick={() => act({ on: "msg", id: m.id, action: "restore" })}>
            {t("modRestore")}
          </button>
        ) : (
          <button className="mod" onClick={() => act({ on: "msg", id: m.id, action: "hide" })}>
            {t("modHide")}
          </button>
        )}
        {u && u.id !== meId && <UserActions u={u} act={act} />}
      </div>
    </li>
  );
}

export function Admin() {
  const { t, lang, token, me, toast, go } = useApp();
  const [data, setData] = useState<AdminData | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    adminGet(token)
      .then((d) => (setData(d), setFailed(false)))
      .catch(() => setFailed(true));
  }, [token]);

  useEffect(() => {
    document.title = `${t("adminTitle")} · Ohel`;
    load();
  }, [load, t]);

  const act = (a: AdminAction) => {
    if (!token) return;
    adminAct(token, a)
      .then(() => {
        toast({ kind: "info", text: t("modDone"), glyph: "🛡️" });
        load();
      })
      .catch(() => toast({ kind: "warn", text: t("modErr") }));
  };

  if (!token || !me?.admin || failed) {
    return (
      <div className="profile">
        <div className="glass card center">
          <p>{t("adminOnly")}</p>
          <button className="btn btn-glow" onClick={() => go({ name: "home" })}>
            ⛺ {t("navRooms")}
          </button>
        </div>
      </div>
    );
  }

  const stats: [Key, number][] = data
    ? [
        ["st_online", data.stats.online],
        ["st_msgsDay", data.stats.msgsDay],
        ["st_msgsWeek", data.stats.msgsWeek],
        ["st_people", data.stats.people],
        ["st_newWeek", data.stats.newWeek],
        ["st_rooms", data.stats.rooms],
      ]
    : [];

  return (
    <div className="profile admin">
      <section className="glass card">
        <div className="section-head tight">
          <h1>🛡️ {t("adminTitle")}</h1>
          <button className="btn small" onClick={load}>
            ↻ {t("refresh")}
          </button>
        </div>
        <div className="stat-grid">
          {data
            ? stats.map(([k, n]) => (
                <div key={k} className="stat">
                  <b className="grad">{n}</b>
                  <span>{t(k)}</span>
                </div>
              ))
            : Array.from({ length: 6 }, (_, i) => <div key={i} className="stat skeleton" />)}
        </div>
        {data && data.stats.guests > 0 && (
          <p className="fine">
            + {data.stats.guests} {t("guests")}
          </p>
        )}
      </section>

      <section className="glass card">
        <h2>⚑ {t("adminReported")}</h2>
        {data && data.reported.length === 0 && <p className="muted">{t("adminNoReports")}</p>}
        <ul className="mod-list">
          {data?.reported.map((m) => <MsgItem key={m.id} m={m} act={act} meId={me.id} />)}
        </ul>
      </section>

      <section className="glass card">
        <h2>☁️ {t("adminPeople")}</h2>
        {data && data.people.length === 0 && <p className="muted">{t("adminNoPeople")}</p>}
        <ul className="mod-list">
          {data?.people.map((u) => (
            <li key={u.id} className="mod-item">
              <div className="mod-who">
                <Orb avatar={u.avatar} name={u.name} size={30} />
                <div>
                  <div className="mod-line">
                    <b dir="auto">{u.name}</b>
                    <UserTags u={u} />
                  </div>
                  <div className="fine">
                    {u.msgs} {t("messages")} · {dateTimeOf(u.created, lang)}
                  </div>
                </div>
              </div>
              <div className="msg-actions">
                <UserActions u={u} act={act} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass card">
        <h2>⛺ {t("communityRooms")}</h2>
        {data && data.rooms.length === 0 && <p className="muted">{t("adminNoRooms")}</p>}
        <ul className="mod-list">
          {data?.rooms.map((r) => (
            <li key={r.id} className="mod-item">
              <div className="mod-line">
                <button className="link" onClick={() => go({ name: "room", id: r.id })} dir="auto">
                  {r.title}
                </button>
              </div>
              <div className="fine">
                {r.by && (
                  <>
                    {t("by")} <span dir="auto">{r.by}</span> ·{" "}
                  </>
                )}
                {r.msgs} {t("messages")} · {dateTimeOf(r.last || r.created, lang)}
              </div>
              <div className="msg-actions">
                <SureButton className="mod danger" label={t("deleteRoom")} sure={t("deleteRoomSure")} onGo={() => act({ on: "room", id: r.id, action: "delete" })} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass card">
        <h2>💬 {t("adminLatest")}</h2>
        {data && data.latest.length === 0 && <p className="muted">{t("adminNoMsgs")}</p>}
        <ul className="mod-list">
          {data?.latest.map((m) => <MsgItem key={m.id} m={m} act={act} meId={me.id} />)}
        </ul>
      </section>
    </div>
  );
}
