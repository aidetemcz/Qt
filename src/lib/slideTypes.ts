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
    // Obrázek není samostatný typ: každý textový slide může mít obrázek na
    // pozadí, nastavuje se v panelu vpravo.
    id: "text",
    label: "Text",
    description: "Nadpis, text a obrázek kdekoli na slidu",
    group: "Obsah",
    glyph: "T",
    available: true,
    initialConfig: { elements: [] },
  },
  {
    id: "quiz",
    label: "Kvíz",
    description: "Otázka se čtyřmi odpověďmi",
    group: "Kvíz",
    glyph: "◆",
    available: true,
    initialConfig: {
      quiz: {
        question: "",
        answers: [
          { id: "a", text: "" },
          { id: "b", text: "" },
          { id: "c", text: "" },
          { id: "d", text: "" },
        ],
      },
    },
  },
  {
    id: "truefalse",
    label: "Pravda / Lež",
    description: "Tvrzení a dvě možnosti",
    group: "Kvíz",
    glyph: "◑",
    available: true,
    // Kvíz s pevnými možnostmi; autor jen vybere, která platí.
    initialConfig: {
      quiz: {
        question: "",
        answers: [
          { id: "a", text: "Pravda" },
          { id: "b", text: "Lež" },
        ],
      },
    },
  },
  {
    id: "poll",
    label: "Anketa",
    description: "Hlasování bez správné odpovědi",
    group: "Interakce",
    glyph: "▤",
    available: true,
    initialConfig: {
      poll: {
        question: "",
        answers: [
          { id: "a", text: "" },
          { id: "b", text: "" },
          { id: "c", text: "" },
          { id: "d", text: "" },
        ],
      },
    },
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

/** Slidy uložené pod dřívějším samostatným typem "image" jsou textové slidy. */
const LEGACY_TYPE_ALIASES: Record<string, string> = { image: "text" };

export function slideTypeById(id: string): SlideTypeDef | undefined {
  return SLIDE_TYPES.find((t) => t.id === (LEGACY_TYPE_ALIASES[id] ?? id));
}
