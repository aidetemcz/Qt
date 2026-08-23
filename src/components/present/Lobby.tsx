"use client";

import { useEffect, useState } from "react";

/**
 * Čekárna před spuštěním prezentace: velký kód místnosti, prostor pro
 * účastníky a tlačítko start. Vykresluje se uvnitř tmavého plátna Presenteru.
 */
export default function Lobby({
  code,
  onStart,
  isPending,
}: {
  code: string;
  onStart: () => void;
  isPending: boolean;
}) {
  // Adresa se skládá až v prohlížeči, aby se server a klient nerozešly.
  const [joinHost, setJoinHost] = useState("");
  useEffect(() => setJoinHost(window.location.host), []);

  return (
    <main className="animate-fade-in relative z-10 flex flex-1 flex-col items-center justify-center gap-10 px-6 py-10">
      <div className="text-center">
        <p className="text-xs font-bold tracking-[0.2em] text-white/45 uppercase">
          Připoj se na {joinHost ? `${joinHost}/join` : "…/join"}
        </p>
        <p className="mt-5 font-mono text-6xl font-bold tracking-[0.2em] text-white sm:text-8xl">
          {code}
        </p>
      </div>

      <div className="w-full max-w-3xl rounded-panel border border-dashed border-white/15 bg-white/5 px-8 py-14 text-center">
        <p className="text-sm text-white/45">
          Tady se objeví připojení účastníci.
        </p>
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={isPending}
        className="rounded-full bg-brand px-10 py-4 text-base font-semibold text-white shadow-brand transition-all duration-150 hover:bg-brand-dark disabled:opacity-40 motion-safe:hover:-translate-y-0.5"
      >
        Spustit prezentaci
      </button>
    </main>
  );
}
