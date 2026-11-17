import { useState } from "react";
import { BOOKS, hebNum } from "../../shared/books.ts";
import { PLACES } from "../../shared/places.ts";
import type { Award, RoomInfo } from "../../shared/protocol.ts";
import { api, ApiError } from "../api.ts";
import { useApp } from "../state.tsx";
import { Sheet } from "./Sheet.tsx";

export function NewRoomSheet({ onClose, place: initialPlace = "", title: initialTitle = "" }: { onClose: () => void; place?: string; title?: string }) {
  const { t, lang, token, go, celebrate, toast } = useApp();
  const [title, setTitle] = useState(initialTitle);
  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState(1);
  const [place, setPlace] = useState(initialPlace);
  const [busy, setBusy] = useState(false);
  const [privateRoom, setPrivateRoom] = useState(false);
  const [err, setErr] = useState("");
  const b = BOOKS.find((x) => x.key === book);

  const create = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ room: RoomInfo; award: Award }>("/api/rooms", {
        token,
        body: { title, private: privateRoom, ref: b ? `${b.key} ${chapter}` : undefined, place: place || undefined },
      });
      celebrate(r.award, "room");
      onClose();
      go({ name: "room", id: r.room.id });
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "";
      if (code === "blocked") setErr(t("err_blocked"));
      else if (code === "muted") toast({ kind: "warn", text: t("err_muted") });
      else setErr(t("joinErr"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={t("newRoom")} onClose={onClose}>
      <form
        className="join"
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void create();
        }}
      >
        <p className="muted">{t("newRoomHint")}</p>
        <label className="field">
          <span>{t("roomTitle")}</span>
          <input autoFocus value={title} maxLength={80} placeholder={t("roomTitlePh")} onChange={(e) => setTitle(e.target.value)} dir="auto" />
        </label>
        <div className="field">
          <span>{t("linkText")}</span>
          <div className="row">
            <select value={book} onChange={(e) => (setBook(e.target.value), setChapter(1))}>
              <option value="">{t("none")}</option>
              {BOOKS.map((x) => (
                <option key={x.key} value={x.key}>
                  {lang === "he" ? x.he : x.en}
                </option>
              ))}
            </select>
            {b && (
              <select value={chapter} onChange={(e) => setChapter(Number(e.target.value))}>
                {Array.from({ length: b.chapters }, (_, i) => i + 1).map((c) => (
                  <option key={c} value={c}>
                    {t("chapter")} {lang === "he" ? hebNum(c) : c}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <label className="field">
          <span>{t("linkPlace")}</span>
          <select value={place} onChange={(e) => setPlace(e.target.value)}>
            <option value="">{t("none")}</option>
            {[...PLACES].sort((a, z) => a[lang].localeCompare(z[lang], lang)).map((p) => (
              <option key={p.id} value={p.id}>
                {p[lang]}
              </option>
            ))}
          </select>
        </label>
        <label className="field"><span><input type="checkbox" checked={privateRoom} onChange={e => setPrivateRoom(e.target.checked)} /> {t("privateRoom")}</span><span className="fine">{t("privateRoomHint")}</span></label>
        {err && <p className="err">{err}</p>}
        <div className="row end">
          <button type="button" className="btn ghost" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="btn btn-glow" disabled={busy || title.trim().length < 3}>
            {t("create")}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
