import Link from "next/link";
import {
  purgePresentation,
  restorePresentation,
} from "@/app/dashboard/actions";
import Sidebar from "@/components/Sidebar";
import type { Presentation } from "@/lib/presentations";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Koš · Qt",
};

type Deleted = Presentation & { deleted_at: string };

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TrashPage() {
  const supabase = await createClient();
  const { data: presentations } = await supabase
    .from("presentations")
    .select("id, title, created_at, updated_at, deleted_at")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })
    .returns<Deleted[]>();

  const list = presentations ?? [];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Koš</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                Smazané prezentace
              </h1>
            </div>
            <Link href="/dashboard" className="btn btn-secondary btn-sm">
              ← Prezentace
            </Link>
          </div>

          <p className="mt-4 text-sm text-muted">
            Smazané prezentace tu zůstávají, dokud je neodstraníš nadobro.
            Teprve pak zmizí i jejich relace a výsledky.
          </p>

          {list.length === 0 ? (
            <div className="card animate-fade-in mt-8 border-dashed p-10 text-center">
              <p className="text-sm text-muted">Koš je prázdný.</p>
            </div>
          ) : (
            <ul className="mt-8 flex flex-col gap-3">
              {list.map((presentation) => (
                <li
                  key={presentation.id}
                  className="card animate-fade-in flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {presentation.title}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Smazáno {formatWhen(presentation.deleted_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form
                      action={async () => {
                        "use server";
                        await restorePresentation(presentation.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="btn btn-secondary btn-sm"
                      >
                        Vrátit
                      </button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await purgePresentation(presentation.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="btn btn-secondary btn-sm hover:border-red-300 hover:text-danger"
                      >
                        Smazat nadobro
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
