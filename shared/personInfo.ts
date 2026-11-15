// The deep page of a person (content/people/<id>.json, built into public/data/people/<id>.json).
import type { PlaceImage } from "./placeInfo.ts";

type L = { he: string; en: string };

export interface PersonText {
  name: string;
  aka: string[]; // other names and how other traditions call them
  summary: string; // 2-3 sentences
  story: { title: string; text: string; refs: string[] }[]; // the life in 4-7 chapters, in order
  character: string; // who they were as a person, from the text
  traditions: { name: string; text: string }[]; // Jewish, Christian, Muslim memory, where it really exists
  history: string; // what history and archaeology can and can't say about them
}

export interface PersonInfo {
  id: string;
  he: PersonText;
  en: PersonText;
  era: L; // when, honestly ("by the biblical chronology...")
  places: { place: string; what: L }[]; // ids from shared/places.ts, in story order
  journey: string | null; // an id from shared/journeys.ts
  family: { person: string | null; name: L; relation: L }[];
  mentions: { ref: string; note: L }[];
  images: PlaceImage[];
  wiki: { he?: string; en?: string };
  related: string[]; // ids from shared/people.ts
  sources: { title: string; url: string }[];
}
