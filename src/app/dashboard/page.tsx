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
          <section className="animate-fade-in relative overflow-hidden rounded-panel bg-gradient-to-br from-brand via-brand/85 to-accent px-6 py-12 text-center shadow-card sm:py-16">
            <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <h1 className="relative text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
              What will you present today?
            </h1>
            <div className="relative mx-auto mt-7 max-w-lg">
              <input
                type="text"
                disabled
                placeholder="Search your projects (coming soon)"
                className="w-full cursor-not-allowed rounded-full border-0 bg-surface/95 px-5 py-3 text-sm text-muted shadow-card placeholder:text-neutral-400"
              />
            </div>
          </section>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {quickCreate.map((item) => (
              <button
                key={item}
                type="button"
                disabled
                title="Coming soon"
                className="cursor-not-allowed rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted shadow-sm"
              >
                + {item}
              </button>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
              Recent projects
            </h2>
            <NewPresentationButton />
          </div>

          {error ? (
            <p className="mt-6 rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Failed to load presentations: {error.message}
            </p>
          ) : presentations && presentations.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {presentations.map(({ slides, ...presentation }) => (
                <PresentationCard
                  key={presentation.id}
                  presentation={presentation}
                  slideCount={slides[0]?.count ?? 0}
                />
              ))}
            </div>
          ) : (
            <div className="card animate-fade-in mt-6 border-dashed p-10 text-center">
              <p className="text-sm text-muted">
                No presentations yet. Create your first one!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
