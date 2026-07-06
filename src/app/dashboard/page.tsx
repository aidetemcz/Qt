import PresentationCard from "@/components/PresentationCard";
import Sidebar from "@/components/Sidebar";
import { mockPresentations } from "@/lib/mock-data";

export const metadata = {
  title: "Projects · Q&Q",
};

const quickCreate = ["Presentation", "Quiz", "Live poll", "Word cloud"];

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-5xl">
          <section className="rounded-2xl bg-gradient-to-r from-brand via-brand/80 to-accent px-6 py-10 text-center sm:py-14">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              What will you present today?
            </h1>
            <div className="mx-auto mt-6 max-w-lg">
              <input
                type="text"
                disabled
                placeholder="Search your projects (coming soon)"
                className="w-full cursor-not-allowed rounded-full border-0 bg-white px-5 py-3 text-sm text-neutral-500 shadow-md placeholder:text-neutral-400"
              />
            </div>
          </section>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {quickCreate.map((item) => (
              <button
                key={item}
                type="button"
                disabled
                title="Coming soon"
                className="cursor-not-allowed rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-500 shadow-sm"
              >
                + {item}
              </button>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight">
              Recent projects
            </h2>
            <button
              type="button"
              disabled
              title="Creating presentations is coming soon"
              className="cursor-not-allowed rounded-lg bg-brand/50 px-5 py-2.5 text-sm font-medium text-white"
            >
              New presentation
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mockPresentations.map((presentation) => (
              <PresentationCard
                key={presentation.id}
                presentation={presentation}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
