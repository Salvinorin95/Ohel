# People pages: how to write one

Each person in `shared/people.ts` gets a deep page: their story, who they were, the places of their life on Ohel's map, their family, the key verses, how Jews, Christians and Muslims remember them, what history can and can't say, and art of their story. One file per person: `content/people/<id>.json`, shaped like `PersonInfo` in `shared/personInfo.ts`. `npm run people` checks every file and fills in image URLs and credits.

## Who reads it

The same readers as the place pages (see `content/places/README.md`): curious people in Israel and abroad, of every faith and none, teenagers to grandparents. Write warmly and concretely, like a great storyteller who also respects the facts. Be fair to every tradition and don't preach.

## Accuracy comes first

- Everything in `story`, `character`, `family` and `mentions` must come from the biblical text itself. Check each ref on Sefaria: `https://www.sefaria.org/api/v3/texts/Genesis.12?version=hebrew&return_format=text_only`.
- Keep three things apart and label them: what the Bible says; what later tradition adds (midrash, the New Testament, the Quran, church fathers, folk tradition), which goes only in `traditions`; and what history and archaeology say, which goes only in `history`.
- `history`: be honest and balanced. For the ancestors and Moses, say that there is no direct evidence outside the Bible and give the range of scholarly views (from a historical core to later literary figures) without mocking either. Where there is evidence, name it (the Tel Dan stele and "house of David"; Hezekiah in Sennacherib's annals, his seal impression and the Siloam tunnel; Nebuchadnezzar's ration tablets naming Jehoiachin; the Persian setting of Esther and Nehemiah), and say what it does and doesn't prove.
- `traditions`: only where the person really has a place in that tradition. Abraham, Moses, David, Solomon, Jonah and others are prophets in Islam (Ibrahim, Musa, Dawud, Sulayman, Yunus): say so accurately with the Quran's name for them. The New Testament mentions many of them. Jewish tradition (Talmud, midrash, liturgy, holidays) for all of them. Write each tradition as its own people would recognise it, without judging between them.
- Check every fact with a web search, as for places. 3 to 8 sources, real URLs you opened.
- Don't copy text; write in your own words. Short Bible quotes are fine. Nothing graphic: tell violent episodes plainly and briefly.

## Language

- `he`: natural modern Israeli Hebrew, no niqqud except in Bible quotes, gender-neutral when easy.
- `en`: plain, warm English. The two languages carry the same facts and each reads naturally.

## Fields

```jsonc
{
  "id": "abraham",
  "he": {
    "name": "אברהם",
    "aka": ["אברם", "אברהם אבינו", "איברהים (באסלאם)"],          // 1–4
    "summary": "2–3 sentences: who this is and why they matter.",
    "story": [ { "title": "לך לך", "text": "60–120 words", "refs": ["Genesis 12:1", "Genesis 12:4"] } ],  // 4–7, in order
    "character": "60–110 words: who they were as a person, as the text shows them (strengths, faults, doubts).",
    "traditions": [ { "name": "ביהדות", "text": "40–90 words" }, { "name": "בנצרות", "text": "..." }, { "name": "באסלאם", "text": "..." } ],  // 1–3
    "history": "50–110 words, as above."
  },
  "en": { /* same shape, same number of items */ },
  "era": { "he": "...", "en": "..." },                 // one short line, honest: "By the biblical chronology, about the 18th century BCE"
  "places": [ { "place": "ur", "what": { "he": "one line: what happened here", "en": "..." } } ],  // 2–10 ids from shared/places.ts, story order
  "journey": "abraham",                                 // an id from shared/journeys.ts, or null
  "family": [ { "person": "sarah", "name": { "he": "שרה", "en": "Sarah" }, "relation": { "he": "אשתו", "en": "his wife" } } ],  // 2–8; person = an id from shared/people.ts or null
  "mentions": [ { "ref": "Genesis 12:1", "note": { "he": "one line", "en": "one line" } } ],  // 6–15 key verses in Bible order, outside his/her own story too (e.g. Isaiah 51:2 on Abraham)
  "images": [ { "file": "File:....jpg", "kind": "art", "caption": { "he": "...", "en": "..." } } ],  // 4–8
  "wiki": { "he": "אברהם", "en": "Abraham" },
  "related": ["sarah", "isaac"],                        // ids from shared/people.ts
  "sources": [ { "title": "...", "url": "https://..." } ]
}
```

- Refs: book keys exactly as in `shared/books.ts`, Hebrew (Masoretic) chapter and verse numbering.
- Images: Wikimedia Commons only, free licenses only (public domain, CC0, CC BY, CC BY-SA), each checked with the Commons API exactly as the place README explains. Mostly `art` of the person's story (Rembrandt, Doré, Tissot, Michelangelo, Chagall only if free, medieval manuscripts, mosaics, icons, Persian or Ottoman miniatures where they depict the person), plus `site` or `artifact` where they help (Tel Dan stele for David, the Siloam inscription for Hezekiah, a Lachish relief, the Cyrus Cylinder). The first image is the page's cover: make it the most beautiful one. No images of nudity or gore.

## Before you finish a file

Valid JSON, he and en complete with the same number of items, every ref checked, every place id in `shared/places.ts`, every person id in `shared/people.ts`, every image checked and free.
