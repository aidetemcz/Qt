export interface Presentation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export type SlideAlign = "left" | "center" | "right";
export type SlideVAlign = "top" | "center" | "bottom";

export interface SlideConfig {
  heading: string;
  body: string;
  /** Font sizes in px on the 960-wide slide base (scaled to the frame). */
  headingSize?: number;
  bodySize?: number;
  /** Position of the text block within the slide. */
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
