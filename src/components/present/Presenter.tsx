"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Lobby from "@/components/present/Lobby";
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
  // Odkrytí odpovědi je uložené v session, ne jen tady — jinak by ho
  // účastníci na /play nikdy nedostali.
  const [revealed, setRevealed] = useState(!!session.reveal_answer);
  const [revealError, setRevealError] = useState(false);
  // Bez migrace sloupec chybí a lobby se ukáže — start pak jde dál lokálně,
  // aby se prezentace nedala zaseknout.
  const [started, setStarted] = useState(session.started ?? false);
  const [startError, setStartError] = useState(false);

  const total = slides.length;
  const clamped = Math.min(Math.max(position, 0), Math.max(total - 1, 0));
  const slide = slides[clamped];
  const isQuiz = !!slide?.config.quiz;

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
    // Nový slide začíná zase zakrytý. Zvlášť od posunu pozice, aby přechod
    // mezi slidy fungoval i na databázi, kde sloupec ještě nepřibyl.
    if (revealed) {
      setRevealed(false);
      void supabase
        .from("sessions")
        .update({ reveal_answer: false })
        .eq("id", session.id);
    }
  }

  async function toggleReveal() {
    const next = !revealed;
    setIsPending(true);
    const { data, error } = await supabase
      .from("sessions")
      .update({ reveal_answer: next })
      .eq("id", session.id)
      .select("reveal_answer")
      .single<{ reveal_answer: boolean }>();
    setIsPending(false);
    if (error || !data) {
      setRevealError(true);
      return;
    }
    setRevealError(false);
    setRevealed(data.reveal_answer);
  }

  async function startPresenting() {
    setIsPending(true);
    const { error } = await supabase
      .from("sessions")
      .update({ started: true })
      .eq("id", session.id);
    setIsPending(false);
    // I když se zápis nepovede, přednášejícího nenecháme v lobby.
    setStartError(!!error);
    setStarted(true);
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
    <div className="relative flex min-h-screen flex-col bg-[#17120f] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(55rem 38rem at 15% -8%, rgb(220 91 91 / 0.22), transparent 62%), radial-gradient(48rem 34rem at 88% 105%, rgb(125 164 178 / 0.2), transparent 60%)",
        }}
      />
      <header className="relative z-10 flex items-center justify-between gap-4 px-6 py-5">
        <span className="truncate text-sm font-medium text-white/50">
          {title}
        </span>
        <div className="flex items-center gap-4">
          {/* V lobby je kód velký uprostřed, tady by se jen opakoval. */}
          {started && (
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 py-1.5 pr-2 pl-4 backdrop-blur">
              <span className="text-[0.625rem] font-bold tracking-[0.16em] text-white/50 uppercase">
                Kód místnosti
              </span>
              <span className="rounded-full bg-white/10 px-4 py-1 font-mono text-2xl font-bold tracking-[0.25em] text-white">
                {session.code}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={endPresentation}
            disabled={isPending}
            className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white/80 transition-all duration-150 hover:border-white/30 hover:bg-white/10 hover:text-white disabled:opacity-40 motion-safe:hover:-translate-y-0.5"
          >
            Ukončit prezentaci
          </button>
        </div>
      </header>

      {!started ? (
        <Lobby
          code={session.code}
          onStart={startPresenting}
          isPending={isPending}
        />
      ) : (
        <>
          <main className="relative z-10 flex flex-1 items-center justify-center px-6">
            {slide ? (
              <div
                key={slide.id}
                className="animate-fade-in w-full max-w-5xl rounded-panel shadow-pop"
              >
                <SlideView config={slide.config} showCorrect={revealed} />
              </div>
            ) : (
              <p className="text-lg text-white/50">
                Tato prezentace zatím nemá žádné slidy.
              </p>
            )}
          </main>

          <footer className="relative z-10 flex items-center justify-center gap-3 px-6 py-7">
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={isPending || clamped <= 0 || total === 0}
              className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-white/15 disabled:opacity-25 motion-safe:hover:-translate-y-0.5"
            >
              ← Předchozí
            </button>
            <span className="min-w-[8rem] text-center font-mono text-xs tracking-widest text-white/45 uppercase">
              {total === 0 ? "0 / 0" : `${clamped + 1} / ${total}`}
            </span>
            {isQuiz && (
              <button
                type="button"
                onClick={toggleReveal}
                disabled={isPending}
                className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-white/15 disabled:opacity-40 motion-safe:hover:-translate-y-0.5"
              >
                {revealed ? "Skrýt odpověď" : "Ukázat odpověď"}
              </button>
            )}
            <button
              type="button"
              onClick={() => move(1)}
              disabled={isPending || clamped >= total - 1 || total === 0}
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-brand transition-all duration-150 hover:bg-brand-dark disabled:opacity-25 motion-safe:hover:-translate-y-0.5"
            >
              Další →
            </button>
          </footer>
        </>
      )}

      {(revealError || startError) && (
        <p className="relative z-10 px-6 pb-5 text-center text-xs text-white/60">
          {revealError
            ? "Odpověď se nepodařilo odkrýt. V Supabase chybí sloupec reveal_answer — spusť SQL ze souboru supabase/add_reveal_answer.sql."
            : "Účastníkům se start nepodařilo oznámit. V Supabase chybí sloupec started — spusť SQL ze souboru supabase/add_started.sql."}
        </p>
      )}
    </div>
  );
}
