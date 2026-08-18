import type { SlideConfig } from "@/lib/presentations";

/**
 * Registry of slide types offered in the editor.
 *
 * Adding a new type is a single entry here: give it an id (stored in
 * `slides.type`), a label, a group for the picker, a starting config and
 * flip `available` once its editor exists.
 */
export type SlideTypeGroup = "Obsah" | "Interakce" | "Kvíz";

export interface SlideTypeDef {
  id: string;
  label: string;
  description: string;
  group: SlideTypeGroup;
  /** Simple glyph used as the picker tile artwork. */
  glyph: string;
  available: boolean;
  initialConfig: SlideConfig;
}

export const SLIDE_TYPES: SlideTypeDef[] = [
  {
    id: "text",
    label: "Text",
    description: "Nadpis a text kdekoli na slidu",
    group: "Obsah",
    glyph: "T",
    available: true,
    initialConfig: { elements: [] },
  },
  {
    id: "image",
    label: "Obrázek",
    description: "Obrázek přes celý slide",
    group: "Obsah",
    glyph: "▣",
    available: false,
    initialConfig: { elements: [] },
  },
  {
    id: "quiz",
    label: "Kvíz",
    description: "Otázka se čtyřmi odpověďmi",
    group: "Kvíz",
    glyph: "◆",
    available: false,
    initialConfig: { elements: [] },
  },
  {
    id: "truefalse",
    label: "Pravda / Lež",
    description: "Dvě možnosti, rychlé hlasování",
    group: "Kvíz",
    glyph: "◑",
    available: false,
    initialConfig: { elements: [] },
  },
  {
    id: "poll",
    label: "Anketa",
    description: "Hlasování bez správné odpovědi",
    group: "Interakce",
    glyph: "▤",
    available: false,
    initialConfig: { elements: [] },
  },
  {
    id: "wordcloud",
    label: "Word cloud",
    description: "Slova od publika v oblaku",
    group: "Interakce",
    glyph: "❋",
    available: false,
    initialConfig: { elements: [] },
  },
  {
    id: "qa",
    label: "Otázky a odpovědi",
    description: "Publikum se ptá, ty odpovídáš",
    group: "Interakce",
    glyph: "?",
    available: false,
    initialConfig: { elements: [] },
  },
];

export const SLIDE_TYPE_GROUPS: SlideTypeGroup[] = [
  "Obsah",
  "Kvíz",
  "Interakce",
];

export function slideTypeById(id: string): SlideTypeDef | undefined {
  return SLIDE_TYPES.find((t) => t.id === id);
}
