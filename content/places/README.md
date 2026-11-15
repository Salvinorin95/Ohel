# Place pages: how to write one

Each place on Ohel's map (`shared/places.ts`) gets a deep page: the place and its surroundings, the peoples who lived there, who ruled it (with that realm's territory on the map), how many people lived there compared with its time, archaeology, photos of the site and finds, art of the story, and where else the Bible mentions it.

One file per place: `content/places/<id>.json`, where `<id>` is the place's id in `shared/places.ts`. The TypeScript shape is `PlaceInfo` in `shared/placeInfo.ts`. `npm run places` (scripts/build-places.ts) checks every file and fills in image URLs and credits.

## Who reads it

Curious people in Israel and abroad: Jews, Christians, Muslims, and people of no faith, from teenagers to grandparents. Many are not scholars. Write warmly, clearly and concretely, like a great museum guide. Be fair to every tradition and don't preach.

## Accuracy comes first

- Check every fact, number and date with a web search. Prefer excavation project sites, museums, encyclopedias (Britannica, Wikipedia with its sources), university pages and peer-reviewed work. List what you used in `sources` (3 to 8 entries, real URLs you actually opened).
- Where scholars disagree (the site's identification, dates, the size of David and Solomon's kingdom, the route of the Exodus, Sinai, Sodom, Ararat, and so on), say so and give the main views in a sentence or two. Never present one view as settled when it isn't.
- Dates: "c. 700 BCE" / "בערך 700 לפנה״ס". Timeline `year` is a number: negative for BCE (−701), positive for CE (1847).
- Population: give a range and the period ("at its height under Sennacherib, c. 700 BCE, perhaps 100,000–150,000 people"), say it's an estimate, and compare it with the time ("one of the largest cities in the world then; Jerusalem had perhaps 10,000–25,000"). If nobody knows, say what is known (the area of the walled city in hectares or dunams, the number of houses) and what it suggests. For a mountain, spring or valley, describe who lived around it.
- Write Hebrew and English yourself, in your own words. Don't copy text from Wikipedia or anywhere else. Short quotes from the Hebrew Bible are fine (the Hebrew text is public domain). Don't quote more than a few words of any modern English translation.

## Language

- `he`: natural modern Israeli Hebrew. No niqqud except in Bible quotes. Gender-neutral where it's easy (plural or infinitive). Use the Hebrew names of books and places (שמואל א, נינוה, אשור).
- `en`: plain, warm English.
- The two languages carry the same facts, but each should read naturally. Don't translate word for word.

## Fields

```jsonc
{
  "id": "nineveh",
  "he": {
    "summary": "2–3 sentences: what this place is and why it matters in the Bible.",
    "setting": "60–120 words: where it is, the terrain, water, roads, climate, what's around it, what you see there today.",
    "peoples": [ { "name": "האשורים", "text": "40–80 words on who they were, language, faith, way of life, and their relation to this place." } ],  // 2–4 entries, oldest first
    "population": "40–100 words, as above.",
    "archaeology": [ { "title": "ספריית אשורבניפל", "text": "40–90 words: what was found, when, by whom, where it is now (museum), and why it matters." } ]  // 2–5 entries
  },
  "en": { /* same shape */ },
  "rulers": [
    { "realm": "assyria", "name": { "he": "...", "en": "..." }, "period": { "he": "...", "en": "..." }, "note": { "he": "one sentence", "en": "one sentence" } }
  ],  // 1–5 entries, oldest first. "realm" is an id from REALMS in shared/placeInfo.ts, or null if none fits (then name says who).
  "timeline": [ { "year": -701, "text": { "he": "...", "en": "..." } } ],  // 4–8 entries, oldest first, short lines
  "mentions": [ { "ref": "Jonah 3:3", "note": { "he": "one line", "en": "one line" } } ],  // 4–15 entries: the key places the Bible mentions it, in Bible order
  "images": [ { "file": "File:....jpg", "kind": "site", "caption": { "he": "...", "en": "..." } } ],  // 5–10, see below
  "wiki": { "he": "נינוה", "en": "Nineveh" },  // exact Wikipedia article titles that exist
  "related": ["babylon", "ur"],  // ids from shared/places.ts that connect to this place
  "sources": [ { "title": "...", "url": "https://..." } ]
}
```

### Bible references

- Book names exactly as `key` in `shared/books.ts` (e.g. "I Samuel", "II Kings", "Song of Songs", "I Chronicles"), then chapter, optionally `:verse` ("II Kings 19:36"). Chapter and verse follow the Hebrew (Masoretic) numbering. Note: Joel and Malachi differ from English Bibles.
- Check each verse really mentions the place (you can open `https://www.sefaria.org/api/v3/texts/II_Kings.19?version=hebrew&return_format=text_only`).

### Images (Wikimedia Commons only)

Each place needs 5 to 10 images that really help: photos of the site today (`site`, 2–4), finds from it in museums (`artifact`, 1–3), and art of its story (`art`, 1–3: e.g. Gustave Doré, James Tissot, Rembrandt, Michelangelo, medieval manuscripts, mosaics, Assyrian reliefs of the event). `map` for an old map or plan if it's good.

- Every file must exist and have a free license: public domain, CC0, CC BY, or CC BY-SA. No NC/ND, no "fair use", no files without a clear license.
- Verify each one with the Commons API and read the license from `extmetadata.LicenseShortName`:
  `curl -s -A "OhelBibleApp/0.1 (educational, non-commercial)" "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&iiextmetadatafilter=LicenseShortName|Artist&titles=File:EXACT_NAME.jpg"`
  A missing file shows `"missing"`. Find files with `list=search&srnamespace=6&srsearch=...` or by browsing the place's Commons category.
- Prefer clear, good-looking photos at least 1000 px wide. No images showing modern violence or soldiers, and nothing graphic.
- Captions: one short line in each language that says what it is and, for art, who made it and when ("Jonah cast into the sea, Gustave Doré, 1866").
- Use a generic User-Agent like the one above. Never put anyone's name or email in requests.

## Before you finish a file

- It's valid JSON (no comments) and matches the shape above.
- Every ref uses a book key from `shared/books.ts`.
- Every image was checked with the API and has a free license.
- Hebrew and English both complete.
