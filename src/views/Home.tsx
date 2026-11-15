import { useEffect, useState } from "react";
import { refLabel } from "../../shared/books.ts";
import { findPlace } from "../../shared/places.ts";
import type { RoomInfo } from "../../shared/protocol.ts";
import { getBoard, getRooms } from "../api.ts";
import { DailyCard } from "../components/DailyCard.tsx";
import { Logo } from "../components/Logo.tsx";
import { WeekCard } from "../components/WeekCard.tsx";
import { NewRoomSheet } from "../components/NewRoomSheet.tsx";
import { Orb } from "../components/Orb.tsx";
import { useApp } from "../state.tsx";

type Board = Awaited<ReturnType<typeof getBoard>>;

function RoomCard({ r }: { r: RoomInfo }) {
  const { lang, t, go } = useApp();
  const title = (lang === "he" ? r.title_he : r.title_en) || r.title;
  const place = findPlace(r.place);
  return (
    <button className="room-card glass" onClick={() => go({ name: "room", id: r.id })}>
      <span className="room-card-title" dir="auto">{title}</span>
      <span className="room-card-tags">
        {r.ref && <span className="tag">📖 {refLabel(r.ref, lang)}</span>}
        {place && <span className="tag">📍 {place[lang]}</span>}
      </span>
      <span className="room-card-foot">
        {r.online > 0 ? (
          <span className="live">
            <span className="live-dot" /> {r.online} {t("online")}
          </span>
        ) : (
          <span className="muted small">
            {r.msgs} {t("messages")}
          </span>
        )}
        <span className="enter-arrow">{lang === "he" ? "←" : "→"}</span>
      </span>
    </button>
  );
}

export function Home() {
  const { t, lang, go, token, askJoin } = useApp();
  const [rooms, setRooms] = useState<RoomInfo[] | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [boardTab, setBoardTab] = useState<"week" | "all">("week");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    document.title = "Ohel · אוהל";
    let live = true;
    const load = () => {
      getRooms().then((r) => live && setRooms(r.rooms)).catch(() => {});
      getBoard().then((b) => live && setBoard(b)).catch(() => {});
    };
    load();
    const i = setInterval(load, 20_000);
    return () => {
      live = false;
      clearInterval(i);
    };
  }, []);

  const starters = rooms?.filter((r) => r.starter) ?? [];
  const community = rooms?.filter((r) => !r.starter) ?? [];
  const lights = board ? board[boardTab] : [];

  return (
    <div className="home">
      <section className="hero">
        <Logo size={92} animate />
        <h1 className="brand">
          <span className="grad">{lang === "he" ? "אוהל" : "Ohel"}</span>
          <span className="brand-alt">{lang === "he" ? "Ohel" : "אוהל"}</span>
        </h1>
        <p className="tagline">{t("tagline")}</p>
        <p className="tent-line">{t("tentLine")}</p>
        <div className="hero-actions">
          <button className="btn btn-glow big" onClick={() => document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth" })}>
            💬 {t("enterRoom")}
          </button>
          <button className="btn big glass" onClick={() => go({ name: "read", book: "I Samuel", chapter: 31 })}>
            📖 {t("openBook")}
          </button>
          <button className="btn big glass" onClick={() => go({ name: "map", place: "gilboa" })}>
            🛰️ {t("openMap")}
          </button>
        </div>
      </section>

      <div className="today">
        <WeekCard />
        <DailyCard />
      </div>

      <section id="rooms" className="rooms">
        <div className="section-head">
          <h2>{t("roomsOpen")}</h2>
        </div>
        <div className="room-grid">
          {rooms === null && Array.from({ length: 6 }, (_, i) => <div key={i} className="room-card glass skeleton" />)}
          {starters.map((r) => (
            <RoomCard key={r.id} r={r} />
          ))}
          <button className="room-card glass new-room" onClick={() => (token ? setCreating(true) : askJoin(() => setCreating(true)))}>
            <span className="plus">+</span>
            <span className="room-card-title">{t("newRoom")}</span>
            <span className="muted small">{t("newRoomHint")}</span>
          </button>
        </div>
        {community.length > 0 && (
          <>
            <div className="section-head">
              <h2>{t("communityRooms")}</h2>
            </div>
            <div className="room-grid">
              {community.map((r) => (
                <RoomCard key={r.id} r={r} />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="lights glass">
        <div className="section-head">
          <h2>✨ {t("weekLights")}</h2>
          <div className="seg">
            <button className={boardTab === "week" ? "on" : ""} onClick={() => setBoardTab("week")}>
              {t("thisWeek")}
            </button>
            <button className={boardTab === "all" ? "on" : ""} onClick={() => setBoardTab("all")}>
              {t("allTime")}
            </button>
          </div>
        </div>
        {lights.length === 0 ? (
          <p className="muted">{t("noOneYet")}</p>
        ) : (
          <ol className="board">
            {lights.map((p, i) => (
              <li key={i}>
                <span className="rank">{i + 1}</span>
                <Orb avatar={p.avatar} name={p.name} size={28} />
                <span className="board-name" dir="auto">{p.name}</span>
                <span className="board-pts">{p.points}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="kindness">
        🌱 {t("kindness")}{" "}
        <button className="link" onClick={() => go({ name: "about" })}>
          {t("rulesLink")}
        </button>
      </p>

      {creating && <NewRoomSheet onClose={() => setCreating(false)} />}
    </div>
  );
}
