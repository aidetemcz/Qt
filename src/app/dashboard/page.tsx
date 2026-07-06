import Link from "next/link";
import PresentationCard from "@/components/PresentationCard";
import { mockPresentations } from "@/lib/mock-data";

export const metadata = {
  title: "Projects · Q&Q",
};

export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-12">
      <div className="mb-4">
        <Link
          href="/"
          className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          &larr; Back to home
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <button
          type="button"
          disabled
          title="Creating presentations is coming soon"
          className="cursor-not-allowed rounded-lg bg-neutral-300 px-5 py-2.5 text-sm font-medium text-white"
        >
          New presentation
        </button>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {mockPresentations.map((presentation) => (
          <PresentationCard
            key={presentation.id}
            presentation={presentation}
          />
        ))}
      </div>
    </main>
  );
}
