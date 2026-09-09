import Link from "next/link";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import type {
  Answer,
  Participant,
  Presentation,
  Session,
  Slide,
  WordEntry,
} from "@/lib/presentations";
import { buildResults, RESULT_KIND_LABELS } from "@/lib/results";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Výsledky · Qt",
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { id } = await params;
  const { session: selectedId } = await searchParams;
  const supabase = await createClient();

  const [{ data: presentation }, { data: sessions }] = await Promise.all([
    supabase
      .from("presentations")
      .select("id, title, created_at, updated_at")
      .eq("id", id)
      .maybeSingle<Presentation>(),
    supabase
      .from("sessions")
      .select("*")
      .eq("presentation_id", id)
      .order("created_at", { ascending: false })
      .returns<Session[]>(),
  ]);

  if (!presentation) {
    notFound();
  }

  const list = sessions ?? [];
  const current = selectedId
    ? list.find((session) => session.id === selectedId)
    : list[0];

  // Podrobnosti se načítají jen k vybrané relaci.
  let results: ReturnType<typeof buildResults> = [];
  let participants: Participant[] = [];
  if (current) {
    const [
      { data: slides },
      { data: answers },
      { data: words },
      { data: people },
    ] = await Promise.all([
      supabase
        .from("slides")
        .select("id, presentation_id, position, type, config")
        .eq("presentation_id", id)
        .order("position", { ascending: true })
        .returns<Slide[]>(),
      supabase
        .from("answers")
        .select("*")
        .eq("session_id", current.id)
        .returns<Answer[]>(),
      supabase
        .from("words")
        .select("*")
        .eq("session_id", current.id)
        .returns<WordEntry[]>(),
      supabase
        .from("participants")
        .select("*")
        .eq("session_id", current.id)
        .order("created_at", { ascending: true })
        .returns<Participant[]>(),
    ]);
    results = buildResults(slides ?? [], answers ?? [], words ?? []);
    participants = people ?? [];
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow">Výsledky</p>
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                {presentation.title}
              </h1>
            </div>
            <Link href="/dashboard" className="btn btn-secondary btn-sm">
              ← Prezentace
            </Link>
          </div>

          {list.length === 0 ? (
            <div className="card animate-fade-in mt-8 border-dashed p-10 text-center">
              <p className="text-sm text-muted">
                Tuhle prezentaci jsi ještě nepromítala. Výsledky se objeví po
                prvním spuštění.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap gap-2">
                {list.map((session) => {
                  const active = session.id === current?.id;
                  return (
                    <Link
                      key={session.id}
                      href={`/results/${id}?session=${session.id}`}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors duration-150 ${
                        active
                          ? "border-brand bg-brand-50 font-semibold text-brand"
                          : "border-border bg-surface text-muted hover:border-brand/40"
                      }`}
                    >
                      {formatWhen(session.created_at)}
                      <span className="ml-2 font-mono text-xs opacity-70">
                        {session.code}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {current && (
                <>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted">
                      {participants.length}{" "}
                      {participants.length === 1
                        ? "účastník"
                        : participants.length < 5
                          ? "účastníci"
                          : "účastníků"}
                      {current.is_active && " · relace ještě běží"}
                    </p>
                    <a
                      href={`/api/results/${current.id}/csv`}
                      className="btn btn-primary btn-sm"
                    >
                      Stáhnout tabulku (CSV)
                    </a>
                  </div>

                  <div className="mt-6 flex flex-col gap-4">
                    {results
                      .filter((result) => result.kind !== "text")
                      .map((result) => {
                        const top = result.rows.reduce(
                          (best, row) => Math.max(best, row.count),
                          0,
                        );
                        return (
                          <section
                            key={result.slideId}
                            className="card animate-fade-in p-5"
                          >
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <h2 className="text-base font-bold text-ink">
                                {result.position}.{" "}
                                {result.question || "Bez zadání"}
                              </h2>
                              <p className="text-xs text-muted">
                                {RESULT_KIND_LABELS[result.kind]} ·{" "}
                                {result.responders} odpovědí
                                {result.average !== null &&
                                  ` · průměr ${result.average
                                    .toFixed(1)
                                    .replace(".", ",")}`}
                              </p>
                            </div>

                            {result.rows.length > 0 && (
                              <ul className="mt-4 flex flex-col gap-2">
                                {result.rows.map((row) => (
                                  <li
                                    key={row.label}
                                    className="flex items-center gap-3"
                                  >
                                    <span className="w-40 shrink-0 truncate text-sm text-ink">
                                      {row.label}
                                      {row.correct && (
                                        <span
                                          title="Správná odpověď"
                                          className="ml-1 text-brand"
                                        >
                                          ✓
                                        </span>
                                      )}
                                    </span>
                                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-sunken">
                                      <span
                                        className="block h-full rounded-full bg-brand"
                                        style={{
                                          width: `${top > 0 ? (row.count / top) * 100 : 0}%`,
                                        }}
                                      />
                                    </span>
                                    <span className="w-10 shrink-0 text-right text-sm font-semibold text-ink">
                                      {row.count}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {result.texts.length > 0 && (
                              <ul className="mt-4 flex flex-col gap-2">
                                {result.texts.map((text, index) => (
                                  <li
                                    key={`${index}-${text}`}
                                    className="rounded-xl bg-sunken px-4 py-2 text-sm text-ink"
                                  >
                                    {text}
                                  </li>
                                ))}
                              </ul>
                            )}

                            {result.rows.length === 0 &&
                              result.texts.length === 0 && (
                                <p className="mt-4 text-sm text-muted">
                                  Na tenhle slide nikdo neodpověděl.
                                </p>
                              )}
                          </section>
                        );
                      })}
                  </div>

                  {results.every((result) => result.kind === "text") && (
                    <div className="card mt-6 border-dashed p-10 text-center">
                      <p className="text-sm text-muted">
                        Tahle prezentace nemá žádný slide, na který by publikum
                        odpovídalo.
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
