// Renders scripts/og.html to public/og.jpg (the link-preview picture) with headless Chrome + macOS sips.
// Usage: node scripts/og.mjs [path-to-chrome]
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const chrome =
  process.argv[2] ??
  [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    join(homedir(), "Desktop/Google Chrome.app/Contents/MacOS/Google Chrome"),
  ].find(existsSync);
if (!chrome) throw new Error("Chrome not found; pass its path as the first argument");

const tmp = mkdtempSync(join(tmpdir(), "ohel-og-"));
const png = join(tmp, "og.png");
execFileSync(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  "--window-size=1200,630",
  "--virtual-time-budget=3000",
  `--user-data-dir=${join(tmp, "profile")}`,
  `--screenshot=${png}`,
  pathToFileURL(join(root, "scripts/og.html")).href,
], { stdio: "ignore" });
const out = join(root, "public/og.jpg");
execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "82", png, "--out", out], { stdio: "ignore" });
rmSync(tmp, { recursive: true, force: true });
console.log(`public/og.jpg ${Math.round(statSync(out).size / 1024)} KB`);
