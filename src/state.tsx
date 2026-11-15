import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Award, Lang, Me } from "../shared/protocol.ts";
import { detectLang, translate, type Key } from "./i18n.ts";
import { api, type Profile } from "./api.ts";
import { findBadge } from "../shared/game.ts";

// ── routing ──────────────────────────────────────────────────────────
export type Route =
  | { name: "home" }
  | { name: "room"; id: string }
  | { name: "read"; book: string; chapter: number }
  | { name: "map"; place?: string }
  | { name: "me" }
  | { name: "about" }
  | { name: "admin" };

export function parseRoute(path: string): Route {
  const p = path.split("/").filter(Boolean).map(decodeURIComponent);
  if (p[0] === "room" && p[1]) return { name: "room", id: p[1] };
  if (p[0] === "read") return { name: "read", book: (p[1] ?? "I_Samuel").replace(/_/g, " "), chapter: Number(p[2]) || 1 };
  if (p[0] === "map") return { name: "map", place: p[1] };
  if (p[0] === "me") return { name: "me" };
  if (p[0] === "about") return { name: "about" };
  if (p[0] === "admin") return { name: "admin" };
  return { name: "home" };
}

export function routePath(r: Route): string {
  switch (r.name) {
    case "room":
      return `/room/${encodeURIComponent(r.id)}`;
    case "read":
      return `/read/${r.book.replace(/ /g, "_")}/${r.chapter}`;
    case "map":
      return r.place ? `/map/${r.place}` : "/map";
    case "me":
      return "/me";
    case "about":
      return "/about";
    case "admin":
      return "/admin";
    default:
      return "/";
  }
}

// ── toasts ───────────────────────────────────────────────────────────
export interface Toast {
  id: number;
  kind: "points" | "badge" | "info" | "warn";
  text: string;
  glyph?: string;
}

// ── context ──────────────────────────────────────────────────────────
interface App {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (k: Key) => string;
  setLang: (l: Lang) => void;
  route: Route;
  go: (r: Route, replace?: boolean) => void;
  token: string | null;
  me: Me | null;
  setSession: (token: string | null, me: Me | null) => void;
  refreshMe: () => Promise<Profile | null>;
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  celebrate: (a: Award | undefined, reason: string) => void;
  joinOpen: boolean;
  askJoin: (then?: () => void) => void;
  closeJoin: (joined: boolean) => void;
}

const Ctx = createContext<App>(null as unknown as App);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);
  const [route, setRoute] = useState<Route>(() => parseRoute(location.pathname));
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("ohel.token"));
  const [me, setMe] = useState<Me | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("ohel.me") ?? "null");
    } catch {
      return null;
    }
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [joinOpen, setJoinOpen] = useState(false);
  const afterJoin = useRef<(() => void) | null>(null);
  const nextId = useRef(1);

  const dir = lang === "he" ? "rtl" : "ltr";
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem("ohel.lang", lang);
  }, [lang, dir]);

  useEffect(() => {
    const onPop = () => setRoute(parseRoute(location.pathname));
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);

  const go = useCallback((r: Route, replace = false) => {
    const path = routePath(r);
    if (path !== location.pathname) {
      if (replace) history.replaceState(null, "", path);
      else history.pushState(null, "", path);
    }
    setRoute(r);
    window.scrollTo({ top: 0 });
  }, []);

  const setSession = useCallback((tok: string | null, m: Me | null) => {
    setToken(tok);
    setMe(m);
    if (tok) localStorage.setItem("ohel.token", tok);
    else localStorage.removeItem("ohel.token");
    if (m) localStorage.setItem("ohel.me", JSON.stringify(m));
    else localStorage.removeItem("ohel.me");
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) return null;
    try {
      const p = await api<Profile>("/api/me", { token });
      setMe(p.me);
      localStorage.setItem("ohel.me", JSON.stringify(p.me));
      return p;
    } catch (e) {
      if ((e as { status?: number }).status === 401) setSession(null, null);
      return null;
    }
  }, [token, setSession]);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = nextId.current++;
    setToasts((ts) => [...ts.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), t.kind === "badge" ? 5200 : 3200);
  }, []);

  const t = useCallback((k: Key) => translate(lang, k), [lang]);

  const celebrate = useCallback(
    (a: Award | undefined, reason: string) => {
      if (!a) return;
      if (a.delta > 0) {
        // Everyday chat points add up quietly; everything else gets a little celebration.
        if (reason !== "text") {
          const why = translate(lang, `pts_${reason}` as Key);
          toast({ kind: "points", text: `+${a.delta} ${why}`.trim(), glyph: "✨" });
        }
        setMe((m) => {
          if (!m) return m;
          const next = { ...m, points: a.total };
          localStorage.setItem("ohel.me", JSON.stringify(next));
          return next;
        });
      }
      for (const id of a.badges) {
        const b = findBadge(id);
        if (b) toast({ kind: "badge", text: `${translate(lang, "newBadge")}: ${b[lang]}`, glyph: b.glyph });
      }
    },
    [lang, toast],
  );

  const askJoin = useCallback((then?: () => void) => {
    afterJoin.current = then ?? null;
    setJoinOpen(true);
  }, []);

  const closeJoin = useCallback((joined: boolean) => {
    setJoinOpen(false);
    const f = afterJoin.current;
    afterJoin.current = null;
    if (joined && f) setTimeout(f, 0);
  }, []);

  const value = useMemo<App>(
    () => ({
      lang, dir, t, setLang: setLangState, route, go, token, me, setSession, refreshMe, toasts, toast, celebrate,
      joinOpen, askJoin, closeJoin,
    }),
    [lang, dir, t, route, go, token, me, setSession, refreshMe, toasts, toast, celebrate, joinOpen, askJoin, closeJoin],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
