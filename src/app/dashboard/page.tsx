import { signOut } from "@/app/auth/actions";
import NewPresentationButton from "@/components/NewPresentationButton";
import PresentationCard from "@/components/PresentationCard";
import Sidebar from "@/components/Sidebar";
import type { Presentation } from "@/lib/presentations";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Projects · Qt",
};

const quickCreate = ["Presentation", "Quiz", "Live poll", "Word cloud"];

export default async function DashboardPage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { data: presentations, error },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("presentations")
      .select("id, title, created_at, updated_at, slides(count)")
      .order("updated_at", { ascending: false })
      .returns<(Presentation & { slides: { count: number }[] })[]>(),
  ]);
  const displayName =
    (user?.user_metadata?.name as string | undefined) || user?.email || "";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-5 flex items-center justify-end gap-3">
            <span className="text-sm font-medium text-muted">{displayName}</span>
            <form action={signOut}>
              <button type="submit" className="btn btn-secondary btn-sm">
                Odhlásit
              </button>
            </form>
          </div>
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
            <NewPresentationButton />
          </div>

          {error ? (
            <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Failed to load presentations: {error.message}
            </p>
          ) : presentations && presentations.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {presentations.map(({ slides, ...presentation }) => (
                <PresentationCard
                  key={presentation.id}
                  presentation={presentation}
                  slideCount={slides[0]?.count ?? 0}
                />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-neutral-500">
              No presentations yet. Create your first one!
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
