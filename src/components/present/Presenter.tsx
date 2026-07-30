"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SlideView from "@/components/slide/SlideView";
import type { Session, Slide } from "@/lib/presentations";
import { createClient } from "@/lib/supabase/client";

export default function Presenter({
  session,
  title,
  slides,
}: {
  session: Session;
  title: string;
  slides: Slide[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  // current_position from the session is the source of truth; the canvas
  // renders whatever value the database last confirmed.
  const [position, setPosition] = useState(session.current_position);
  const [isPending, setIsPending] = useState(false);

  const total = slides.length;
  const clamped = Math.min(Math.max(position, 0), Math.max(total - 1, 0));
  const slide = slides[clamped];

  async function move(delta: -1 | 1) {
    const target = clamped + delta;
    if (target < 0 || target >= total) {
      return;
    }
    setIsPending(true);
    const { data, error } = await supabase
      .from("sessions")
      .update({ current_position: target })
      .eq("id", session.id)
      .select("current_position")
      .single<{ current_position: number }>();
    setIsPending(false);
    if (error || !data) {
      return;
    }
    // Follow the value the database returned, not an optimistic guess.
    setPosition(data.current_position);
  }

  async function endPresentation() {
    if (!confirm("Ukončit prezentaci?")) {
      return;
    }
    setIsPending(true);
    await supabase
      .from("sessions")
      .update({ is_active: false })
      .eq("id", session.id);
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-900 text-white">
      <header className="flex items-center justify-between gap-4 px-6 py-4">
        <span className="truncate text-sm text-neutral-400">{title}</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-neutral-400">
              Kód místnosti
            </span>
            <span className="rounded-lg bg-white/10 px-4 py-1.5 font-mono text-2xl font-bold tracking-[0.25em] text-white">
              {session.code}
            </span>
          </div>
          <button
            type="button"
            onClick={endPresentation}
            disabled={isPending}
            className="rounded-lg border border-white/20 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-40"
          >
            Ukončit prezentaci
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        {slide ? (
          <div className="w-full max-w-4xl">
            <SlideView config={slide.config} />
          </div>
        ) : (
          <p className="text-lg text-neutral-400">
            Tato prezentace zatím nemá žádné slidy.
          </p>
        )}
      </main>

      <footer className="flex items-center justify-center gap-6 px-6 py-6">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={isPending || clamped <= 0 || total === 0}
          className="rounded-lg bg-white/10 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-30"
        >
          ← Předchozí
        </button>
        <span className="min-w-[7rem] text-center text-sm text-neutral-400">
          {total === 0 ? "0 z 0" : `slide ${clamped + 1} z ${total}`}
        </span>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={isPending || clamped >= total - 1 || total === 0}
          className="rounded-lg bg-brand px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-30"
        >
          Další →
        </button>
      </footer>
    </div>
  );
}
