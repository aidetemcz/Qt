"use client";

import {
  SLIDE_TYPE_GROUPS,
  SLIDE_TYPES,
  type SlideTypeDef,
} from "@/lib/slideTypes";

/**
 * Slide-type chooser shown on the working area (not inside the slide rail),
 * Kahoot style. It renders every entry from the SLIDE_TYPES registry, so new
 * types appear here automatically; unavailable ones stay visible but disabled.
 */
export default function SlideTypePicker({
  onPick,
  onClose,
}: {
  onPick: (type: SlideTypeDef) => void;
  onClose: () => void;
}) {
  return (
    <div className="animate-slide-up w-full max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Nový slide</p>
          <h2 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">
            Jaký typ slidu přidáš?
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary btn-sm"
        >
          Zavřít
        </button>
      </div>

      <div className="flex flex-col gap-7">
        {SLIDE_TYPE_GROUPS.map((group) => {
          const types = SLIDE_TYPES.filter((t) => t.group === group);
          if (types.length === 0) return null;
          return (
            <section key={group}>
              <h3 className="mb-3 text-xs font-bold tracking-[0.14em] text-muted uppercase">
                {group}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {types.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    disabled={!type.available}
                    title={type.available ? undefined : "Připravujeme"}
                    onClick={() => onPick(type)}
                    className={`card flex flex-col items-start gap-3 p-4 text-left ${
                      type.available
                        ? "card-interactive cursor-pointer"
                        : "cursor-not-allowed opacity-55"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-bold ${
                        type.available
                          ? "bg-brand text-white"
                          : "bg-sunken text-muted"
                      }`}
                      aria-hidden
                    >
                      {type.glyph}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-ink">
                        {type.label}
                      </span>
                      <span className="text-xs leading-snug text-muted">
                        {type.description}
                      </span>
                    </span>
                    {!type.available && (
                      <span className="rounded-full bg-sunken px-2 py-0.5 text-[0.625rem] font-bold tracking-wide text-muted uppercase">
                        Připravujeme
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
