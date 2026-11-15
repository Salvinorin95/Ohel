import { useEffect, useState } from "react";
import { spanLabel } from "../../shared/books.ts";
import { findPlace } from "../../shared/places.ts";
import type { WeekInfo } from "../../shared/protocol.ts";
import { firstRead, loadWeek, shareWeek } from "../components/WeekCard.tsx";
import { usePlaceIndex } from "../placeData.ts";
import { useApp } from "../state.tsx";

/** /week: this week's Torah portion and haftarah, and every place on the map they mention. Made to be shared. */
export function WeekPage() {
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
  useEffect(() => {
    if (w) document.title = `${t("weekParasha")} ${w.name[lang]} · ${t("weekTitle")} · Ohel`;
  }, [w, lang, t]);

  if (w === undefined) return <div className="loading-shimmer">{t("loading")}</div>;
  if (w === null) return <p className="muted week-page">{t("weekNone")}</p>;
  const read = firstRead(w);
  const date = new Intl.DateTimeFormat(lang === "he" ? "he-IL" : "en", { day: "numeric", month: "long" }).format(new Date(`${w.date}T12:00:00Z`));
  return (
    <div className="week-page">
      <header className="week-hero">
        <p className="muted">
          🗓️ {t("weekTitle")} · {t("weekShabbat")} {date}
        </p>
        <h1>
          {t("weekParasha")} <span className="grad">{w.name[lang]}</span>
        </h1>
        <p className="muted">{w.torah.map((s) => spanLabel(s, lang)).join(" · ")}</p>
        {w.haftarah.length > 0 && (
          <p className="muted">
            {t("weekHaftarah")}: {w.haftarah.map((s) => spanLabel(s, lang)).join(" · ")}
          </p>
        )}
        <div className="place-actions">
          {read && (
            <button className="btn btn-glow" onClick={() => go({ name: "read", ...read })}>
              📖 {t("weekRead")}
            </button>
          )}
          <button className="btn glass" onClick={() => shareWeek(w, lang, t("weekShareText"))}>
            📤 {t("weekShare")}
          </button>
        </div>
      </header>

      {w.places.length === 0 && <p className="muted">{t("weekNone")}</p>}
      <div className="week-grid">
        {w.places.map(({ id }) => {
          const p = findPlace(id);
          if (!p) return null;
          return (
            <article key={id} className="week-tile glass">
              {index[id]?.cover && <img src={index[id].cover} alt="" loading="lazy" onClick={() => go({ name: "map", place: id, open: true })} />}
              <div className="week-tile-body">
                <h3 dir="auto">{p[lang]}</h3>
                <p dir="auto">{p.story[lang]}</p>
                <div className="place-actions">
                  <a
                    className="btn btn-glow small"
                    href={`/place/${id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      go({ name: "map", place: id, open: true });
                    }}
                  >
                    📜 {t("weekPlacePage")}
                  </a>
                  <button className="btn small" onClick={() => go({ name: "map", place: id })}>
                    🛰️ {t("weekOnMap")}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <p className="credit">
        <a href="https://www.hebcal.com/" target="_blank" rel="noopener">
          {t("weekSource")}
        </a>
      </p>
    </div>
  );
}
