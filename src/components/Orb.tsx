import { ORBS } from "../../shared/game.ts";

/** A person's light: a glowing two-color orb with their initial. */
export function Orb({ avatar, name, size = 32, ring = false }: { avatar: number; name?: string; size?: number; ring?: boolean }) {
  const [a, b] = ORBS[((avatar % ORBS.length) + ORBS.length) % ORBS.length];
  const initial = name ? [...name.trim()][0]?.toUpperCase() ?? "" : "";
  return (
    <span
      className={ring ? "orb orb-ring" : "orb"}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.44,
        background: `radial-gradient(circle at 32% 28%, hsl(${a} 100% 82%), hsl(${a} 90% 58%) 38%, hsl(${b} 85% 45%) 78%, hsl(${b} 80% 30%))`,
        boxShadow: `0 0 ${size * 0.45}px hsl(${a} 95% 60% / .45)`,
      }}
      aria-hidden={!name}
      title={name}
    >
      {initial}
    </span>
  );
}
