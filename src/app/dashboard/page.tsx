import Link from "next/link";
import DashboardContent from "@/components/DashboardContent";
import Sidebar from "@/components/Sidebar";
import type { Presentation } from "@/lib/presentations";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Prezentace · Qt",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const select = "id, title, created_at, updated_at, slides(count)";
  type Row = Presentation & { slides: { count: number }[] };

  const [
    {
      data: { user },
    },
    listed,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("presentations")
      .select(select)
      // Co je v koši, se tu neukazuje — má vlastní stránku.
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .returns<Row[]>(),
  ]);

  // Dokud neproběhne migrace koše, sloupec chybí a dotaz spadne. Prezentace
  // se kvůli tomu nemají přestat ukazovat, tak se načtou bez filtru.
  const { data: presentations, error } = listed.error
    ? await supabase
        .from("presentations")
        .select(select)
        .order("updated_at", { ascending: false })
        .returns<Row[]>()
    : listed;

  // Jméno i odhlášení má profil; tady stačí iniciála jako vstup do něj.
  const displayName =
    (user?.user_metadata?.name as string | undefined) || user?.email || "";
  const initial = (displayName || "?").charAt(0).toLocaleUpperCase("cs");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-5 flex items-center justify-end">
            <Link
              href="/profile"
              title="Profil"
              aria-label="Profil"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-sm font-extrabold text-white shadow-sm transition-all duration-150 hover:shadow-card motion-safe:hover:-translate-y-0.5"
            >
              {initial}
            </Link>
          </div>
          {error && (
            <p className="mb-6 rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Prezentace se nepodařilo načíst: {error.message}
            </p>
          )}
          <DashboardContent
            presentations={(presentations ?? []).map(
              ({ slides, ...presentation }) => ({
                ...presentation,
                slideCount: slides[0]?.count ?? 0,
              }),
            )}
          />
        </div>
      </main>
    </div>
  );
}
