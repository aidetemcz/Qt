import type { SlideConfig } from "@/lib/presentations";

/** Character limits so authored text stays within the slide frame. */
export const HEADING_MAX = 100;
export const BODY_MAX = 500;

/**
 * Canonical read-only rendering of a text slide. The editor mirrors these
 * classes so a slide looks the same while editing and while presenting.
 * The 16:9 frame clips overflow and long words wrap, so text can never
 * escape the slide.
 */
export default function SlideView({ config }: { config: SlideConfig }) {
  const empty = !config.heading && !config.body;
  return (
    <div className="flex aspect-video w-full flex-col overflow-hidden rounded-xl bg-white p-6 shadow-sm sm:p-8">
      {config.heading && (
        <h2 className="break-words text-3xl font-bold text-neutral-900">
          {config.heading}
        </h2>
      )}
      {config.body && (
        <p className="mt-4 whitespace-pre-wrap break-words text-lg text-neutral-700">
          {config.body}
        </p>
      )}
      {empty && <p className="text-lg text-neutral-400">Prázdný slide</p>}
    </div>
  );
}
