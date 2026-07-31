import type { SlideAlign, SlideConfig, SlideVAlign } from "@/lib/presentations";

/** Character limits so authored text stays within the slide frame. */
export const HEADING_MAX = 100;
export const BODY_MAX = 500;

/** Font size bounds, in px on the 960-wide slide base. */
export const MIN_SIZE = 12;
export const MAX_SIZE = 120;
export const DEFAULT_HEADING_SIZE = 48;
export const DEFAULT_BODY_SIZE = 28;

export const DEFAULT_ALIGN: SlideAlign = "left";
export const DEFAULT_VALIGN: SlideVAlign = "top";

const SLIDE_BASE_WIDTH = 960;

/** Convert a px measurement on the slide base into container-query width units,
 * so the slide scales identically whatever size it is rendered at. */
export function cqw(px: number): string {
  return `${((px * 100) / SLIDE_BASE_WIDTH).toFixed(3)}cqw`;
}

const vAlignClass: Record<SlideVAlign, string> = {
  top: "justify-start",
  center: "justify-center",
  bottom: "justify-end",
};

const textAlignClass: Record<SlideAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/**
 * Canonical read-only rendering of a text slide. The editor previews with the
 * same component, so a slide looks the same while editing and while
 * presenting. The 16:9 frame is a query container: font sizes, padding and
 * gaps are expressed in cqw so everything scales with the frame; long words
 * wrap and overflow is clipped, so text can never escape the slide.
 */
export default function SlideView({ config }: { config: SlideConfig }) {
  const empty = !config.heading && !config.body;
  const align = config.align ?? DEFAULT_ALIGN;
  const valign = config.valign ?? DEFAULT_VALIGN;
  const headingSize = config.headingSize ?? DEFAULT_HEADING_SIZE;
  const bodySize = config.bodySize ?? DEFAULT_BODY_SIZE;

  return (
    <div
      className={`@container relative flex aspect-video w-full overflow-hidden rounded-xl bg-white shadow-sm ${vAlignClass[valign]}`}
      style={{ padding: cqw(48), containerType: "inline-size" }}
    >
      {empty ? (
        <div className="m-auto text-neutral-400" style={{ fontSize: cqw(28) }}>
          Prázdný slide
        </div>
      ) : (
        <div
          className={`flex w-full flex-col ${textAlignClass[align]}`}
          style={{ gap: cqw(20) }}
        >
          {config.heading && (
            <div
              className="w-full whitespace-pre-wrap break-words font-bold leading-tight text-neutral-900"
              style={{ fontSize: cqw(headingSize) }}
            >
              {config.heading}
            </div>
          )}
          {config.body && (
            <div
              className="w-full whitespace-pre-wrap break-words leading-snug text-neutral-700"
              style={{ fontSize: cqw(bodySize) }}
            >
              {config.body}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
