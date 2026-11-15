import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { refLabel } from "../../shared/books.ts";
import type { PlaceImage, PlaceInfo, RealmId } from "../../shared/placeInfo.ts";
import { findPlace } from "../../shared/places.ts";
import type { Key } from "../i18n.ts";
import { loadPlaceInfo, loadRealms, realmColor, yearLabel } from "../placeData.ts";
import { useApp } from "../state.tsx";

// The deep page for one place: what it looks like, who lived and ruled here, how many people,
// archaeology, the story in art, where the Bible mentions it, a timeline and sources.

interface Props {
  id: string;
  onClose: () => void;
  onShowRealm: (realm: RealmId) => void;
  onOpenRef?: (ref: string) => void;
  onSelectPlace: (id: string) => void;
}

function Gallery({ images, onOpen, wide }: { images: PlaceImage[]; onOpen: (i: PlaceImage) => void; wide?: boolean }) {
  const { lang } = useApp();
  if (!images.length) return null;
  return (
    <div className={wide ? "pp-gallery wide" : "pp-gallery"}>
      {images.map((img) => (
        <figure key={img.file} onClick={() => onOpen(img)}>
          <img src={img.thumb} alt={img.caption[lang]} loading="lazy" decoding="async" width={img.width} height={img.height} />
          <figcaption dir="auto">{img.caption[lang]}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function Lightbox({ img, onClose }: { img: PlaceImage; onClose: () => void }) {
  const { lang, t } = useApp();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-label={img.caption[lang]}>
      <button className="icon-btn lightbox-x" onClick={onClose} aria-label={t("close")}>
        ×
      </button>
      <img src={img.thumb} alt={img.caption[lang]} onClick={(e) => e.stopPropagation()} />
      <div className="lightbox-cap" onClick={(e) => e.stopPropagation()}>
        <p dir="auto">{img.caption[lang]}</p>
        <p className="fine" dir="auto">
          {img.credit} · {img.license} ·{" "}
          <a href={img.full} target="_blank" rel="noopener noreferrer">
            {t("pp_imageSource")}
          </a>
        </p>
      </div>
    </div>
  );
}

export function PlacePage({ id, onClose, onShowRealm, onOpenRef, onSelectPlace }: Props) {
  const { t, lang } = useApp();
  const place = findPlace(id);
  const [info, setInfo] = useState<PlaceInfo | null>(null);
  const [failed, setFailed] = useState(false);
  const [mapped, setMapped] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<PlaceImage | null>(null);

  useEffect(() => {
    let live = true;
    setInfo(null);
    setFailed(false);
    loadPlaceInfo(id)
      .then((d) => live && setInfo(d))
      .catch(() => live && setFailed(true));
    void loadRealms().then((m) => live && setMapped(new Set(m.keys())));
    return () => {
      live = false;
    };
  }, [id]);

  if (!place) return null;
  const tx = info?.[lang];
  const site = info?.images.filter((i) => i.kind === "site" || i.kind === "map") ?? [];
  const finds = info?.images.filter((i) => i.kind === "artifact") ?? [];
  const art = info?.images.filter((i) => i.kind === "art") ?? [];
  const cover = site[0] ?? info?.images[0];

  return (
    <aside className="place-page" aria-label={place[lang]}>
      <header className={cover ? "pp-hero has-img" : "pp-hero"}>
        {cover && <img src={cover.thumb} alt="" />}
        <div className="pp-hero-text">
          <span className={`pill pill-${place.certainty}`}>{t(`certainty_${place.certainty}` as Key)}</span>
          <h2>{place[lang]}</h2>
          <p className="pp-other" dir="auto">{lang === "he" ? place.en : place.he}</p>
        </div>
        <button className="icon-btn pp-x" onClick={onClose} aria-label={t("close")}>
          ×
        </button>
      </header>

      {failed && <p className="pp-pad muted">{t("loadErr")}</p>}
      {!info && !failed && <div className="pp-pad loading-shimmer">{t("loading")}</div>}

      {info && tx && (
        <div className="pp-body">
          <p className="pp-summary">{tx.summary}</p>

          {site.length > 0 && (
            <section>
              <h3>📷 {t("pp_today")}</h3>
              <Gallery images={site} onOpen={setLightbox} wide />
            </section>
          )}

          <section>
            <h3>🏞️ {t("pp_setting")}</h3>
            <p>{tx.setting}</p>
          </section>

          <section>
            <h3>👥 {t("pp_peoples")}</h3>
            {tx.peoples.map((p) => (
              <div key={p.name} className="pp-item">
                <h4>{p.name}</h4>
                <p>{p.text}</p>
              </div>
            ))}
          </section>

          {info.rulers.length > 0 && (
            <section>
              <h3>👑 {t("pp_rulers")}</h3>
              <ol className="pp-rulers">
                {info.rulers.map((r, i) => (
                  <li key={i} style={{ "--realm": r.realm ? realmColor(r.realm) : "var(--muted)" } as CSSProperties}>
                    <div className="pp-ruler-head">
                      <b>{r.name[lang]}</b>
                      <span className="muted small">{r.period[lang]}</span>
                    </div>
                    <p>{r.note[lang]}</p>
                    {r.realm && mapped.has(r.realm) && (
                      <button className="btn small" onClick={() => onShowRealm(r.realm!)}>
                        🗺️ {t("pp_showRealm")}
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section>
            <h3>🏘️ {t("pp_population")}</h3>
            <p>{tx.population}</p>
          </section>

          {(tx.archaeology.length > 0 || finds.length > 0) && (
            <section>
              <h3>⛏️ {t("pp_archaeology")}</h3>
              {tx.archaeology.map((a) => (
                <div key={a.title} className="pp-item">
                  <h4>{a.title}</h4>
                  <p>{a.text}</p>
                </div>
              ))}
              <Gallery images={finds} onOpen={setLightbox} />
            </section>
          )}

          {art.length > 0 && (
            <section>
              <h3>🎨 {t("pp_art")}</h3>
              <Gallery images={art} onOpen={setLightbox} />
            </section>
          )}

          {info.mentions.length > 0 && (
            <section>
              <h3>📖 {t("pp_mentions")}</h3>
              <ul className="pp-mentions">
                {info.mentions.map((m) => (
                  <li key={m.ref}>
                    <button className="chip chip-ref" onClick={() => onOpenRef?.(m.ref)}>
                      {refLabel(m.ref, lang)}
                    </button>
                    <span>{m.note[lang]}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {info.timeline.length > 0 && (
            <section>
              <h3>⏳ {t("pp_timeline")}</h3>
              <ol className="pp-timeline">
                {info.timeline.map((e, i) => (
                  <li key={i}>
                    <b>{yearLabel(e.year, lang)}</b>
                    <span>{e.text[lang]}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {info.related.length > 0 && (
            <section>
              <h3>🧭 {t("pp_related")}</h3>
              <div className="ref-chips">
                {info.related.map((r) => {
                  const p = findPlace(r);
                  return p ? (
                    <a
                      key={r}
                      href={`/place/${r}`}
                      className="chip chip-place"
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectPlace(r);
                      }}
                    >
                      📍 {p[lang]}
                    </a>
                  ) : null;
                })}
              </div>
            </section>
          )}

          <section className="pp-sources">
            <h3>🔗 {t("pp_more")}</h3>
            <ul>
              {info.wiki.he && (
                <li>
                  <a href={`https://he.wikipedia.org/wiki/${encodeURIComponent(info.wiki.he.replace(/ /g, "_"))}`} target="_blank" rel="noopener noreferrer">
                    ויקיפדיה: {info.wiki.he}
                  </a>
                </li>
              )}
              {info.wiki.en && (
                <li>
                  <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(info.wiki.en.replace(/ /g, "_"))}`} target="_blank" rel="noopener noreferrer" dir="ltr">
                    Wikipedia: {info.wiki.en}
                  </a>
                </li>
              )}
              {info.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" dir="auto">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
            <p className="fine">{t("pp_imagesNote")}</p>
          </section>
        </div>
      )}
      {/* Portal: the panel's backdrop-filter would otherwise trap the fixed lightbox inside the panel. */}
      {lightbox && createPortal(<Lightbox img={lightbox} onClose={() => setLightbox(null)} />, document.body)}
    </aside>
  );
}

