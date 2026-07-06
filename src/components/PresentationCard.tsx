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
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">{presentation.title}</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {presentation.slideCount} slides · Last edited{" "}
          {formatDate(presentation.lastEdited)}
        </p>
      </div>
      <div>
        <button
          type="button"
          disabled
          title="Editing is coming soon"
          className="cursor-not-allowed rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-400"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
