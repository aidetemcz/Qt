export interface Presentation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export type SlideAlign = "left" | "center" | "right";
export type SlideVAlign = "top" | "center" | "bottom";

export type SlideElementKind = "heading" | "body";

/** A freely positioned text box on the slide, in the 960×540 base coordinate
 * system (scaled to whatever size the slide is rendered at). */
export interface SlideElement {
  id: string;
  kind: SlideElementKind;
  text: string;
  x: number;
  y: number;
  w: number;
  fontSize: number;
  /** Optional per-element styling set from the settings panel. */
  color?: string;
  bold?: boolean;
  textAlign?: SlideAlign;
}

export type SlideImageFit = "cover" | "contain";

export interface SlideImage {
  src: string;
  fit?: SlideImageFit;
}

/** One answer option of a quiz slide. */
export interface QuizAnswer {
  id: string;
  text: string;
  correct?: boolean;
}

/** Quiz slide content: one question with up to four answer options. */
export interface SlideQuiz {
  question: string;
  answers: QuizAnswer[];
}

/** Anketa: stejná otázka a možnosti jako kvíz, jen bez správné odpovědi. */
export type SlidePoll = SlideQuiz;

/** Word cloud: jen zadání, slova posílá publikum. */
export interface SlideWordCloud {
  question: string;
}

/** Otázky a odpovědi: zadání, na které se publikum ptá vlastními slovy. */
export type SlideQa = SlideWordCloud;

export interface SlideConfig {
  /** Freely positioned text boxes (current model). */
  elements?: SlideElement[];
  /** Quiz content; present only on quiz slides. */
  quiz?: SlideQuiz;
  /** Obsah ankety; jen na slidech typu anketa. */
  poll?: SlidePoll;
  /** Zadání word cloudu; jen na slidech tohoto typu. */
  wordcloud?: SlideWordCloud;
  /** Zadání pro otázky od publika; jen na slidech tohoto typu. */
  qa?: SlideQa;
  /** Slide background colour set from the settings panel. */
  background?: string;
  /** Full-bleed image behind the text boxes. */
  image?: SlideImage;
  /** Legacy single heading/body fields, kept for backward compatibility. */
  heading?: string;
  body?: string;
  headingSize?: number;
  bodySize?: number;
  align?: SlideAlign;
  valign?: SlideVAlign;
}

export interface Slide {
  id: string;
  presentation_id: string;
  position: number;
  type: string;
  config: SlideConfig;
}

/** Účastník připojený do session. Neregistrovaný, drží se jen přezdívkou. */
export interface Participant {
  id: string;
  session_id: string;
  nickname: string;
  created_at: string;
}

/** Text poslaný účastníkem — slovo do cloudu nebo otázka na Q&A slidu. */
export interface WordEntry {
  id: string;
  session_id: string;
  slide_id: string;
  participant_id: string;
  text: string;
  created_at: string;
}

/** Jeden hlas účastníka na kvízovém slidu. */
export interface Answer {
  id: string;
  session_id: string;
  slide_id: string;
  participant_id: string;
  /** id odpovědi z config.quiz.answers */
  answer_id: string;
  created_at: string;
}

export interface Session {
  id: string;
  presentation_id: string;
  code: string;
  current_position: number;
  is_active: boolean;
  created_at: string;
  /** Odkrytá správná odpověď u kvízu. Chybí, dokud neproběhne migrace. */
  reveal_answer?: boolean;
  /** Prezentace běží; dokud ne, je lobby. Chybí, dokud neproběhne migrace. */
  started?: boolean;
}
