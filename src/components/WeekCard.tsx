import { useEffect, useState } from "react";
import { parseRef, spanLabel } from "../../shared/books.ts";
import { findPlace } from "../../shared/places.ts";
import type { WeekInfo } from "../../shared/protocol.ts";
import { getWeek } from "../api.ts";
import { usePlaceIndex } from "../placeData.ts";
import { useApp } from "../state.tsx";

let weekP: Promise<WeekInfo | null> | null = null;
/** One request per visit: the reading changes once a week. */
export const loadWeek = () => (weekP ??= getWeek().catch(() => null));

/** Share this week's page: the phone's share sheet where there is one, WhatsApp otherwise. */
export function shareWeek(w: WeekInfo, lang: "he" | "en", text: string) {
  const url = `${location.origin}/week`;
  const title = `${lang === "he" ? "פרשת" : "Parashat"} ${w.name[lang]}`;
  const body = `${text} ${title}`;
  if (navigator.share) return void navigator.share({ title, text: body, url }).catch(() => {});
  window.open(`https://wa.me/?text=${encodeURIComponent(`${body}\n${url}`)}`, "_blank", "noopener");
}

/** A first chapter to read: the start of the Torah portion. */
export function firstRead(w: WeekInfo) {
  const m = /^(.+?)\s+(\d+):/.exec(w.torah[0] ?? "");
  const r = m && parseRef(`${m[1]} ${m[2]}`);
  return r ? { book: r.book, chapter: r.chapter } : null;
}

export function WeekCard() {
  const { t, lang, go } = useApp();
  const [w, setW] = useState<WeekInfo | null | undefined>(undefined);
  const index = usePlaceIndex();
  useEffect(() => {
    let live = true;
    void loadWeek().then((x) => live && setW(x));
    return () => {
      live = false;
    };
  }, []);
  if (w === null) return null;
  if (!w) return <section className="week-card glass skeleton" />;
  const read = firstRead(w);
  return (
    <section className="week-card glass">
      <div className="today-head">
        <h2>🗓️ {t("weekTitle")}</h2>
        <button className="btn small glass" onClick={() => shareWeek(w, lang, t("weekShareText"))}>
          📤 {t("weekShare")}
        </button>
      </div>
      <p className="week-name">
        {t("weekParasha")} <b>{w.name[lang]}</b>
      </p>
      <p className="muted small week-spans">
        {w.torah.map((s) => spanLabel(s, lang)).join(" · ")}
        {w.haftarah.length > 0 && (
          <>
            {" · "}
            {t("weekHaftarah")}: {w.haftarah.map((s) => spanLabel(s, lang)).join(" · ")}
          </>
        )}
      </p>
      {w.places.length ? (
        <div className="week-places">
          {w.places.map(({ id }) => {
            const p = findPlace(id);
            if (!p) return null;
            return (
              <a
                key={id}
                className="week-place"
                href={`/place/${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  go({ name: "map", place: id, open: true });
                }}
              >
                {index[id]?.cover ? <img src={index[id].cover} alt="" loading="lazy" /> : <span className="week-place-img" />}
                <span dir="auto">{p[lang]}</span>
              </a>
            );
          })}
        </div>
      ) : (
        <p className="muted">{t("weekNone")}</p>
      )}
      <div className="place-actions">
        {read && (
          <button className="btn btn-glow small" onClick={() => go({ name: "read", ...read })}>
            📖 {t("weekRead")}
          </button>
        )}
        {w.places.length > 0 && (
          <button className="btn small" onClick={() => go({ name: "week" })}>
            🛰️ {t("weekAll")}
          </button>
        )}
      </div>
      <p className="credit">
        <a href="https://www.hebcal.com/" target="_blank" rel="noopener">
          {t("weekSource")}
        </a>
      </p>
    </section>
  );
}
