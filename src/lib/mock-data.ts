export interface Presentation {
  id: string;
  title: string;
  slideCount: number;
  lastEdited: string; // ISO date string
  /** Tailwind gradient classes for the card thumbnail placeholder */
  thumbnail: string;
}

export const mockPresentations: Presentation[] = [
  {
    id: "1",
    title: "Team retro: Q2 highlights",
    slideCount: 12,
    lastEdited: "2026-07-03",
    thumbnail: "from-brand to-accent",
  },
  {
    id: "2",
    title: "Onboarding quiz for new hires",
    slideCount: 8,
    lastEdited: "2026-06-28",
    thumbnail: "from-accent to-accent-dark",
  },
  {
    id: "3",
    title: "Product roadmap check-in",
    slideCount: 15,
    lastEdited: "2026-06-20",
    thumbnail: "from-brand-dark to-brand",
  },
  {
    id: "4",
    title: "Friday trivia night",
    slideCount: 20,
    lastEdited: "2026-06-13",
    thumbnail: "from-accent-dark to-brand",
  },
];
