import type { SlideConfig, SlideElement } from "@/lib/presentations";

/** Character limits so authored text stays within the slide frame. */
export const HEADING_MAX = 120;
export const BODY_MAX = 800;

/** Font size bounds, in px on the 960×540 slide base. */
export const MIN_SIZE = 10;
export const MAX_SIZE = 300;
export const DEFAULT_HEADING_SIZE = 60;
export const DEFAULT_BODY_SIZE = 32;

export const SLIDE_W = 960;
export const SLIDE_H = 540;

/** px on the slide base → container-query width units. */
export function cqw(px: number): string {
  return `${((px * 100) / SLIDE_W).toFixed(4)}cqw`;
}
/** px on the slide base → container-query height units. */
export function cqh(px: number): string {
  return `${((px * 100) / SLIDE_H).toFixed(4)}cqh`;
}

/** Resolve a slide's text boxes, migrating the legacy heading/body fields. */
export function getElements(config: SlideConfig): SlideElement[] {
  if (config.elements && config.elements.length > 0) {
    return config.elements;
  }
  const elements: SlideElement[] = [];
  let y = 64;
  if (config.heading) {
    const fontSize = config.headingSize ?? DEFAULT_HEADING_SIZE;
    elements.push({
      id: "legacy-heading",
      kind: "heading",
      text: config.heading,
      x: 64,
      y,
      w: SLIDE_W - 128,
      fontSize,
    });
    y += fontSize + 28;
  }
  if (config.body) {
    elements.push({
      id: "legacy-body",
      kind: "body",
      text: config.body,
      x: 64,
      y,
      w: SLIDE_W - 128,
      fontSize: config.bodySize ?? DEFAULT_BODY_SIZE,
    });
  }
  return elements;
}

export function elementClass(kind: SlideElement["kind"]): string {
  return kind === "heading"
    ? "font-bold leading-tight text-neutral-900"
    : "leading-snug text-neutral-700";
}

/**
 * Canonical read-only rendering of a slide. Each text box is absolutely
 * positioned in a 16:9 query container, with position, width and font size in
 * container-query units so the slide scales identically wherever it is shown.
 * Long words wrap and overflow is clipped, so text can never escape the frame.
 */
export default function SlideView({ config }: { config: SlideConfig }) {
  const elements = getElements(config);
  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-white shadow-sm"
      style={{ containerType: "size" }}
    >
      {elements.length === 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center text-neutral-400"
          style={{ fontSize: cqw(28) }}
        >
          Prázdný slide
        </div>
      )}
      {elements.map((el) => (
        <div
          key={el.id}
          className={`absolute whitespace-pre-wrap break-words ${elementClass(el.kind)}`}
          style={{
            left: cqw(el.x),
            top: cqh(el.y),
            width: cqw(el.w),
            fontSize: cqw(el.fontSize),
          }}
        >
          {el.text}
        </div>
      ))}
    </div>
  );
}
