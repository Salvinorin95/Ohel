import type { AdminAction, AdminData, AdminUser, Award, Me, RoomInfo } from "../shared/protocol.ts";
import type { Stats } from "../shared/game.ts";

export class ApiError extends Error {
  constructor(public code: string, public status: number, public extra: Record<string, unknown> = {}) {
    super(code);
  }
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown; token?: string | null } = {}): Promise<T> {
  const res = await fetch(path, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
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
export const getText = (ref: string) => api<ChapterText>(`/api/text?ref=${encodeURIComponent(ref)}`);
export const postRead = (token: string, ref: string) => api<{ award: Award }>("/api/read", { token, body: { ref } });
export const postVisit = (token: string, place: string) => api<{ award: Award }>("/api/visit", { token, body: { place } });
export const adminGet = (token: string) => api<AdminData>("/api/admin", { token });
export const adminAct = (token: string, a: AdminAction) => api<{ ok: true; user?: AdminUser }>("/api/admin", { token, body: a });
