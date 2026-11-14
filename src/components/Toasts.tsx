import { useApp } from "../state.tsx";

export function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          {t.glyph && <span className="toast-glyph">{t.glyph}</span>}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
