import type { SlideConfig } from "@/lib/presentations";

/**
 * Registry of slide types offered in the editor.
 *
 * Adding a new type is a single entry here: give it an id (stored in
 * `slides.type`), a label, a group for the picker, a starting config and
 * flip `available` once its editor exists.
 */
// Slidy se dělí jen na to, jestli publikum jen kouká, nebo taky odpovídá.
export type SlideTypeGroup = "Obsah" | "Interaktivní";

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
    group: "Interaktivní",
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
    group: "Interaktivní",
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
    id: "scale",
    label: "Škála",
    description: "Publikum volí číslo na stupnici",
    group: "Interaktivní",
    glyph: "▥",
    available: true,
    initialConfig: {
      scale: {
        question: "",
        min: 1,
        max: 5,
        minLabel: "Vůbec",
        maxLabel: "Naprosto",
      },
    },
  },
  {
    id: "poll",
    label: "Anketa",
    description: "Hlasování o jedné i více možnostech",
    group: "Interaktivní",
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
    group: "Interaktivní",
    glyph: "❋",
    available: true,
    initialConfig: { wordcloud: { question: "" } },
  },
  {
    id: "qa",
    label: "Otázky a odpovědi",
    description: "Publikum se ptá, ty odpovídáš",
    group: "Interaktivní",
    glyph: "?",
    available: true,
    initialConfig: { qa: { question: "" } },
  },
];

export const SLIDE_TYPE_GROUPS: SlideTypeGroup[] = ["Obsah", "Interaktivní"];

/** Slidy uložené pod dřívějším samostatným typem "image" jsou textové slidy. */
const LEGACY_TYPE_ALIASES: Record<string, string> = { image: "text" };

/**
 * Nabídka rychlého založení na hlavní stránce a v dashboardu. Klik založí
 * prezentaci rovnou s prvním slidem daného typu.
 */
export const QUICK_CREATE: { id: string; label: string }[] = [
  { id: "text", label: "Prezentace" },
  { id: "quiz", label: "Kvíz" },
  { id: "poll", label: "Anketa" },
  { id: "scale", label: "Škála" },
  { id: "wordcloud", label: "Word cloud" },
  { id: "qa", label: "Otázky a odpovědi" },
];

export function slideTypeById(id: string): SlideTypeDef | undefined {
  return SLIDE_TYPES.find((t) => t.id === (LEGACY_TYPE_ALIASES[id] ?? id));
}
