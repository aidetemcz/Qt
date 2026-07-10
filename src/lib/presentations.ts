export interface Presentation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface SlideConfig {
  heading: string;
  body: string;
}

export interface Slide {
  id: string;
  presentation_id: string;
  position: number;
  type: string;
  config: SlideConfig;
}
