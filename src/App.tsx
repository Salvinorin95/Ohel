import { Background } from "./components/Background.tsx";
import { JoinSheet } from "./components/JoinSheet.tsx";
import { Logo } from "./components/Logo.tsx";
import { NewRoomSheet } from "./components/NewRoomSheet.tsx";
import { Orb } from "./components/Orb.tsx";
import { Toasts } from "./components/Toasts.tsx";
import { useApp, type Route } from "./state.tsx";
import { Home } from "./views/Home.tsx";
import { Profile } from "./views/Profile.tsx";
import { Reader } from "./views/Reader.tsx";
import { Room } from "./views/Room.tsx";
import { About } from "./views/About.tsx";
import { Admin } from "./views/Admin.tsx";
import { WeekPage } from "./views/WeekPage.tsx";
import { PeoplePage, PersonPage } from "./views/PersonPage.tsx";
import { usePeopleIndex } from "./placeData.ts";
import { parseRef } from "../shared/books.ts";
import { findPlace } from "../shared/places.ts";
import { lazy, Suspense, useEffect, useState } from "react";
const MapView = lazy(() => import("./views/MapView.tsx").then((m) => ({ default: m.MapView })));
import { getRooms } from "./api.ts";
import type { RoomInfo } from "../shared/protocol.ts";

function Nav() {
  const { t, route, go, me, token, askJoin, lang, setLang } = useApp();
  const hasPeople = Object.keys(usePeopleIndex()).length > 0;
  const items: { r: Route; label: string; icon: string; on: boolean }[] = [
    { r: { name: "home" }, label: t("navRooms"), icon: "⛺", on: route.name === "home" || route.name === "room" },
    { r: { name: "read", book: "Genesis", chapter: 1 }, label: t("navRead"), icon: "📖", on: route.name === "read" },
    { r: { name: "map" }, label: t("navMap"), icon: "🛰️", on: route.name === "map" },
    ...(hasPeople ? [{ r: { name: "people" } as Route, label: t("people"), icon: "👥", on: route.name === "people" || route.name === "person" }] : []),
  ];
  const lastRead = () => {
    try {
      const s = JSON.parse(localStorage.getItem("ohel.lastRead") ?? "null");
      if (s?.book && s?.chapter) return { name: "read", book: s.book, chapter: s.chapter } as Route;
    } catch {
      /* ignore */
    }
    return { name: "read", book: "Genesis", chapter: 1 } as Route;
  };
  return (
    <>
      <header className="topbar glass">
        <button className="brand-btn" onClick={() => go({ name: "home" })}>
          <Logo size={30} />
          <span className="grad">{lang === "he" ? "אוהל" : "Ohel"}</span>
        </button>
        <nav className="topnav">
          {items.map((i) => (
            <button key={i.label} className={i.on ? "on" : ""} onClick={() => go(i.r.name === "read" ? lastRead() : i.r)}>
              <span>{i.icon}</span> {i.label}
            </button>
          ))}
        </nav>
        <div className="topbar-end">
          <button className="lang-btn" onClick={() => setLang(lang === "he" ? "en" : "he")}>
            {t("language")}
          </button>
          {token && me ? (
            <button className={route.name === "me" ? "me-btn on" : "me-btn"} onClick={() => go({ name: "me" })}>
              <span className="me-pts">✨ {me.points}</span>
              <Orb avatar={me.avatar} name={me.name} size={30} />
            </button>
          ) : (
            <button className="btn btn-glow small" onClick={() => askJoin()}>
              {t("joinTitle")}
            </button>
          )}
        </div>
      </header>
      <nav className="bottomnav glass">
        {items.map((i) => (
          <button key={i.label} className={i.on ? "on" : ""} onClick={() => go(i.r.name === "read" ? lastRead() : i.r)}>
            <span className="bn-icon">{i.icon}</span>
            <span>{i.label}</span>
          </button>
        ))}
        <button className={route.name === "me" ? "on" : ""} onClick={() => go({ name: "me" })}>
          <span className="bn-icon">{me ? <Orb avatar={me.avatar} name={me.name} size={22} /> : "🙂"}</span>
          <span>{t("navMe")}</span>
        </button>
      </nav>
    </>
  );
}

function ReadPage({ book, chapter }: { book: string; chapter: number }) {
  const { go, t } = useApp();
  const ref = parseRef(`${book} ${chapter}`);
  useEffect(() => {
    if (ref) localStorage.setItem("ohel.lastRead", JSON.stringify({ book: ref.book, chapter: ref.chapter }));
    document.title = `${book} ${chapter} · ${t("navRead")} · Ohel`;
  }, [book, chapter, ref, t]);
  return (
    <div className="page-read">
      <Reader
        book={ref?.book ?? "Genesis"}
        chapter={ref?.chapter ?? 1}
        onNavigate={(b, c) => go({ name: "read", book: b, chapter: c })}
        onOpenPlace={(p) => go({ name: "map", place: p })}
      />
    </div>
  );
}

function MapPage({ place, open, journey }: { place?: string; open?: boolean; journey?: string }) {
  const { go, t, token, askJoin, lang } = useApp();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [newFor, setNewFor] = useState<string | null>(null);
  useEffect(() => {
    getRooms().then((r) => setRooms(r.rooms)).catch(() => {});
  }, []);
  return (
    <div className="page-map">
      <Suspense fallback={<div className="loading-shimmer">{t("loading")}</div>}>
      <MapView
        place={place}
        openPage={open}
        onSelect={(id) => history.replaceState(null, "", id ? `/map/${id}` : "/map")}
        onPage={(id) => id && history.replaceState(null, "", `/place/${id}`)}
        journey={journey}
        onJourney={(id) => history.replaceState(null, "", id ? `/journey/${id}` : "/map")}
        onOpenRef={(r) => {
          const p = parseRef(r);
          if (p) go({ name: "read", book: p.book, chapter: p.chapter });
        }}
        onTalk={(id) => {
          const room = rooms.find((r) => r.place === id && r.starter) ?? rooms.find((r) => r.place === id);
          if (room) return go({ name: "room", id: room.id });
          if (token) setNewFor(id);
          else askJoin(() => setNewFor(id));
        }}
      />
      </Suspense>
      {newFor && <NewRoomSheet place={newFor} title={findPlace(newFor)?.[lang] ?? ""} onClose={() => setNewFor(null)} />}
    </div>
  );
}

export function App() {
  const { route, joinOpen } = useApp();
  const full = route.name === "room" || route.name === "map";
  return (
    <>
      <Background />
      <div className={full ? "shell full" : "shell"}>
        <Nav />
        <main className={`main main-${route.name}`}>
          {route.name === "home" && <Home />}
          {route.name === "room" && <Room key={route.id} id={route.id} />}
          {route.name === "read" && <ReadPage book={route.book} chapter={route.chapter} />}
          {route.name === "map" && <MapPage place={route.place} open={route.open} journey={route.journey} />}
          {route.name === "me" && <Profile />}
          {route.name === "about" && <About />}
          {route.name === "week" && <WeekPage />}
          {route.name === "people" && <PeoplePage />}
          {route.name === "person" && <PersonPage key={route.id} id={route.id} />}
          {route.name === "admin" && <Admin />}
        </main>
      </div>
      <Toasts />
      {joinOpen && <JoinSheet />}
    </>
  );
}
