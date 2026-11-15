import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { parseRef, refLabel } from "../../shared/books.ts";
import { findJourney } from "../../shared/journeys.ts";
import { ERAS, findPerson, PEOPLE } from "../../shared/people.ts";
import type { PersonInfo } from "../../shared/personInfo.ts";
import type { PlaceImage } from "../../shared/placeInfo.ts";
import { findPlace } from "../../shared/places.ts";
import { loadPersonInfo, usePeopleIndex, usePlaceIndex } from "../placeData.ts";
import { useApp } from "../state.tsx";
import { Gallery, Lightbox } from "./PlacePage.tsx";

/** A link that works as a real address (for search engines and new tabs) but moves inside the app on click. */
function Go({ href, onGo, className, children }: { href: string; onGo: () => void; className?: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        onGo();
      }}
    >
      {children}
    </a>
  );
}

/** /person/<id>: one person's story, places, family, verses, how traditions remember them, and what history can say. */
export function PersonPage({ id }: { id: string }) {
  const { t, lang, go } = useApp();
  const person = findPerson(id);
  const [info, setInfo] = useState<PersonInfo | null>(null);
  const [failed, setFailed] = useState(false);
  const [lightbox, setLightbox] = useState<PlaceImage | null>(null);
  const places = usePlaceIndex();

  useEffect(() => {
    let live = true;
    setInfo(null);
    setFailed(false);
    loadPersonInfo(id)
      .then((d) => live && setInfo(d))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [id]);
  useEffect(() => {
    if (person) document.title = `${person[lang]} · ${t("peopleTitle")} · Ohel`;
  }, [person, lang, t]);

  if (!person) return <p className="muted person-page">{t("loadErr")}</p>;
  const tx = info?.[lang];
  const cover = info?.images[0];
  const read = (ref: string) => {
    const r = parseRef(ref);
    if (r) go({ name: "read", book: r.book, chapter: r.chapter });
  };
  const journey = findJourney(info?.journey);
  const share = () => {
    const url = `${location.origin}/person/${id}${lang === "en" ? "?lang=en" : ""}`;
    const title = `${person[lang]} · ${t("peopleTitle")}`;
    if (navigator.share) return void navigator.share({ title, url }).catch(() => {});
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`, "_blank", "noopener");
  };

  return (
    <article className="person-page">
      <header className={cover ? "ps-hero has-img" : "ps-hero"}>
        {cover && <img src={cover.thumb} alt={cover.caption[lang]} onClick={() => setLightbox(cover)} />}
        <div className="ps-hero-text">
          <span className="pill ps-era">{ERAS[person.era][lang]}</span>
          <h1>{person[lang]}</h1>
          <p className="ps-other" dir="auto">
            {lang === "he" ? person.en : person.he}
            {tx?.aka.length ? ` · ${tx.aka.join(" · ")}` : ""}
          </p>
          {info && <p className="ps-when">{info.era[lang]}</p>}
        </div>
      </header>

      {failed && <p className="muted">{t("loadErr")}</p>}
      {!info && !failed && <div className="loading-shimmer">{t("loading")}</div>}

      {info && tx && (
        <div className="ps-body">
          <p className="pp-summary">{tx.summary}</p>
          <div className="place-actions">
            {journey && (
              <Go className="btn btn-glow small" href={`/journey/${journey.id}`} onGo={() => go({ name: "map", journey: journey.id })}>
                🧭 {t("ps_journey")}
              </Go>
            )}
            <button className="btn small glass" onClick={share}>
              📤 {t("ps_share")}
            </button>
          </div>

          <section>
            <h2>📜 {t("ps_story")}</h2>
            {tx.story.map((s, i) => (
              <div key={i} className="ps-chapter">
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <div className="ref-chips">
                  {s.refs.map((r) => (
                    <button key={r} className="chip" onClick={() => read(r)}>
                      📖 {refLabel(r, lang)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {info.places.length > 0 && (
            <section>
              <h2>📍 {t("ps_places")}</h2>
              <div className="ps-places">
                {info.places.map(({ place, what }) => {
                  const p = findPlace(place);
                  if (!p) return null;
                  return (
                    <Go key={place} className="ps-place glass" href={`/place/${place}`} onGo={() => go({ name: "map", place, open: true })}>
                      {places[place]?.cover ? <img src={places[place].cover} alt="" loading="lazy" /> : <span className="ps-place-img" />}
                      <span className="ps-place-text">
                        <b dir="auto">{p[lang]}</b>
                        <span dir="auto">{what[lang]}</span>
                      </span>
                    </Go>
                  );
                })}
              </div>
            </section>
          )}

          {info.family.length > 0 && (
            <section>
              <h2>🌳 {t("ps_family")}</h2>
              <div className="ref-chips">
                {info.family.map((f, i) =>
                  f.person && findPerson(f.person) ? (
                    <Go key={i} className="chip chip-person" href={`/person/${f.person}`} onGo={() => go({ name: "person", id: f.person! })}>
                      {f.name[lang]} · <span className="muted">{f.relation[lang]}</span>
                    </Go>
                  ) : (
                    <span key={i} className="chip">
                      {f.name[lang]} · <span className="muted">{f.relation[lang]}</span>
                    </span>
                  ),
                )}
              </div>
            </section>
          )}

          <section>
            <h2>💭 {t("ps_character")}</h2>
            <p>{tx.character}</p>
          </section>

          {info.images.length > 1 && (
            <section>
              <h2>🎨 {t("pp_art")}</h2>
              <Gallery images={info.images.slice(1)} onOpen={setLightbox} />
            </section>
          )}

          {tx.traditions.length > 0 && (
            <section>
              <h2>🕯️ {t("ps_traditions")}</h2>
              {tx.traditions.map((x) => (
                <div key={x.name} className="pp-item">
                  <h4>{x.name}</h4>
                  <p>{x.text}</p>
                </div>
              ))}
            </section>
          )}

          <section>
            <h2>🏺 {t("ps_history")}</h2>
            <p>{tx.history}</p>
          </section>

          {info.mentions.length > 0 && (
            <section>
              <h2>📖 {t("ps_mentions")}</h2>
              <ol className="pp-mentions">
                {info.mentions.map((m) => (
                  <li key={m.ref}>
                    <button className="chip" onClick={() => read(m.ref)}>
                      {refLabel(m.ref, lang)}
                    </button>{" "}
                    <span dir="auto">{m.note[lang]}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {info.related.length > 0 && (
            <section>
              <h2>🤝 {t("ps_related")}</h2>
              <div className="ref-chips">
                {info.related.map((r) => {
                  const p = findPerson(r);
                  return p ? (
                    <Go key={r} className="chip chip-person" href={`/person/${r}`} onGo={() => go({ name: "person", id: r })}>
                      👤 {p[lang]}
                    </Go>
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
      {lightbox && createPortal(<Lightbox img={lightbox} onClose={() => setLightbox(null)} />, document.body)}
    </article>
  );
}

/** /people: everyone with a page, grouped by era. */
export function PeoplePage() {
  const { t, lang, go } = useApp();
  const index = usePeopleIndex();
  useEffect(() => {
    document.title = `${t("peopleTitle")} · Ohel`;
  }, [t]);
  const ready = PEOPLE.filter((p) => index[p.id]);
  const eras = [...new Set(ready.map((p) => p.era))];
  return (
    <div className="people-page">
      <h1 className="people-h1">
        👥 <span className="grad">{t("peopleTitle")}</span>
      </h1>
      {eras.map((era) => (
        <section key={era}>
          <h2>{ERAS[era][lang]}</h2>
          <div className="people-grid">
            {ready.filter((p) => p.era === era).map((p) => (
              <PersonTile key={p.id} id={p.id} cover={index[p.id]?.cover} onGo={() => go({ name: "person", id: p.id })} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function PersonTile({ id, cover, onGo }: { id: string; cover?: string; onGo: () => void }) {
  const { lang } = useApp();
  const p = findPerson(id);
  if (!p) return null;
  return (
    <Go className="person-tile" href={`/person/${id}`} onGo={onGo}>
      {cover ? <img src={cover} alt="" loading="lazy" /> : <span className="person-tile-img" />}
      <b dir="auto">{p[lang]}</b>
    </Go>
  );
}
