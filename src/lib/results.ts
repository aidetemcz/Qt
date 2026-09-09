import type {
  Answer,
  Participant,
  Slide,
  WordEntry,
} from "@/lib/presentations";
import {
  getInteraction,
  scaleAverage,
  scaleValues,
} from "@/components/slide/SlideView";

/** Jeden řádek výsledků: možnost a kolik pro ni bylo hlasů. */
export interface ResultRow {
  label: string;
  count: number;
  correct?: boolean;
}

/** Výsledky jednoho slidu, připravené k vypsání i k exportu. */
export interface SlideResult {
  slideId: string;
  position: number;
  kind: "quiz" | "poll" | "scale" | "wordcloud" | "qa" | "text";
  question: string;
  /** Kolik účastníků na slide odpovědělo. */
  responders: number;
  rows: ResultRow[];
  /** Průměr u škály. */
  average: number | null;
  /** Volné texty u word cloudu a otázek. */
  texts: string[];
}

/** Rozpad hlasu na jednotlivé volby — anketa s víc odpověďmi má "a,c". */
function votedIds(answer: Answer): string[] {
  return answer.answer_id.split(",").filter(Boolean);
}

/**
 * Spočítá výsledky ke každému slidu. Pořadí i pojmenování drží stejné jako
 * prezentace, ať se výpis i tabulka dají porovnat s tím, co viděla místnost.
 */
export function buildResults(
  slides: Slide[],
  answers: Answer[],
  words: WordEntry[],
): SlideResult[] {
  return slides.map((slide) => {
    const slideAnswers = answers.filter((a) => a.slide_id === slide.id);
    const slideWords = words.filter((w) => w.slide_id === slide.id);
    const counts = new Map<string, number>();
    for (const answer of slideAnswers) {
      for (const id of votedIds(answer)) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }

    const interaction = getInteraction(slide.config);
    if (interaction) {
      return {
        slideId: slide.id,
        position: slide.position,
        kind: interaction.kind,
        question: interaction.question,
        responders: slideAnswers.length,
        rows: (interaction.answers ?? [])
          .filter((answer) => answer.text.trim())
          .map((answer) => ({
            label: answer.text,
            count: counts.get(answer.id) ?? 0,
            correct: interaction.kind === "quiz" ? !!answer.correct : undefined,
          })),
        average: null,
        texts: [],
      };
    }

    if (slide.config.scale) {
      const scale = slide.config.scale;
      const plain: Record<string, number> = {};
      for (const [id, count] of counts) {
        plain[id] = count;
      }
      return {
        slideId: slide.id,
        position: slide.position,
        kind: "scale",
        question: scale.question,
        responders: slideAnswers.length,
        rows: scaleValues(scale).map((value) => ({
          label: String(value),
          count: counts.get(String(value)) ?? 0,
        })),
        average: scaleAverage(scale, plain),
        texts: [],
      };
    }

    if (slide.config.wordcloud || slide.config.qa) {
      const isCloud = !!slide.config.wordcloud;
      const question =
        (isCloud ? slide.config.wordcloud : slide.config.qa)?.question ?? "";
      if (isCloud) {
        // Slova se sčítají bez ohledu na velikost písmen, stejně jako v oblaku.
        const byWord = new Map<string, number>();
        for (const entry of slideWords) {
          const key = entry.text.toLocaleLowerCase("cs");
          byWord.set(key, (byWord.get(key) ?? 0) + 1);
        }
        return {
          slideId: slide.id,
          position: slide.position,
          kind: "wordcloud",
          question,
          responders: new Set(slideWords.map((w) => w.participant_id)).size,
          rows: [...byWord]
            .map(([label, count]) => ({ label, count }))
            .sort(
              (a, b) =>
                b.count - a.count || a.label.localeCompare(b.label, "cs"),
            ),
          average: null,
          texts: [],
        };
      }
      return {
        slideId: slide.id,
        position: slide.position,
        kind: "qa",
        question,
        responders: new Set(slideWords.map((w) => w.participant_id)).size,
        rows: [],
        average: null,
        texts: slideWords
          .slice()
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((entry) => entry.text),
      };
    }

    return {
      slideId: slide.id,
      position: slide.position,
      kind: "text",
      question: "",
      responders: 0,
      rows: [],
      average: null,
      texts: [],
    };
  });
}

/** Popisek typu slidu pro výpis a export. */
export const RESULT_KIND_LABELS: Record<SlideResult["kind"], string> = {
  quiz: "Kvíz",
  poll: "Anketa",
  scale: "Škála",
  wordcloud: "Word cloud",
  qa: "Otázky a odpovědi",
  text: "Text",
};

function csvCell(value: string | number): string {
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Tabulka pro Excel. Oddělovačem je středník a na začátku je BOM, protože
 * jinak Excel v češtině rozhodí diakritiku i sloupce.
 */
export function resultsToCsv(
  results: SlideResult[],
  participants: Participant[],
): string {
  const rows: (string | number)[][] = [
    ["Slide", "Typ", "Otázka", "Odpověď", "Hlasů", "Správně"],
  ];

  for (const result of results) {
    if (result.kind === "text") {
      continue;
    }
    if (result.rows.length === 0 && result.texts.length === 0) {
      rows.push([
        result.position,
        RESULT_KIND_LABELS[result.kind],
        result.question,
        "",
        0,
        "",
      ]);
      continue;
    }
    for (const row of result.rows) {
      rows.push([
        result.position,
        RESULT_KIND_LABELS[result.kind],
        result.question,
        row.label,
        row.count,
        row.correct === undefined ? "" : row.correct ? "ano" : "ne",
      ]);
    }
    for (const text of result.texts) {
      rows.push([
        result.position,
        RESULT_KIND_LABELS[result.kind],
        result.question,
        text,
        1,
        "",
      ]);
    }
    if (result.average !== null) {
      rows.push([
        result.position,
        RESULT_KIND_LABELS[result.kind],
        result.question,
        "Průměr",
        result.average.toFixed(2),
        "",
      ]);
    }
  }

  rows.push([]);
  rows.push(["Účastníci", participants.length]);
  for (const participant of participants) {
    rows.push([participant.nickname]);
  }

  return `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
}
