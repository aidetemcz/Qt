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
}

export interface SlideConfig {
  /** Freely positioned text boxes (current model). */
  elements?: SlideElement[];
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

export interface Session {
  id: string;
  presentation_id: string;
  code: string;
  current_position: number;
  is_active: boolean;
  created_at: string;
}
