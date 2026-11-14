// An open tent drawn as three nested arcs, open on every side.
export function Logo({ size = 40, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <svg className={animate ? "logo logo-anim" : "logo"} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff5ecf" />
          <stop offset=".35" stopColor="#8b5cf6" />
          <stop offset=".7" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#fde047" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#lg)" strokeWidth="3.4" strokeLinecap="round">
        <path className="arc a1" d="M6 52 Q32 0 58 52" />
        <path className="arc a2" d="M16 52 Q32 17 48 52" opacity=".8" />
        <path className="arc a3" d="M26 52 Q32 34 38 52" opacity=".6" />
      </g>
      <circle className="star" cx="32" cy="11" r="3.2" fill="#fde047" />
    </svg>
  );
}
