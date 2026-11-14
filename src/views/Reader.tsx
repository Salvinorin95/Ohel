import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { BOOKS, SECTION_NAMES, findBook, hebNum, type Section } from "../../shared/books.ts";
import { placesForChapter } from "../../shared/places.ts";
import { getText, postRead, type ChapterText } from "../api.ts";
import { Sheet } from "../components/Sheet.tsx";
import { useApp } from "../state.tsx";

type Mode = "he" | "en" | "both";

const CANTILLATION = /[֑-ֽ֯]/g;
const VOWELS = /[ְ-ׇּׁׂׅׄ]/g;
const readThisSession = new Set<string>();

function useStored<T extends string | boolean>(key: string, initial: T): [T, (v: T) => void];
function useStored(key: string, initial: boolean): [boolean, (v: boolean) => void];
function useStored<T extends string | boolean>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(() => {
    const s = localStorage.getItem(key);
    if (s === null) return initial;
    return (typeof initial === "boolean" ? s === "1" : s) as T;
  });
  return [
    v,
    (x: T) => {
      setV(x);
      localStorage.setItem(key, typeof x === "boolean" ? (x ? "1" : "0") : String(x));
    },
  ];
}

/** Ketiv in (parentheses) is shown small and dim; the qere in [brackets] is what is read aloud. */
function hebrewLine(s: string, vowels: boolean, cant: boolean): ReactNode[] {
  let x = s;
  if (!cant) x = x.replace(CANTILLATION, "");
  if (!vowels) x = x.replace(VOWELS, "");
  const out: ReactNode[] = [];
  const re = /\(([^)]*)\)\s*\[([^\]]*)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(x))) {
    out.push(x.slice(last, m.index));
    out.push(
      <Fragment key={i++}>
        <span className="ketiv" title="כתיב">{m[1]}</span> <span className="qere">{m[2]}</span>
      </Fragment>,
    );
    last = m.index + m[0].length;
  }
  out.push(x.slice(last));
  return out;
}

export interface ReaderProps {
  book: string;
  chapter: number;
  onNavigate: (book: string, chapter: number) => void;
  highlight?: number;
  embedded?: boolean;
  onShareVerse?: (ref: string, text: string) => void;
  onOpenPlace?: (id: string) => void;
}

