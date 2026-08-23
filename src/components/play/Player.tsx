"use client";

import { useEffect, useMemo, useState } from "react";
import SlideView from "@/components/slide/SlideView";
import type { Session, Slide } from "@/lib/presentations";
import { createClient } from "@/lib/supabase/client";

export default function Player({
  session,
  slides,
}: {
  session: Session;
  slides: Slide[];
}) {
  const supabase = useMemo(() => createClient(), []);
  // Seed from the database value (server-loaded) so a late joiner is already on
  // the right slide; realtime updates take over from there.
  const [position, setPosition] = useState(session.current_position);
  // Odkrytí správné odpovědi řídí přednášející; sem přiteče stejným odběrem.
  const [revealed, setRevealed] = useState(!!session.reveal_answer);
  // Bez migrace sloupec chybí — pak se čeká na nic a bereme to jako spuštěné.
  const [started, setStarted] = useState(session.started ?? true);

  useEffect(() => {
    const channel = supabase
      .channel(`play-session-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const next = payload.new as {
            current_position?: number;
            reveal_answer?: boolean;
            started?: boolean;
          };
          if (typeof next.current_position === "number") {
            setPosition(next.current_position);
          }
          if (typeof next.started === "boolean") {
            setStarted(next.started);
          }
          setRevealed(!!next.reveal_answer);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, session.id]);

  const total = slides.length;
  const clamped = Math.min(Math.max(position, 0), Math.max(total - 1, 0));
  const slide = slides[clamped];

  return (
    <div className="relative flex min-h-screen flex-col bg-[#17120f] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(45rem 30rem at 20% -10%, rgb(220 91 91 / 0.22), transparent 62%), radial-gradient(40rem 28rem at 85% 108%, rgb(125 164 178 / 0.2), transparent 60%)",
        }}
      />
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        {!started ? (
          <div className="animate-fade-in text-center">
            <p className="text-2xl font-extrabold text-white">Jsi ve hře!</p>
            <p className="mt-3 text-sm text-white/50">
              Počkej, až přednášející prezentaci spustí.
            </p>
          </div>
        ) : slide ? (
          <div
            key={slide.id}
            className="animate-fade-in w-full max-w-4xl rounded-panel shadow-pop"
          >
            <SlideView config={slide.config} showCorrect={revealed} />
          </div>
        ) : (
          <p className="text-center text-white/50">
            Prezentace zatím nemá žádné slidy.
          </p>
        )}
      </main>
      <footer className="relative z-10 flex items-center justify-center gap-3 px-5 py-5 text-xs">
        {started && (
          <span className="font-mono tracking-widest text-white/45">
            {total > 0 ? `${clamped + 1} / ${total}` : "0 / 0"}
          </span>
        )}
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono tracking-[0.2em] text-white/60">
          {session.code}
        </span>
      </footer>
    </div>
  );
}
