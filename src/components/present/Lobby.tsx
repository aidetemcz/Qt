"use client";

import type { Participant } from "@/lib/presentations";

/**
 * Čekárna před spuštěním prezentace: QR kód, velký kód místnosti, prostor pro
 * účastníky a tlačítko start. Vykresluje se uvnitř tmavého plátna Presenteru.
 */
export default function Lobby({
  code,
  joinHost,
  qrSvg,
  participants,
  onStart,
  isPending,
}: {
  code: string;
  joinHost: string;
  qrSvg: string;
  participants: Participant[];
  onStart: () => void;
  isPending: boolean;
}) {
  return (
    <main className="animate-fade-in relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6 py-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10">
        {/* QR vygeneroval server, proto se dá vložit jako značky. */}
        <div
          aria-hidden
          className="h-36 w-36 rounded-2xl bg-white p-3 shadow-pop sm:h-44 sm:w-44 [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />

        <div className="text-center sm:text-left">
          <p className="text-xs font-bold tracking-[0.2em] text-white/45 uppercase">
            Naskenuj kód nebo jdi na {joinHost || "…"}/join
          </p>
          <p className="mt-4 font-mono text-6xl font-bold tracking-[0.2em] text-white sm:text-7xl">
            {code}
          </p>
        </div>
      </div>

      <div className="w-full max-w-3xl rounded-panel border border-white/10 bg-white/5 p-6">
        <p className="mb-4 text-center text-xs font-bold tracking-[0.16em] text-white/45 uppercase">
          {participants.length === 0
            ? "Zatím nikdo"
            : `${participants.length} ${participants.length === 1 ? "připojený" : participants.length < 5 ? "připojení" : "připojených"}`}
        </p>
        {participants.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">
            Tady se objeví připojení účastníci.
          </p>
        ) : (
          <ul className="flex flex-wrap justify-center gap-2">
            {participants.map((participant) => (
              <li
                key={participant.id}
                className="animate-pop rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white"
              >
                {participant.nickname}
              </li>
            ))}
          </ul>
        )}
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