export function Reader({ book, chapter, onNavigate, highlight, embedded, onShareVerse, onOpenPlace }: ReaderProps) {
  const { t, lang, token, celebrate, toast } = useApp();
  const [mode, setMode] = useStored<Mode>("ohel.read.mode", lang === "he" ? "he" : "both");
  const [vowels, setVowels] = useStored<boolean>("ohel.read.vowels", true);
  const [cant, setCant] = useStored<boolean>("ohel.read.cant", false);
  const [data, setData] = useState<ChapterText | null>(null);
  const [error, setError] = useState(false);
  const [picker, setPicker] = useState(false);
  const [pickBook, setPickBook] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(highlight ?? null);
  const [attempt, setAttempt] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const b = findBook(book) ?? BOOKS[0];
  const ref = `${b.key} ${chapter}`;

  useEffect(() => {
    let live = true;
    setData(null);
    setError(false);
    getText(ref)
      .then((d) => live && setData(d))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [ref, attempt]);

  useEffect(() => setSelected(highlight ?? null), [ref, highlight]);

  // Scroll to a highlighted verse, or back to the top on a new chapter.
  useEffect(() => {
    if (!data) return;
    const box = embedded ? scrollRef.current : null;
    if (highlight) {
      const el = document.getElementById(`v-${highlight}`);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    } else if (box) box.scrollTop = 0;
  }, [data, highlight, embedded]);

  // Reading reward: some time on the chapter and reaching its end.
  useEffect(() => {
    if (!data || !token || readThisSession.has(ref)) return;
    let timeOk = false;
    let endOk = false;
    const tryAward = () => {
      if (!timeOk || !endOk || readThisSession.has(ref)) return;
      readThisSession.add(ref);
      postRead(token, ref)
        .then((r) => celebrate(r.award, "read"))
        .catch(() => readThisSession.delete(ref));
    };
    const timer = setTimeout(() => {
      timeOk = true;
      tryAward();
    }, Math.min(30_000, 6_000 + data.he.length * 900));
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        endOk = true;
        tryAward();
      }
    });
    if (endRef.current) io.observe(endRef.current);
    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [data, token, ref, celebrate]);

  const places = placesForChapter(b.key, chapter);
  const verses = data ? Math.max(data.he.length, data.en.length) : 0;
  const heName = (n: number) => (lang === "he" ? hebNum(n) : String(n));

  const copyVerse = async (v: number) => {
    const text = [data?.he[v - 1] && mode !== "en" ? data.he[v - 1].replace(CANTILLATION, "") : "", data?.en[v - 1] && mode !== "he" ? data.en[v - 1] : ""]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard?.writeText(`${text}\n(${b.en} ${chapter}:${v})`).catch(() => {});
    toast({ kind: "info", text: t("copied") });
  };

  return (
    <div className={embedded ? "reader embedded" : "reader"}>
      <div className="reader-bar glass">
        <button className="btn ghost book-btn" onClick={() => { setPickBook(null); setPicker(true); }}>
          <span className="book-name">{lang === "he" ? b.he : b.en}</span>
          <span className="ch-num">{heName(chapter)}</span>
          <span className="caret">▾</span>
        </button>
        <div className="reader-nav">
          <button className="icon-btn" disabled={chapter <= 1} onClick={() => onNavigate(b.key, chapter - 1)} aria-label={t("prevCh")}>
            {lang === "he" ? "→" : "←"}
          </button>
          <button className="icon-btn" disabled={chapter >= b.chapters} onClick={() => onNavigate(b.key, chapter + 1)} aria-label={t("nextCh")}>
            {lang === "he" ? "←" : "→"}
          </button>
        </div>
        <div className="seg" role="group">
          {(["he", "both", "en"] as Mode[]).map((m) => (
            <button key={m} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>
              {m === "he" ? "עב" : m === "en" ? "EN" : t("langBoth")}
            </button>
          ))}
        </div>
        {mode !== "en" && (
          <div className="seg" role="group">
            <button className={vowels ? "on" : ""} onClick={() => setVowels(!vowels)} title={t("vowels")}>
              אָ
            </button>
            <button className={cant ? "on" : ""} onClick={() => setCant(!cant)} title={t("cantillation")}>
              א֑
            </button>
          </div>
        )}
      </div>

      <div className="reader-scroll" ref={scrollRef}>
        {places.length > 0 && (
          <div className="place-chips">
            <span className="muted">{t("onTheMap")}:</span>
            {places.map((p) => (
              <button key={p.id} className="chip chip-place" onClick={() => onOpenPlace?.(p.id)}>
                📍 {p[lang]}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="empty">
            <p>{t("loadErr")}</p>
            <button className="btn" onClick={() => setAttempt((a) => a + 1)}>
              {t("retry")}
            </button>
          </div>
        )}
        {!data && !error && <div className="loading-shimmer">{t("loading")}</div>}

        {data && (
          <div className={`verses mode-${mode}`}>
            {Array.from({ length: verses }, (_, i) => i + 1).map((v) => (
              <div key={v} id={`v-${v}`} className={selected === v ? "verse on" : "verse"} onClick={() => setSelected(selected === v ? null : v)}>
                {mode !== "en" && data.he[v - 1] && (
                  <p className="he" lang="he" dir="rtl">
                    <span className="vnum">{hebNum(v)}</span>
                    {hebrewLine(data.he[v - 1], vowels, cant)}
                  </p>
                )}
                {mode !== "he" && data.en[v - 1] && (
                  <p className="en" lang="en" dir="ltr">
                    <span className="vnum">{v}</span>
                    {data.en[v - 1]}
                  </p>
                )}
                {selected === v && (
                  <div className="verse-actions" onClick={(e) => e.stopPropagation()}>
                    {onShareVerse && (
                      <button className="btn btn-glow small" onClick={() => onShareVerse(`${b.key} ${chapter}:${v}`, data.he[v - 1] ?? "")}>
                        💬 {t("shareVerse")}
                      </button>
                    )}
                    <button className="btn small" onClick={() => void copyVerse(v)}>
                      {t("copy")}
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} className="chapter-end">
              {chapter < b.chapters && (
                <button className="btn" onClick={() => onNavigate(b.key, chapter + 1)}>
                  {t("nextCh")} {lang === "he" ? "←" : "→"}
                </button>
              )}
              <p className="fine">
                <a href={`https://www.sefaria.org/${b.key.replace(/ /g, "_")}.${chapter}`} target="_blank" rel="noreferrer">
                  {t("textSource")}
                </a>
                {" · "}
                {data.sources.he}
                {data.sources.en ? ` · ${data.sources.en}` : ""}
              </p>
            </div>
          </div>
        )}
      </div>

      {picker && (
        <Sheet title={t("chooseBook")} onClose={() => setPicker(false)} wide>
          {!pickBook ? (
            <div className="book-picker">
              {(Object.keys(SECTION_NAMES) as Section[]).map((s) => (
                <section key={s}>
                  <h3>{SECTION_NAMES[s][lang]}</h3>
                  <div className="book-grid">
                    {BOOKS.filter((x) => x.section === s).map((x) => (
                      <button key={x.key} className={x.key === b.key ? "chip on" : "chip"} onClick={() => (x.chapters === 1 ? (onNavigate(x.key, 1), setPicker(false)) : setPickBook(x.key))}>
                        {lang === "he" ? x.he : x.en}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="book-picker">
              <button className="link" onClick={() => setPickBook(null)}>
                {lang === "he" ? "→" : "←"} {t("chooseBook")}
              </button>
              <h3>{lang === "he" ? findBook(pickBook)!.he : findBook(pickBook)!.en}</h3>
              <div className="chapter-grid">
                {Array.from({ length: findBook(pickBook)!.chapters }, (_, i) => i + 1).map((c) => (
                  <button
                    key={c}
                    className={pickBook === b.key && c === chapter ? "chip on" : "chip"}
                    onClick={() => {
                      onNavigate(pickBook, c);
                      setPicker(false);
                    }}
                  >
                    {heName(c)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
}
