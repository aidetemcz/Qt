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
          const next = (payload.new as { current_position?: number })
            .current_position;
          if (typeof next === "number") {
            setPosition(next);
          }
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
    <div className="flex min-h-screen flex-col bg-neutral-900 text-white">
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        {slide ? (
          <div className="w-full max-w-xl">
            <SlideView config={slide.config} />
          </div>
        ) : (
          <p className="text-center text-neutral-400">
            Prezentace zatím nemá žádné slidy.
          </p>
        )}
      </main>
      <footer className="px-5 py-4 text-center text-xs text-neutral-500">
        {total > 0 ? `${clamped + 1} / ${total}` : "0 / 0"} · kód {session.code}
      </footer>
    </div>
  );
}
