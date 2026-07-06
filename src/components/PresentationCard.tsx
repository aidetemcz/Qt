import type { Presentation } from "@/lib/mock-data";

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function PresentationCard({
  presentation,
}: {
  presentation: Presentation;
}) {
  return (
    <div className="group overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div
        className={`flex aspect-video items-center justify-center bg-gradient-to-br ${presentation.thumbnail}`}
      >
        <span className="text-4xl font-extrabold text-white/80">
          {presentation.title.charAt(0)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">
            {presentation.title}
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            {presentation.slideCount} slides · {formatDate(presentation.lastEdited)}
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Editing is coming soon"
          className="shrink-0 cursor-not-allowed rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-400"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
