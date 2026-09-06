"use client";

import { useMemo, useState } from "react";
import NewPresentationButton from "@/components/NewPresentationButton";
import PresentationCard from "@/components/PresentationCard";
import type { Presentation } from "@/lib/presentations";
import { QUICK_CREATE } from "@/lib/slideTypes";

/**
 * Obsah dashboardu: hledání a rychlé založení potřebují stav v prohlížeči,
 * takže sekce běží jako klientská komponenta. Data načítá stránka na serveru.
 */
export default function DashboardContent({
  presentations,
}: {
  presentations: (Presentation & { slideCount: number })[];
}) {
  const [query, setQuery] = useState("");

  const found = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("cs");
    if (!needle) {
      return presentations;
    }
    return presentations.filter((presentation) =>
      presentation.title.toLocaleLowerCase("cs").includes(needle),
    );
  }, [presentations, query]);

  return (
    <>
      <section className="animate-fade-in relative overflow-hidden rounded-panel bg-gradient-to-br from-brand via-brand-dark to-accent-dark px-6 py-14 text-center shadow-card-hover sm:py-20">
        <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <p className="relative text-xs font-bold tracking-[0.16em] text-white/70 uppercase">
          Tvůj prostor
        </p>
        <h1 className="relative mt-4 text-3xl leading-tight font-extrabold text-white sm:text-5xl">
          Co dnes budeš prezentovat?
        </h1>
        <div className="relative mx-auto mt-8 max-w-lg">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat v prezentacích"
            aria-label="Hledat v prezentacích"
            className="w-full rounded-full border-0 bg-surface/95 px-5 py-3.5 text-sm text-ink shadow-pop outline-none placeholder:text-muted focus:ring-2 focus:ring-white/60"
          />
        </div>
      </section>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        {QUICK_CREATE.map((item) => (
          <NewPresentationButton
            key={item.id}
            slideType={item.id}
            label={`+ ${item.label}`}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted shadow-sm transition-all duration-150 hover:border-brand/40 hover:text-brand disabled:opacity-50 motion-safe:hover:-translate-y-0.5"
          />
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
          {query.trim() ? "Nalezené prezentace" : "Poslední prezentace"}
        </h2>
        <NewPresentationButton />
      </div>

      {found.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {found.map(({ slideCount, ...presentation }) => (
            <PresentationCard
              key={presentation.id}
              presentation={presentation}
              slideCount={slideCount}
            />
          ))}
        </div>
      ) : (
        <div className="card animate-fade-in mt-6 border-dashed p-10 text-center">
          <p className="text-sm text-muted">
            {query.trim()
              ? `Nic nesedí na „${query.trim()}".`
              : "Zatím tu nic není. Vytvoř svoji první prezentaci!"}
          </p>
        </div>
      )}
    </>
  );
}
