import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { parseRef, refLabel } from "../../shared/books.ts";
import { findPlace } from "../../shared/places.ts";
import type { AdminAction, ClientMsg, MapView as View, Me, Msg, Person, RoomInfo, ServerMsg } from "../../shared/protocol.ts";
import { Orb } from "../components/Orb.tsx";
import { timeOf, type Key } from "../i18n.ts";
import { useApp } from "../state.tsx";
import { adminAct, getRoom } from "../api.ts";
const MapView = lazy(() => import("./MapView.tsx").then((m) => ({ default: m.MapView })));
import { Reader } from "./Reader.tsx";

type Tab = "chat" | "text" | "map";
type Status = "connecting" | "open" | "closed";

interface RoomState {
  room: RoomInfo | null;
  msgs: Msg[];
  online: Person[];
  guests: number;
  status: Status;
  answers: Record<number, { choice: number; correct: boolean }>;
  staff: string[];
}

function useRoom(
  id: string,
  token: string | null,
  onError: (m: Extract<ServerMsg, { t: "error" }>) => void,
  onPoints: (m: Extract<ServerMsg, { t: "points" }>) => void,
  onMe: (me: Me | null) => void,
  onGone: () => void,
) {
  const [s, setS] = useState<RoomState>({ room: null, msgs: [], online: [], guests: 0, status: "connecting", answers: {}, staff: [] });
  const wsRef = useRef<WebSocket | null>(null);
  const handlers = useRef({ onError, onPoints, onMe, onGone });
  handlers.current = { onError, onPoints, onMe, onGone };

  useEffect(() => {
    if (!id) return;
    let closed = false;
    let retry = 0;
    let ping: ReturnType<typeof setInterval> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setS((x) => ({ ...x, status: "connecting" }));

    const connect = () => {
      const ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/rooms/${encodeURIComponent(id)}/ws`);
      wsRef.current = ws;
      ws.onopen = () => {
        retry = 0;
        ws.send(JSON.stringify({ t: "hello", token: token ?? undefined } satisfies ClientMsg));
        ping = setInterval(() => ws.readyState === WebSocket.OPEN && ws.send('{"t":"ping"}'), 25_000);
      };
      ws.onmessage = (e) => {
        const m = JSON.parse(e.data) as ServerMsg;
        switch (m.t) {
          case "welcome":
            setS((x) => ({ ...x, room: m.room, msgs: m.history, online: m.online, guests: m.guests, status: "open", staff: m.staff ?? [] }));
            handlers.current.onMe(m.me);
            break;
          case "msg":
            setS((x) => (x.msgs.some((y) => y.id === m.msg.id) ? x : { ...x, msgs: [...x.msgs, m.msg].slice(-300) }));
            break;
          case "update":
            setS((x) => ({
              ...x,
              msgs: x.msgs.map((y) =>
                y.id !== m.id
                  ? y
                  : m.msg
                  ? { ...m.msg, lit: y.lit }
                  : {
                      ...y,
                      ...(m.lights !== undefined ? { lights: m.lights } : {}),
                      ...(m.helpful !== undefined ? { helpful: m.helpful } : {}),
                      ...(m.hidden ? { hidden: true, body: "", ref: null, place: null, view: null, quiz: null } : {}),
                      ...(m.quiz ? { quiz: m.quiz } : {}),
                    },
              ),
            }));
            break;
          case "presence":
            setS((x) => ({ ...x, online: m.online, guests: m.guests }));
            break;
          case "quizResult":
            setS((x) => ({ ...x, answers: { ...x.answers, [m.id]: { choice: m.choice, correct: m.correct } } }));
            break;
          case "error":
            handlers.current.onError(m);
            break;
          case "points":
            handlers.current.onPoints(m);
            break;
        }
      };
      ws.onclose = (e) => {
        clearInterval(ping);
        if (closed) return;
        if (e.code === 4004) {
          setS((x) => ({ ...x, status: "closed" }));
          return handlers.current.onGone();
        }
        setS((x) => ({ ...x, status: "closed" }));
        timer = setTimeout(connect, Math.min(10_000, 600 * 2 ** retry++));
      };
    };
    connect();
    return () => {
      closed = true;
      clearInterval(ping);
      clearTimeout(timer);
      wsRef.current?.close();
    };
  }, [id, token]);

  const send = useCallback((m: ClientMsg) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(m));
      return true;
    }
    return false;
  }, []);

  return { ...s, send };
}

// ── pieces ─────────────────────────────────────────────────────────────
function Timer({ ends }: { ends: number }) {
  const [left, setLeft] = useState(() => Math.max(0, ends - Date.now()));
  useEffect(() => {
    const i = setInterval(() => setLeft(Math.max(0, ends - Date.now())), 250);
    return () => clearInterval(i);
  }, [ends]);
  return (
    <div className="quiz-timer" aria-hidden="true">
      <div className="quiz-timer-fill" style={{ width: `${Math.min(100, (left / 25_000) * 100)}%` }} />
    </div>
  );
}

function QuizCard({ m, mine, onAnswer, onOpenRef }: { m: Msg; mine?: { choice: number; correct: boolean }; onAnswer: (c: number) => void; onOpenRef: (r: string) => void }) {
  const { t, lang } = useApp();
  const q = m.quiz!;
  const side = q[lang];
  const done = q.done;
  return (
    <div className={done ? "quiz glass done" : "quiz glass"}>
      <div className="quiz-head">
        <span className="quiz-title">⚡ {t("quizTitle")}</span>
        <span className="muted small">
          {t("quizBy")} {m.name || t("someoneLeft")}
        </span>
      </div>
      <p className="quiz-q" dir="auto">{side.q}</p>
      {!done && <Timer ends={q.ends} />}
      <div className="quiz-options">
        {side.options.map((o, i) => {
          const cls = ["quiz-opt"];
          if (mine?.choice === i) cls.push(mine.correct ? "right" : "wrong");
          if (done && q.answer === i) cls.push("answer");
          return (
            <button key={i} className={cls.join(" ")} disabled={done || !!mine} onClick={() => onAnswer(i)} dir="auto">
              <span className="opt-letter">{lang === "he" ? "אבגד"[i] : "ABCD"[i]}</span>
              {o}
            </button>
          );
        })}
      </div>
      {mine && !done && <p className={mine.correct ? "quiz-verdict right" : "quiz-verdict wrong"}>{mine.correct ? `✨ ${t("quizRight")}` : t("quizWrong")}</p>}
      <div className="quiz-solvers">
        {q.solvers.slice(0, 8).map((s, i) => (
          <Orb key={i} avatar={s.avatar} name={s.name} size={22} />
        ))}
        <span className="muted small">
          {q.solvers.length} {t("quizSolved")}
          {done ? ` · ${t("quizEnded")}` : ""}
        </span>
      </div>
      {done && side.explain && (
        <div className="quiz-explain">
          <p dir="auto">{side.explain}</p>
          <button className="chip chip-ref" onClick={() => onOpenRef(q.ref)}>
            📖 {refLabel(q.ref, lang)}
          </button>
        </div>
      )}
    </div>
  );
}

interface ItemProps {
  m: Msg;
  compact: boolean;
  mineId: string | null;
  parent?: Msg;
  parentIsMyQuestion: boolean;
  hiddenForMe: boolean;
  staff: boolean; // the writer looks after the tent
  admin: boolean; // I look after the tent
  answer?: { choice: number; correct: boolean };
  onReply: () => void;
  onLight: () => void;
  onHelpful: () => void;
  onReport: () => void;
  onUnsend: () => void;
  onAnswer: (c: number) => void;
  onOpenRef: (r: string) => void;
  onOpenPlace: (p: string) => void;
  onOpenView: (v: View) => void;
  onJump: (id: number) => void;
  onMod: (a: AdminAction) => void;
}

function Item(p: ItemProps) {
  const { t, lang, go } = useApp();
  const { m } = p;
  const [menu, setMenu] = useState(false);
  const [sureBan, setSureBan] = useState(false);
  const own = !!p.mineId && m.uid === p.mineId;
  const name = m.name || t("someoneLeft");

  if (m.kind === "quiz" && m.quiz) {
    return (
      <div className="msg-row quiz-row" id={`m-${m.id}`}>
        <QuizCard m={m} mine={p.answer} onAnswer={p.onAnswer} onOpenRef={p.onOpenRef} />
        {p.admin && (
          <div className="mod-mini-row">
            <button className="mod-mini" onClick={() => p.onMod({ on: "msg", id: m.id, action: "hide" })}>
              🛡️ {t("modHide")}
            </button>
          </div>
        )}
      </div>
    );
  }

  const hidden = m.hidden || p.hiddenForMe;
  const place = findPlace(m.place);
  return (
    <div className={`msg-row${own ? " own" : ""}${p.compact ? " compact" : ""}`} id={`m-${m.id}`}>
      {!own && (
        <div className="msg-orb">
          {!p.compact &&
            (m.uid ? (
              <button className="orb-btn" onClick={() => go({ name: "user", id: m.uid! })} aria-label={name}>
                <Orb avatar={m.avatar} name={name} size={34} photo={m.photo} />
              </button>
            ) : (
              <Orb avatar={m.avatar} name={name} size={34} photo={m.photo} />
            ))}
        </div>
      )}
      <div
        className={`bubble${m.kind === "question" ? " question" : ""}${m.helpful ? " helpful" : ""}${hidden ? " hidden" : ""}`}
        onClick={() => (setMenu(!menu), setSureBan(false))}
      >
        {!p.compact && !own && (
          <div className="msg-meta">
            <span className="msg-name">{name}</span>
            {p.staff && <span className="pill pill-team">{t("team")}</span>}
            <span className="msg-time">{timeOf(m.at, lang)}</span>
          </div>
        )}
        {m.kind === "question" && !hidden && <span className="pill pill-q">❓ {t("question")}</span>}
        {p.parent && !hidden && (
          <button className="reply-quote" onClick={(e) => (e.stopPropagation(), p.onJump(p.parent!.id))}>
            <span className="msg-name">{p.parent.name || t("someoneLeft")}</span>
            <span className="reply-snippet" dir="auto">
              {p.parent.hidden ? t("removed") : p.parent.body.slice(0, 90)}
            </span>
          </button>
        )}
        {hidden ? (
          <p className="msg-body removed">{p.hiddenForMe && !m.hidden ? t("reported") : t("removed")}</p>
        ) : (
          <p className="msg-body" dir="auto">
            {m.body}
          </p>
        )}
        {!hidden && (m.ref || place || m.view) && (
          <div className="msg-attach">
            {m.ref && (
              <button className="chip chip-ref" onClick={(e) => (e.stopPropagation(), p.onOpenRef(m.ref!))}>
                📖 {refLabel(m.ref, lang)}
              </button>
            )}
            {place && (
              <button className="chip chip-place" onClick={(e) => (e.stopPropagation(), p.onOpenPlace(place.id))}>
                📍 {place[lang]}
              </button>
            )}
            {m.view && (
              <button className="chip chip-view" onClick={(e) => (e.stopPropagation(), p.onOpenView(m.view!))}>
                🛰️ {t("sharedView")}
              </button>
            )}
          </div>
        )}
        {!hidden && (
          <div className="msg-foot">
            {m.helpful && <span className="pill pill-helpful">🔦 {t("helpful")}</span>}
            {(m.lights > 0 || menu) && (
              <button className={m.lit ? "light on" : "light"} disabled={own || m.lit} onClick={(e) => (e.stopPropagation(), p.onLight())} title={t("light")}>
                ✨ {m.lights > 0 ? m.lights : ""}
              </button>
            )}
            {own && p.compact ? null : own && <span className="msg-time">{timeOf(m.at, lang)}</span>}
          </div>
        )}
        {menu && hidden && p.admin && m.hidden && (
          <div className="msg-actions" onClick={(e) => e.stopPropagation()}>
            <button className="mod" onClick={() => (p.onMod({ on: "msg", id: m.id, action: "restore" }), setMenu(false))}>
              🛡️ {t("modRestore")}
            </button>
          </div>
        )}
        {menu && !hidden && (
          <div className="msg-actions" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => (p.onReply(), setMenu(false))}>↩ {m.kind === "question" ? t("answer") : t("reply")}</button>
            {p.parentIsMyQuestion && !own && !m.helpful && (
              <button className="glow" onClick={() => (p.onHelpful(), setMenu(false))}>
                🔦 {t("markHelpful")}
              </button>
            )}
            {own ? (
              <button onClick={() => (p.onUnsend(), setMenu(false))}>{t("unsend")}</button>
            ) : (
              <button className="danger" onClick={() => (p.onReport(), setMenu(false))}>
                ⚑ {t("report")}
              </button>
            )}
            {p.admin && !own && (
              <>
                <button className="mod" onClick={() => (p.onMod({ on: "msg", id: m.id, action: "hide" }), setMenu(false))}>
                  🛡️ {t("modHide")}
                </button>
                {m.uid && !p.staff && (
                  <>
                    <button className="mod" onClick={() => (p.onMod({ on: "user", id: m.uid!, action: "mute_hour" }), setMenu(false))}>
                      🛡️ {t("modMuteHour")}
                    </button>
                    <button className="mod" onClick={() => (p.onMod({ on: "user", id: m.uid!, action: "mute_day" }), setMenu(false))}>
                      🛡️ {t("modMuteDay")}
                    </button>
                    <button
                      className={sureBan ? "mod danger on" : "mod danger"}
                      onClick={() => {
                        if (!sureBan) return setSureBan(true);
                        p.onMod({ on: "user", id: m.uid!, action: "ban" });
                        setSureBan(false);
                        setMenu(false);
                      }}
                    >
                      🛡️ {sureBan ? t("modBanSure") : t("modBan")}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {m.kind === "question" && !hidden && !own && (
        <button className="answer-btn" onClick={p.onReply}>
          ↩ {t("answer")}
        </button>
      )}
    </div>
  );
}

// ── the room ───────────────────────────────────────────────────────────
export function Room({ id }: { id: string }) {
  const { t, lang, token, me, go, toast, askJoin, celebrate, setSession } = useApp();
  const [tab, setTab] = useState<Tab>("chat");
  const [study, setStudy] = useState<"text" | "map">("text");
  const [loc, setLoc] = useState<{ book: string; chapter: number; highlight?: number } | null>(null);
  const [mapPlace, setMapPlace] = useState<string | undefined>();
  const [mapView, setMapView] = useState<(View & { nonce: number }) | undefined>();
  const [text, setText] = useState("");
  const [asQuestion, setAsQuestion] = useState(false);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [attach, setAttach] = useState<{ ref?: string; place?: string; view?: View }>({});
  const [hiddenForMe, setHiddenForMe] = useState<Set<number>>(new Set());
  const [atBottom, setAtBottom] = useState(true);
  const pending = useRef(new Map<string, { body: string; attach: typeof attach; asQuestion: boolean }>());
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const onError = useCallback(
    (e: Extract<ServerMsg, { t: "error" }>) => {
      const back = e.nonce ? pending.current.get(e.nonce) : undefined;
      if (back) {
        setText(back.body);
        setAttach(back.attach);
        setAsQuestion(back.asQuestion);
        pending.current.delete(e.nonce!);
      }
      if (e.code === "muted" && e.until) toast({ kind: "warn", text: `${t("err_muted")} ${timeOf(e.until, lang)}`, glyph: "☁️" });
      else if (e.code === "blocked") toast({ kind: "warn", text: t("err_blocked"), glyph: "🌱" });
      else if (e.code === "quiz_busy") toast({ kind: "info", text: t("quizBusy") });
      else if (e.code === "auth") askJoin();
      else if (e.code === "not_found") return;
      else if (["banned", "rate", "too_long"].includes(e.code)) toast({ kind: "warn", text: t(`err_${e.code}` as Key) });
      if (e.code === "banned") setSession(null, null);
    },
    [t, lang, toast, askJoin, setSession],
  );
  const onPoints = useCallback((m: Extract<ServerMsg, { t: "points" }>) => celebrate(m, m.reason), [celebrate]);
  const onMe = useCallback(() => {}, []);
  const [missing, setMissing] = useState(false);
  const onGone = useCallback(() => setMissing(true), []);
  const [mapUsed, setMapUsed] = useState(false);
  useEffect(() => {
    if (study === "map") setMapUsed(true);
  }, [study]);
  useEffect(() => {
    getRoom(id).catch((e) => e?.status === 404 && setMissing(true));
  }, [id]);
  const r = useRoom(missing ? "" : id, token, onError, onPoints, onMe, onGone);
  const staff = useMemo(() => new Set(r.staff), [r.staff]);
  const mod = (a: AdminAction) => {
    if (!token) return;
    adminAct(token, a)
      .then(() => toast({ kind: "info", text: t("modDone"), glyph: "🛡️" }))
      .catch(() => toast({ kind: "warn", text: t("modErr") }));
  };
  const room = r.room;

  // Point the study pane at the room's chapter and place once we know them.
  useEffect(() => {
    if (!room) return;
    const ref = parseRef(room.ref);
    setLoc((l) => l ?? (ref ? { book: ref.book, chapter: ref.chapter } : { book: "Genesis", chapter: 1 }));
    if (room.place) setMapPlace((p) => p ?? room.place!);
    if (!room.ref && room.place) setStudy("map");
  }, [room]);

  const title = room ? (lang === "he" ? room.title_he : room.title_en) || room.title : "";
  useEffect(() => {
    document.title = title ? `${title} · Ohel` : "Ohel · אוהל";
  }, [title]);

  // Keep the newest message in view unless the reader scrolled up.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && atBottom) el.scrollTop = el.scrollHeight;
  }, [r.msgs, atBottom, tab]);
  const onScroll = () => {
    const el = listRef.current!;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };

  const byId = useMemo(() => new Map(r.msgs.map((m) => [m.id, m])), [r.msgs]);

  const openRef = (ref: string) => {
    const p = parseRef(ref);
    if (!p) return;
    setLoc({ book: p.book, chapter: p.chapter, highlight: p.verse });
    setStudy("text");
    setTab("text");
  };
  const openPlace = (pid: string) => {
    setMapPlace(undefined);
    setTimeout(() => setMapPlace(pid), 0);
    setStudy("map");
    setTab("map");
  };
  const openView = (v: View) => {
    setMapView({ ...v, nonce: Date.now() });
    setStudy("map");
    setTab("map");
  };
  const toChat = () => {
    setTab("chat");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const send = () => {
    if (!token) return askJoin();
    const body = text.trim();
    if (!body && !attach.ref && !attach.place && !attach.view) return;
    const nonce = Math.random().toString(36).slice(2);
    const finalBody = body || (attach.view ? t("sharedView") : attach.ref ? refLabel(attach.ref, lang) : findPlace(attach.place)?.[lang] ?? "");
    const ok = r.send({ t: "say", body: finalBody, kind: asQuestion ? "question" : "text", ...attach, replyTo: replyTo?.id, nonce });
    if (!ok) return toast({ kind: "warn", text: t("reconnecting") });
    pending.current.set(nonce, { body, attach, asQuestion });
    setTimeout(() => pending.current.delete(nonce), 15_000);
    setText("");
    setAttach({});
    setAsQuestion(false);
    setReplyTo(null);
    setAtBottom(true);
  };

  const myQuestionIds = useMemo(() => new Set(r.msgs.filter((m) => m.kind === "question" && me && m.uid === me.id).map((m) => m.id)), [r.msgs, me]);

  const enterSends = useMemo(() => matchMedia("(pointer: fine)").matches, []);

  const people = r.online;
  const chatPane = (
    <section className={tab === "chat" ? "chat-pane active" : "chat-pane"}>
      <div className="msgs" ref={listRef} onScroll={onScroll}>
        {r.status !== "open" && <div className="conn">{t("reconnecting")}</div>}
        {r.status === "open" && r.msgs.length === 0 && (
          <div className="empty">
            <p>{t("emptyRoom")}</p>
          </div>
        )}
        {r.msgs.map((m, i) => {
          const prev = r.msgs[i - 1];
          const compact =
            !!prev && prev.uid === m.uid && prev.kind !== "quiz" && m.kind === "text" && !m.replyTo && m.at - prev.at < 5 * 60_000;
          const parent = m.replyTo ? byId.get(m.replyTo) : undefined;
          return (
            <Item
              key={m.id}
              m={m}
              compact={compact}
              mineId={me?.id ?? null}
              parent={parent}
              parentIsMyQuestion={!!parent && myQuestionIds.has(parent.id)}
              hiddenForMe={hiddenForMe.has(m.id)}
              staff={!!m.uid && staff.has(m.uid)}
              admin={!!me?.admin}
              onMod={mod}
              answer={r.answers[m.id]}
              onReply={() => {
                if (!token) return askJoin();
                setReplyTo(m);
                inputRef.current?.focus();
              }}
              onLight={() => {
                if (!token) return askJoin();
                r.send({ t: "light", id: m.id });
              }}
              onHelpful={() => r.send({ t: "helpful", id: m.id })}
              onReport={() => {
                if (!token) return askJoin();
                r.send({ t: "report", id: m.id });
                setHiddenForMe((s) => new Set(s).add(m.id));
              }}
              onUnsend={() => r.send({ t: "unsend", id: m.id })}
              onAnswer={(c) => {
                if (!token) return askJoin();
                r.send({ t: "answer", id: m.id, choice: c });
              }}
              onOpenRef={openRef}
              onOpenPlace={openPlace}
              onOpenView={openView}
              onJump={(jid) => document.getElementById(`m-${jid}`)?.scrollIntoView({ block: "center", behavior: "smooth" })}
            />
          );
        })}
      </div>
      {!atBottom && (
        <button className="to-bottom" onClick={() => setAtBottom(true)}>
          ↓
        </button>
      )}

      {token ? (
        <form
          className="composer glass"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          {(replyTo || attach.ref || attach.place || attach.view) && (
            <div className="composer-attach">
              {replyTo && (
                <span className="chip">
                  ↩ {t("replyingTo")} {replyTo.name}
                  <button type="button" onClick={() => setReplyTo(null)} aria-label={t("cancel")}>×</button>
                </span>
              )}
              {attach.ref && (
                <span className="chip chip-ref">
                  📖 {refLabel(attach.ref, lang)}
                  <button type="button" onClick={() => setAttach((a) => ({ ...a, ref: undefined }))} aria-label={t("cancel")}>×</button>
                </span>
              )}
              {attach.place && (
                <span className="chip chip-place">
                  📍 {findPlace(attach.place)?.[lang]}
                  <button type="button" onClick={() => setAttach((a) => ({ ...a, place: undefined }))} aria-label={t("cancel")}>×</button>
                </span>
              )}
              {attach.view && (
                <span className="chip chip-view">
                  🛰️ {t("attachView")}
                  <button type="button" onClick={() => setAttach((a) => ({ ...a, view: undefined }))} aria-label={t("cancel")}>×</button>
                </span>
              )}
            </div>
          )}
          <div className="composer-row">
            <button type="button" className={asQuestion ? "q-toggle on" : "q-toggle"} onClick={() => setAsQuestion(!asQuestion)} title={t("asQuestion")}>
              ❓
            </button>
            <textarea
              ref={inputRef}
              value={text}
              rows={1}
              maxLength={800}
              dir="auto"
              placeholder={asQuestion ? t("ask") : t("say")}
              onChange={(e) => {
                setText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(140, e.target.scrollHeight)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && enterSends && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button className="send" disabled={!text.trim() && !attach.ref && !attach.place && !attach.view} aria-label={t("send")}>
              <svg viewBox="0 0 24 24" width="20" height="20" style={{ transform: lang === "he" ? "scaleX(-1)" : undefined }}>
                <path d="M3 11.5 20 4l-6.5 17-3-7.5z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </form>
      ) : (
        <div className="composer glass guest">
          <button className="btn btn-glow big" onClick={() => askJoin()}>
            {t("joinToTalk")}
          </button>
        </div>
      )}
    </section>
  );

  if (missing) {
    return (
      <div className="profile">
        <div className="glass card center">
          <p>{t("roomGone")}</p>
          <button className="btn btn-glow" onClick={() => go({ name: "home" })}>
            ⛺ {t("navRooms")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="room">
      <header className="room-head glass">
        <button className="icon-btn" onClick={() => go({ name: "home" })} aria-label={t("back")}>
          {lang === "he" ? "→" : "←"}
        </button>
        <div className="room-title">
          <h1 dir="auto">{title || "…"}</h1>
          <div className="room-sub">
            {room?.ref && (
              <button className="chip chip-ref tiny" onClick={() => openRef(room.ref!)}>
                📖 {refLabel(room.ref, lang)}
              </button>
            )}
            {room?.place && (
              <button className="chip chip-place tiny" onClick={() => openPlace(room.place!)}>
                📍 {findPlace(room.place)?.[lang]}
              </button>
            )}
          </div>
        </div>
        <div className="people" title={people.map((p) => p.name).join(", ")}>
          <div className="people-orbs">
            {people.slice(0, 4).map((p) => (
              <button key={p.uid} className="orb-btn" onClick={() => go({ name: "user", id: p.uid })} aria-label={p.name}>
                <Orb avatar={p.avatar} name={p.name} size={26} photo={p.photo} />
              </button>
            ))}
          </div>
          <span className="people-count">
            <span className="live-dot" />
            {people.length + r.guests}
          </span>
        </div>
        <button
          className="btn btn-glow small quiz-btn"
          onClick={() => (token ? r.send({ t: "quiz" }) : askJoin())}
          disabled={r.status !== "open"}
        >
          ⚡ {t("quizStart")}
        </button>
      </header>

      <nav className="room-tabs glass" role="tablist">
        {(["chat", "text", "map"] as Tab[]).map((x) => (
          <button key={x} role="tab" aria-selected={tab === x} className={tab === x ? "on" : ""} onClick={() => (x === "chat" ? toChat() : (setTab(x), setStudy(x)))}>
            {x === "chat" ? `💬 ${t("chat")}` : x === "text" ? `📖 ${t("text")}` : `🛰️ ${t("map")}`}
          </button>
        ))}
      </nav>

      <div className="room-body">
        {chatPane}
        <section className={tab !== "chat" ? "study-pane active" : "study-pane"}>
          <div className="study-tabs seg glass">
            <button className={study === "text" ? "on" : ""} onClick={() => (setStudy("text"), setTab("text"))}>
              📖 {t("text")}
            </button>
            <button className={study === "map" ? "on" : ""} onClick={() => (setStudy("map"), setTab("map"))}>
              🛰️ {t("map")}
            </button>
          </div>
          <div className={study === "text" ? "study-slot on" : "study-slot"}>
            {loc && (
              <Reader
                embedded
                book={loc.book}
                chapter={loc.chapter}
                highlight={loc.highlight}
                onNavigate={(b, c) => setLoc({ book: b, chapter: c })}
                onShareVerse={(ref) => {
                  if (!token) return askJoin();
                  setAttach((a) => ({ ...a, ref }));
                  toChat();
                }}
                onOpenPlace={openPlace}
              />
            )}
          </div>
          <div className={study === "map" ? "study-slot on" : "study-slot"}>
            {mapUsed && (
            <Suspense fallback={<div className="loading-shimmer">{t("loading")}</div>}>
            <MapView
              embedded
              place={mapPlace}
              view={mapView}
              onOpenRef={openRef}
              onShareView={(v) => {
                if (!token) return askJoin();
                setAttach((a) => ({ ...a, view: v }));
                toChat();
              }}
              onSharePlace={(pid) => {
                if (!token) return askJoin();
                setAttach((a) => ({ ...a, place: pid }));
                toChat();
              }}
            />
            </Suspense>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
