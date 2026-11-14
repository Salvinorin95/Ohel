# Ohel · אוהל

An open tent for the Bible. Read it, see it on the map, and talk it through together, in Hebrew and English.

The name comes from Abraham's tent, which was open on all four sides so anyone could walk in from any direction. No ads, no religious symbols, no email or password.

## What's inside

- **Rooms**: live group chat about a story, a question or a place. There are 8 starter rooms (Saul on Gilboa, David the king, Elah, Carmel, Genesis, Ruth, Jonah, and an open room), and anyone can open a new one.
  - Attach a verse from the reader, a place, or the exact map view you're looking at. Tapping it opens the same spot for everyone.
  - **Questions** stand out in the room. The person who asked can mark the best answer as helpful.
  - **✨ Light**: tap a message that lit something up for you.
  - **⚡ Quiz**: 56 bilingual questions. Everyone in the room answers together, there are bonus points when two or more people get it right, and the quiz ends early once everyone has answered.
- **Reader**: the whole Tanakh from Sefaria, in Hebrew, English, or both side by side. Vowels and cantillation can be switched on or off, and the ketiv/qere readings are shown. Each chapter lists the places it mentions on the map.
- **Map**: 3D satellite imagery and terrain (MapLibre with Esri imagery and AWS terrain tiles) with 59 places. Each place is marked as identified, traditional or debated, and comes with a short story and the chapters where it appears.
- **Points, levels and badges**: Seed → Sprout → Root → Branch → Tree → Forest → Light. There are 16 badges and a weekly leaderboard. Points come from reading a chapter, exploring the map, talking, answering quizzes, helpful answers and lights.
- **Easy to go in and out**: you join with a name and a color. A key lets you come back on another device. Step out or delete yourself anytime.

## Keeping it kind

`worker/moderation.ts` blocks slurs and curses in Hebrew and English on the server. It sees through look-alike letters, niqqud, leetspeak (`sh1t`), spaced-out letters (`f u c k`), dots (`f.u.c.k`), Hebrew final letters and prefixes. Words the Bible itself uses stay allowed: Rahab is "הזונה", the runner in 2 Samuel 18 is "הכושי", "כוס" is a cup, Balaam's ass, shittim wood. Only the insulting phrases built from them are blocked.

- A blocked message never reaches anyone. The writer gets a gentle note and their text back so they can rephrase it.
- Strikes: a curse counts 1 and a slur counts 2. Strikes fade by one per clean week. 3 strikes → 1 hour pause, 6 → 1 day, 9 → the account can't post anymore and that network can't sign up for 30 days.
- Three reports from different people hide a message and give its author a strike. Reporting a message hides it for you right away.
- Rate limits: 6 messages per 10 seconds, and 30 sign-ups per network per day.

## Run it

```sh
npm install
npm run dev        # http://localhost:5173 (worker + Durable Object + Vite together)
npm test           # moderation tests (72)
node scripts/e2e.mjs http://localhost:5173   # two people chat, ask, light, report, quiz (26 checks)
```

Deploy to Cloudflare Workers with `npm run deploy` (builds, then `wrangler deploy`). Everything runs on one Worker and one SQLite-backed Durable Object, with no other services to set up. It fits the free plan for a small community.

## Layout

```
shared/   books (Tanakh), places (map), game (points/levels/badges), protocol (types)
worker/   index.ts (routes + Sefaria proxy with edge cache), hub.ts (the Durable Object),
          moderation.ts, quiz.ts
src/      React app: views/Home, Room, Reader, MapView, Profile; components; i18n.ts
```

## Credits

Text: [Sefaria](https://www.sefaria.org). Hebrew: Miqra according to the Masorah (CC BY-SA). English: JPS (CC BY-NC). Imagery © Esri, Maxar, Earthstar Geographics. Terrain: Mapzen / AWS Open Data. Fonts: Rubik and Frank Ruhl Libre.
