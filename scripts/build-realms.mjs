// Extracts the realms Ohel draws on the map from the Cliopatria dataset (Seshat, CC BY 4.0)
// and writes a small simplified GeoJSON to public/data/realms.json.
// Usage: node --max-old-space-size=4096 scripts/build-realms.mjs path/to/cliopatria_polities_only_v021.geojson
// Download: https://github.com/Seshat-Global-History-Databank/cliopatria (cliopatria.geojson.zip)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// realm id (shared/placeInfo.ts REALMS) → Cliopatria polity name and the year to show
const PICK = {
  ur3: ["Sumerian City-States", -2050],
  egypt_nk: ["New Kingdom of Egypt", -1450],
  hatti: ["Hittites", -1300],
  philistia: ["Philistia", -1000],
  phoenicia: ["Phoenicia", -800],
  israel: ["Kingdom of Israel", -850],
  judah: ["Kingdom of Judah", -750],
  urartu: ["Kingdom of Urartu", -750],
  elam: ["Elam", -1200],
  assyria: ["Neo-Assyrian Empire", -670],
  babylonia: ["Neo-Babylonian Empire", -560],
  persia: ["Achaemenid Empire", -500],
};

// Douglas–Peucker on one ring, tolerance in degrees.
function simplify(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    let max = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      // A closed ring starts and ends on the same point: measure from that point instead of a line.
      const d = len < 1e-12 ? Math.hypot(pts[i][0] - ax, pts[i][1] - ay) : Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
      if (d > max) (max = d), (idx = i);
    }
    if (max > tol && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return pts.filter((_, i) => keep[i]).map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)]);
}
const ringArea = (r) => Math.abs(r.reduce((s, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; return s + x * y2 - x2 * y; }, 0) / 2);

const src = JSON.parse(readFileSync(process.argv[2], "utf8"));
const out = [];
for (const [id, [name, year]] of Object.entries(PICK)) {
  const f = src.features.find((x) => x.properties.Name === name && x.properties.FromYear <= year && year <= x.properties.ToYear);
  if (!f) {
    console.warn(`missing ${id}: ${name} @ ${year}`);
    continue;
  }
  const big = f.properties.Area > 300_000;
  const tol = big ? 0.03 : f.properties.Area > 30_000 ? 0.012 : 0.004;
  const minArea = big ? 0.05 : 0.0005; // square degrees: drop specks
  const polys = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates)
    .map((poly) => poly.map((ring) => simplify(ring, tol)).filter((r) => r.length >= 4))
    .filter((poly) => poly.length && ringArea(poly[0]) >= minArea);
  out.push({
    type: "Feature",
    properties: { id, source: name, from: f.properties.FromYear, to: f.properties.ToYear, year, wikipedia: f.properties.Wikipedia ?? "" },
    geometry: { type: "MultiPolygon", coordinates: polys },
  });
  console.log(`${id.padEnd(10)} ${name} @ ${year}: ${polys.length} polygons, ${Math.round(f.properties.Area).toLocaleString()} km²`);
}
mkdirSync(resolve(root, "public/data"), { recursive: true });
const file = resolve(root, "public/data/realms.json");
writeFileSync(file, JSON.stringify({
  type: "FeatureCollection",
  attribution: "Borders: Cliopatria, Seshat Global History Databank (CC BY 4.0), simplified",
  features: out,
}));
console.log(`public/data/realms.json ${Math.round(readFileSync(file).length / 1024)} KB`);
