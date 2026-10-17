import type { SlideConfig } from "@/lib/presentations";
import {
  DEFAULT_BODY_SIZE,
  DEFAULT_HEADING_SIZE,
  SLIDE_W,
} from "@/components/slide/SlideView";

/** Jeden slide šablony: typ do `slides.type` a jeho obsah. */
export interface TemplateSlide {
  type: string;
  config: SlideConfig;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  /** Kolik slidů šablona přinese — ukazuje se na kartě. */
  glyph: string;
  slides: TemplateSlide[];
}

/** Titulní slide: nadpis a podtitul na stejných místech jako v editoru. */
function titleSlide(heading: string, body: string): TemplateSlide {
  return {
    type: "text",
    config: {
      background: "#fbf6f2",
      elements: [
        {
          id: "heading",
          kind: "heading",
          text: heading,
          x: 96,
          y: 170,
          w: SLIDE_W - 192,
          fontSize: DEFAULT_HEADING_SIZE,
          textAlign: "center",
        },
        {
          id: "body",
          kind: "body",
          text: body,
          x: 96,
          y: 270,
          w: SLIDE_W - 192,
          fontSize: DEFAULT_BODY_SIZE,
          textAlign: "center",
        },
      ],
    },
  };
}

function textSlide(heading: string, body: string): TemplateSlide {
  return {
    type: "text",
    config: {
      elements: [
        {
          id: "heading",
          kind: "heading",
          text: heading,
          x: 80,
          y: 80,
          w: SLIDE_W - 160,
          fontSize: 52,
        },
        {
          id: "body",
          kind: "body",
          text: body,
          x: 80,
          y: 190,
          w: 520,
          fontSize: DEFAULT_BODY_SIZE,
        },
      ],
    },
  };
}

function quizSlide(question: string, answers: string[], correct: number) {
  return {
    type: "quiz",
    config: {
      quiz: {
        question,
        answers: answers.map((text, index) => ({
          id: "abcdef"[index],
          text,
          ...(index === correct ? { correct: true } : {}),
        })),
      },
    },
  } satisfies TemplateSlide;
}

function pollSlide(question: string, answers: string[], multi = false) {
  return {
    type: "poll",
    config: {
      poll: {
        question,
        multi,
        answers: answers.map((text, index) => ({ id: "abcdef"[index], text })),
      },
    },
  } satisfies TemplateSlide;
}

function scaleSlide(
  question: string,
  minLabel: string,
  maxLabel: string,
  max = 5,
): TemplateSlide {
  return {
    type: "scale",
    config: { scale: { question, min: 1, max, minLabel, maxLabel } },
  };
}

/**
 * Hotové prezentace k rozjetí. Jsou schválně krátké — šablona má ušetřit
 * zakládání slidů, ne vnutit cizí obsah, takže všechny texty jdou přepsat.
 */
export const TEMPLATES: Template[] = [
  {
    id: "skoleni",
    title: "Školení",
    description: "Úvod, zjištění očekávání, průběžný kvíz a zpětná vazba",
    glyph: "🎓",
    slides: [
      titleSlide("Název školení", "Tvoje jméno · datum"),
      pollSlide("Co od dneška čekáš nejvíc?", [
        "Praktické ukázky",
        "Teoretický základ",
        "Prostor na dotazy",
        "Sdílení zkušeností",
      ]),
      textSlide("Program", "1. …\n2. …\n3. …"),
      quizSlide(
        "Kontrolní otázka z první části",
        ["Možnost A", "Možnost B", "Možnost C", "Možnost D"],
        0,
      ),
      { type: "qa", config: { qa: { question: "Na co se chcete zeptat?" } } },
      scaleSlide("Jak užitečné to pro tebe bylo?", "Vůbec", "Hodně"),
    ],
  },
  {
    id: "zpetna-vazba",
    title: "Zpětná vazba",
    description: "Krátký blok škál a otevřených otázek na konec akce",
    glyph: "📈",
    slides: [
      titleSlide("Jak to dnes šlo?", "Pár otázek na závěr"),
      scaleSlide("Jak hodnotíš dnešek celkově?", "Slabé", "Skvělé"),
      scaleSlide("Bylo tempo akorát?", "Moc pomalé", "Moc rychlé"),
      {
        type: "wordcloud",
        config: { wordcloud: { question: "Jedním slovem: co si odnášíš?" } },
      },
      {
        type: "qa",
        config: { qa: { question: "Co bychom měli příště změnit?" } },
      },
    ],
  },
  {
    id: "kviz",
    title: "Kvízová hra",
    description: "Pět otázek a pravda/lež na rozehřátí nebo opakování",
    glyph: "🏆",
    slides: [
      titleSlide("Kvíz", "Připoj se a hraj"),
      quizSlide("1. otázka", ["Odpověď A", "Odpověď B", "Odpověď C"], 0),
      quizSlide("2. otázka", ["Odpověď A", "Odpověď B", "Odpověď C"], 1),
      {
        type: "truefalse",
        config: {
          quiz: {
            question: "Tvrzení, které platí nebo neplatí",
            answers: [
              { id: "a", text: "Pravda", correct: true },
              { id: "b", text: "Lež" },
            ],
          },
        },
      },
      quizSlide("3. otázka", ["Odpověď A", "Odpověď B", "Odpověď C"], 2),
      titleSlide("Díky za hru!", "Výsledky najdeš v přehledu"),
    ],
  },
  {
    id: "icebreaker",
    title: "Icebreaker",
    description: "Rozehřátí na začátku: kdo tu je a v jaké náladě",
    glyph: "👋",
    slides: [
      titleSlide("Než začneme", "Pojďme se poznat"),
      {
        type: "wordcloud",
        config: { wordcloud: { question: "Jedním slovem: jak se dnes máš?" } },
      },
      pollSlide("Odkud se díváš?", [
        "Z kanceláře",
        "Z domova",
        "Z cesty",
        "Odjinud",
      ]),
      pollSlide("Co tě zajímá?", ["Novinky", "Praxe", "Čísla", "Plány"], true),
    ],
  },
  {
    id: "prazdna",
    title: "Prázdná prezentace",
    description: "Jen titulní slide, zbytek si poskládáš podle sebe",
    glyph: "📄",
    slides: [titleSlide("Název prezentace", "Podtitul")],
  },
];

export function templateById(id: string): Template | undefined {
  return TEMPLATES.find((template) => template.id === id);
}
