// People of the Hebrew Bible who have their own page (content/people/<id>.json), in the order the story meets them.

export type Era = "beginnings" | "ancestors" | "exodus" | "judges" | "kingdom" | "prophets" | "exile";

export interface Person {
  id: string;
  he: string;
  en: string;
  era: Era;
}

export const ERAS: Record<Era, { he: string; en: string }> = {
  beginnings: { he: "בראשית", en: "Beginnings" },
  ancestors: { he: "האבות והאמהות", en: "The ancestors" },
  exodus: { he: "יציאת מצרים והמדבר", en: "Exodus and the wilderness" },
  judges: { he: "תקופת השופטים", en: "The judges" },
  kingdom: { he: "המלכים", en: "The kings" },
  prophets: { he: "הנביאים", en: "The prophets" },
  exile: { he: "גלות ושיבה", en: "Exile and return" },
};

export const PEOPLE: Person[] = [
  { id: "noah", he: "נח", en: "Noah", era: "beginnings" },
  { id: "abraham", he: "אברהם", en: "Abraham", era: "ancestors" },
  { id: "sarah", he: "שרה", en: "Sarah", era: "ancestors" },
  { id: "isaac", he: "יצחק", en: "Isaac", era: "ancestors" },
  { id: "rebecca", he: "רבקה", en: "Rebecca", era: "ancestors" },
  { id: "jacob", he: "יעקב", en: "Jacob", era: "ancestors" },
  { id: "rachel", he: "רחל", en: "Rachel", era: "ancestors" },
  { id: "joseph", he: "יוסף", en: "Joseph", era: "ancestors" },
  { id: "moses", he: "משה", en: "Moses", era: "exodus" },
  { id: "aaron", he: "אהרן", en: "Aaron", era: "exodus" },
  { id: "miriam", he: "מרים", en: "Miriam", era: "exodus" },
  { id: "joshua", he: "יהושע", en: "Joshua", era: "exodus" },
  { id: "deborah", he: "דבורה", en: "Deborah", era: "judges" },
  { id: "gideon", he: "גדעון", en: "Gideon", era: "judges" },
  { id: "samson", he: "שמשון", en: "Samson", era: "judges" },
  { id: "ruth", he: "רות", en: "Ruth", era: "judges" },
  { id: "samuel", he: "שמואל", en: "Samuel", era: "kingdom" },
  { id: "saul", he: "שאול", en: "Saul", era: "kingdom" },
  { id: "jonathan", he: "יהונתן", en: "Jonathan", era: "kingdom" },
  { id: "david", he: "דוד", en: "David", era: "kingdom" },
  { id: "solomon", he: "שלמה", en: "Solomon", era: "kingdom" },
  { id: "elijah", he: "אליהו", en: "Elijah", era: "prophets" },
  { id: "elisha", he: "אלישע", en: "Elisha", era: "prophets" },
  { id: "hezekiah", he: "חזקיהו", en: "Hezekiah", era: "kingdom" },
  { id: "isaiah", he: "ישעיהו", en: "Isaiah", era: "prophets" },
  { id: "jonah", he: "יונה", en: "Jonah", era: "prophets" },
  { id: "jeremiah", he: "ירמיהו", en: "Jeremiah", era: "prophets" },
  { id: "ezekiel", he: "יחזקאל", en: "Ezekiel", era: "exile" },
  { id: "daniel", he: "דניאל", en: "Daniel", era: "exile" },
  { id: "esther", he: "אסתר", en: "Esther", era: "exile" },
  { id: "nehemiah", he: "נחמיה", en: "Nehemiah", era: "exile" },
];

export const findPerson = (id: string | null | undefined) => PEOPLE.find((p) => p.id === id) ?? null;
