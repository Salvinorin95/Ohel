import { useState } from "react";
import { discover, type DiscoveryHit } from "../../shared/discovery.ts";
import { useApp } from "../state.tsx";

export function Discovery() {
  const { t, lang, go } = useApp();
  const [query, setQuery] = useState("");
  const hits = discover(query);
  const open = (hit: DiscoveryHit) => {
    if (hit.kind === "person") go({ name: "person", id: hit.id });
    if (hit.kind === "place") go({ name: "map", place: hit.id, open: true });
    if (hit.kind === "journey") go({ name: "map", journey: hit.id });
    if (hit.kind === "reference") go({ name: "read", book: hit.ref.book, chapter: hit.ref.chapter, verse: hit.ref.verse });
  };
  return <section className="glass card discovery">
    <h2>{t("discoverTitle")}</h2>
    <label className="field"><span>{t("discoverHint")}</span><input value={query} maxLength={200} onChange={e => setQuery(e.target.value)} placeholder={t("discoverPlaceholder")} dir="auto" /></label>
    {query.trim() && <p className="fine" role="status">{hits.length ? `${hits.length} ${t("discoverResults")}` : t("discoverNone")}</p>}
    {hits.length > 0 && <ul className="discovery-results">{hits.map(h => <li key={h.kind + (h.kind === "reference" ? h.en : h.id)}><button className="link" onClick={() => open(h)}>{h[lang]}</button><span className="fine">{t(`discover_${h.kind}`)}</span></li>)}</ul>}
  </section>;
}
