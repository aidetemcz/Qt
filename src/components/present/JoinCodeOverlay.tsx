"use client";

import { useEffect } from "react";

/**
 * QR kód přes celou obrazovku, aby se opozdilci mohli připojit i uprostřed
 * prezentace. Vidí ho jen přednášející na svém plátně — účastníci mají na
 * svých zařízeních dál slide.
 */
export default function JoinCodeOverlay({
  code,
  joinHost,
  qrSvg,
  onClose,
}: {
  code: string;
  joinHost: string;
  qrSvg: string;
  onClose: () => void;
}) {
  // Escape zavírá, aby se přednášející nemusel trefovat do tlačítka.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Připojení do prezentace"
      onClick={onClose}
      className="animate-fade-in fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-[#17120f]/95 px-6 py-10 backdrop-blur"
    >
      <div
        aria-hidden
        className="w-[min(60vh,60vw)] max-w-[32rem] rounded-3xl bg-white p-6 shadow-pop [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />

      <div className="text-center">
        <p className="text-sm font-bold tracking-[0.2em] text-white/50 uppercase">
          Naskenuj kód nebo jdi na {joinHost || "…"}/join
        </p>
        <p className="mt-4 font-mono text-6xl font-bold tracking-[0.2em] text-white sm:text-7xl">
          {code}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-full border border-white/15 bg-white/5 px-8 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-white/15 motion-safe:hover:-translate-y-0.5"
      >
        Zavřít
      </button>
    </div>
  );
}
