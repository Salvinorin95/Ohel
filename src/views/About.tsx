import { useEffect } from "react";
import { Logo } from "../components/Logo.tsx";
import { useApp } from "../state.tsx";

// House rules and privacy, in plain words. Keep this in step with what the code actually does
// (worker/hub.ts: strikes, reports, deleteMe; worker/index.ts: what goes to whom).

interface Section {
  h: string;
  p?: string[];
  items?: string[];
}

const PAGE: Record<"he" | "en", { title: string; intro: string; sections: Section[]; updated: string }> = {
  he: {
    title: "כללי האוהל ופרטיות",
    intro: "אוהל הוא מקום לקרוא את התנ״ך, לראות איפה הדברים קרו ולדבר על זה ביחד. כדי שיישאר נעים לכולם, יש כמה כללים פשוטים.",
    sections: [
      {
        h: "כללי האוהל",
        items: [
          "מכבדים אנשים ומתווכחים עם רעיונות.",
          "בלי קללות, בלי גידופים ובלי שנאה כלפי שום אדם, עם, דת או קבוצה.",
          "כולם מוזמנים: יהודים, נוצרים, מוסלמים, מאמינים מכל סוג וגם מי שלא מאמין בכלל. משתפים מה המסורת שלך אומרת, בלי ללחוץ על אחרים להאמין כמוך.",
          "בלי פרסומות, בלי מכירות ובלי ספאם.",
          "שומרים על פרטיות: לא מפרסמים טלפון, כתובת או פרטים אישיים, לא שלך ולא של אחרים.",
          "נתקלת במשהו לא בסדר? לוחצים על ההודעה ואז על ⚑ דיווח.",
        ],
      },
      {
        h: "איך האוהל נשאר נעים",
        items: [
          "מסנן תופס קללות וגידופים בעברית ובאנגלית לפני שמישהו רואה אותם, ומבקש מהכותב לנסח אחרת. מילים מהתנ״ך עצמו נשארות מותרות.",
          "מי שחוזר על זה מקבל התראות: אחרי 3 התראות יש הפסקה של שעה, אחרי 6 הפסקה של יום, ואחרי 9 אי אפשר לכתוב יותר. כל שבוע נקי מוחק התראה אחת.",
          "שלושה דיווחים על הודעה מסתירים אותה.",
          "צוות האוהל יכול להסתיר הודעות, להשתיק ולחסום. חסימה מונעת גם הרשמה חדשה מאותו חיבור לאינטרנט למשך 30 יום.",
        ],
      },
      {
        h: "מה נשמר עליך",
        items: [
          "השם והצבע שבחרת, הנקודות והתגים, הפרקים שקראת והמקומות שגילית, וההודעות שכתבת.",
          "המפתח שלך נשמר רק כטביעת אצבע מעורבלת: אפשר לבדוק אותו, אבל אי אפשר לקרוא אותו.",
          "כדי שמי שנחסם לא יחזור מיד, נשמרת טביעת אצבע מעורבלת של החיבור שלך לאינטרנט, לא הכתובת עצמה.",
        ],
      },
      {
        h: "מה לא נשמר",
        items: ["אין מייל, אין טלפון ואין סיסמה.", "אין פרסומות ואין עוגיות מעקב.", "שום דבר לא נמכר ולא מועבר לאף אחד."],
      },
      {
        h: "מי עוד מעורב",
        items: [
          "Cloudflare מארחת את האוהל וסופרת ביקורים (Cloudflare Web Analytics) בלי עוגיות ובלי לעקוב אחריך בין אתרים.",
          "הטקסטים מגיעים מספריא דרך השרת שלנו, כך שספריא לא רואה אותך.",
          "תמונות המפה נטענות ישירות מ־Esri (לוויין) ומ־Amazon (תבליט), ולכן הן רואות את כתובת האינטרנט שלך, כמו כל אתר.",
          "המפתח, השפה והגדרות הקריאה נשמרים אצלך בדפדפן, כדי שלא תצטרכו להיכנס מחדש בכל פעם.",
        ],
      },
      {
        h: "לצאת ולמחוק",
        p: [
          "בדף ״אני״ אפשר ללחוץ ״לצאת״ ולחזור אחר כך עם המפתח. ״למחוק אותי״ מוחק לתמיד את השם, הנקודות, התגים, היסטוריית הקריאה והמפתח. ההודעות שכתבת נשארות בשיחות, בלי השם שלך, תחת ״מישהו שעזב״.",
        ],
      },
      {
        h: "מקורות",
        items: [
          "הטקסטים: ספריא. הרישיון של כל גרסה מופיע מתחת לטקסט.",
          "לוויין: Esri, Maxar, Earthstar Geographics. תבליט: Mapzen ו־AWS Open Data.",
          "גופנים: Frank Ruhl Libre ו־Rubik (SIL Open Font License).",
        ],
      },
    ],
    updated: "עודכן בנובמבר 2026",
  },
  en: {
    title: "House rules & privacy",
    intro: "Ohel is a place to read the Bible, see where things happened and talk it through together. A few simple rules keep it good for everyone.",
    sections: [
      {
        h: "House rules",
        items: [
          "Honor people, argue with ideas.",
          "No curses, no slurs and no hate toward any person, people, faith or group.",
          "Everyone is welcome: Jews, Christians, Muslims, believers of every kind and people who don't believe at all. Share what your tradition says, and don't press others to believe like you.",
          "No ads, no selling, no spam.",
          "Keep it private: no phone numbers, addresses or personal details, yours or anyone else's.",
          "See something wrong? Tap the message, then ⚑ Report.",
        ],
      },
      {
        h: "How the tent stays kind",
        items: [
          "A filter catches curses and slurs in Hebrew and English before anyone sees them, and asks the writer to put it another way. Words from the Bible itself stay allowed.",
          "Doing it again brings warnings: after 3, a one-hour pause; after 6, a one-day pause; after 9, no more posting. Each clean week clears one warning.",
          "Three reports hide a message.",
          "The tent's team can hide messages, pause people and block them. A block also stops new sign-ups from the same internet connection for 30 days.",
        ],
      },
      {
        h: "What we keep",
        items: [
          "The name and color you chose, your points and badges, the chapters you read and places you explored, and your messages.",
          "Your key is kept only as a scrambled fingerprint: we can check it, but we can't read it.",
          "So that people who were blocked can't come straight back, we keep a scrambled fingerprint of your internet connection, not the address itself.",
        ],
      },
      {
        h: "What we don't",
        items: ["No email, no phone number, no password.", "No ads and no tracking cookies.", "Nothing is sold or handed to anyone."],
      },
      {
        h: "Who else is involved",
        items: [
          "Cloudflare hosts Ohel and counts visits (Cloudflare Web Analytics) without cookies and without following you around the web.",
          "Bible texts come from Sefaria through our server, so Sefaria doesn't see you.",
          "Map images load straight from Esri (satellite) and Amazon (terrain), so they see your internet address, like any website does.",
          "Your key, language and reading settings are saved in your own browser, so you don't have to sign in every time.",
        ],
      },
      {
        h: "Leaving",
        p: [
          "On the Me page, “Step out” signs you out and your key brings you back. “Delete me” removes your name, points, badges, reading history and key for good. Messages you wrote stay in the conversations without your name, shown as “Someone who left”.",
        ],
      },
      {
        h: "Sources",
        items: [
          "Texts: Sefaria. Each version's license appears under the text.",
          "Satellite: Esri, Maxar, Earthstar Geographics. Terrain: Mapzen and AWS Open Data.",
          "Fonts: Frank Ruhl Libre and Rubik (SIL Open Font License).",
        ],
      },
    ],
    updated: "Updated November 2026",
  },
};

export function About() {
  const { lang, go, t } = useApp();
  const page = PAGE[lang];
  useEffect(() => {
    document.title = `${page.title} · Ohel`;
  }, [page.title]);
  return (
    <div className="profile about">
      <section className="glass card about-head">
        <Logo size={56} animate />
        <h1 className="grad">{page.title}</h1>
        <p>{page.intro}</p>
      </section>
      {page.sections.map((s) => (
        <section key={s.h} className="glass card">
          <h2>{s.h}</h2>
          {s.p?.map((x) => <p key={x}>{x}</p>)}
          {s.items && (
            <ul className="about-list">
              {s.items.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <p className="fine center">{page.updated}</p>
      <button className="btn btn-glow center-link" onClick={() => go({ name: "home" })}>
        ⛺ {t("navRooms")}
      </button>
    </div>
  );
}
