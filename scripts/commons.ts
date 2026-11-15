// Wikimedia Commons lookups shared by the place and people builds: URLs, sizes, authors, and only free licenses.
const UA = "OhelBibleApp/0.1 (educational, non-commercial)";
const THUMB = 960;

const strip = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const FREE = /^(public domain|pd\b|pd-|cc0|cc[- ]by(-sa)?[- ]\d|cc[- ]by(-sa)?$|attribution|no restrictions|copyrighted free use)/i;

export interface Resolved {
  thumb: string;
  full: string;
  width: number;
  height: number;
  credit: string;
  license: string;
}

/** Looks up up to 50 Commons files per request. Returns title → details (or a reason it's unusable). */
export async function resolveImages(titles: string[]): Promise<Map<string, Resolved | string>> {
  const out = new Map<string, Resolved | string>();
  for (let i = 0; i < titles.length; i += 25) {
    const batch = titles.slice(i, i + 25);
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.search = new URLSearchParams({
      action: "query", format: "json", formatversion: "2", prop: "imageinfo", iiprop: "url|size|extmetadata",
      iiurlwidth: String(THUMB), iiextmetadatafilter: "LicenseShortName|Artist|Credit|UsageTerms", titles: batch.join("|"),
    }).toString();
    let res = await fetch(url, { headers: { "user-agent": UA } });
    for (let attempt = 1; res.status === 429 || res.status >= 500; attempt++) {
      if (attempt > 6) break;
      const wait = Number(res.headers.get("retry-after")) * 1000 || 2000 * 2 ** attempt;
      console.log(`  Commons says slow down (${res.status}); waiting ${Math.round(wait / 1000)}s`);
      await new Promise((r) => setTimeout(r, wait));
      res = await fetch(url, { headers: { "user-agent": UA } });
    }
    if (!res.ok) throw new Error(`Commons ${res.status}`);
    const d = (await res.json()) as {
      query?: {
        normalized?: { from: string; to: string }[];
        pages?: { title: string; missing?: boolean; imageinfo?: { thumburl?: string; url: string; descriptionurl: string; thumbwidth?: number; thumbheight?: number; width: number; height: number; extmetadata?: Record<string, { value: string }> }[] }[];
      };
    };
    const back = new Map((d.query?.normalized ?? []).map((n) => [n.to, n.from]));
    for (const p of d.query?.pages ?? []) {
      const key = back.get(p.title) ?? p.title;
      const ii = p.imageinfo?.[0];
      if (p.missing || !ii) {
        out.set(key, "missing on Commons");
        continue;
      }
      const meta = ii.extmetadata ?? {};
      const license = strip(meta.LicenseShortName?.value ?? "");
      if (!FREE.test(license) || /\b(nc|nd)\b/i.test(license)) {
        out.set(key, `license not free enough: "${license || "none"}"`);
        continue;
      }
      out.set(key, {
        thumb: ii.thumburl ?? ii.url,
        full: ii.descriptionurl,
        width: ii.thumbwidth ?? ii.width,
        height: ii.thumbheight ?? ii.height,
        credit: strip(meta.Artist?.value ?? "").slice(0, 160) || "Wikimedia Commons",
        license,
      });
    }
    await new Promise((r) => setTimeout(r, 1200)); // be gentle with the API
  }
  return out;
}

