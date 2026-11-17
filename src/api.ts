import type { Study } from "../shared/study.ts";
import type { AdminAction, AdminData, AdminUser, Award, DailyPublic, DailyResult, Me, RoomInfo, WeekInfo } from "../shared/protocol.ts";
import type { BadgeStats as Stats } from "../shared/game.ts";

export class ApiError extends Error {
  constructor(public code: string, public status: number, public extra: Record<string, unknown> = {}) {
    super(code);
  }
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown; token?: string | null } = {}): Promise<T> {
  const res = await fetch(path, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    signal: AbortSignal.timeout(12_000),
    headers: {
      ...(opts.body ? { "content-type": "application/json" } : {}),
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(String((data as { error?: string }).error ?? "error"), res.status, data as Record<string, unknown>);
  return data as T;
}

export interface Profile {
  me: Me;
  stats: Stats;
  badges: { badge: string; at: number }[];
  visited: string[];
  read: string[];
}

export interface ChapterText {
  cached?: boolean;
  ref: string;
  heRef: string;
  he: string[];
  en: string[];
  sources: { he: string; en: string; enLicense: string };
}

export const getRooms = () => api<{ rooms: RoomInfo[] }>("/api/rooms");
export const getRoom = (id: string) => api<RoomInfo>(`/api/rooms/${encodeURIComponent(id)}`);
export const getBoard = () =>
  api<{ week: { name: string; avatar: number; points: number }[]; all: { name: string; avatar: number; points: number }[] }>("/api/leaderboard");
export async function getText(ref: string): Promise<ChapterText> {
  const key = "ohel.chapters.v1";
  try {
    const data = await api<ChapterText>(`/api/text?ref=${encodeURIComponent(ref)}`);
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "{}");
      const recent = Object.fromEntries(Object.entries(saved).filter(([k]) => k !== ref).slice(-11));
      localStorage.setItem(key, JSON.stringify({ ...recent, [ref]: data }));
    } catch { /* Public text caching is optional when storage is unavailable. */ }
    return data;
  } catch (error) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "{}")[ref] as ChapterText;
      if (saved?.ref === ref && Array.isArray(saved.he) && Array.isArray(saved.en) && saved.sources) return { ...saved, cached: true };
    } catch { /* Keep the original request error. */ }
    throw error;
  }
}
export const postRead = (token: string, ref: string) => api<{ award: Award }>("/api/read", { token, body: { ref } });
export const postVisit = (token: string, place: string) => api<{ award: Award }>("/api/visit", { token, body: { place } });
export const getWeek = () => api<WeekInfo>("/api/week");
export const getDaily = (token: string | null) => api<DailyPublic & { mine?: DailyResult; run?: number }>("/api/daily", { token });
export const postDaily = (token: string, choice: number) =>
  api<{ mine: DailyResult; run: number; award?: Award; again?: boolean }>("/api/daily", { token, body: { choice } });
export const adminGet = (token: string) => api<AdminData>("/api/admin", { token });
export const adminAct = (token: string, a: AdminAction) => api<{ ok: true; user?: AdminUser }>("/api/admin", { token, body: a });

export const getStudy = (token: string) => api<Study>("/api/study", { token });
export const saveStudy = (token: string, action: "resume" | "bookmark" | "remove", ref: string, note = "") => api<Study>("/api/study", { token, body: { action, ref, note } });
