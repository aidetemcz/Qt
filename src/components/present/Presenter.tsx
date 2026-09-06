"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Lobby from "@/components/present/Lobby";
import SlideView, {
  type CloudWord,
  getInteraction,
  qaPageCount,
} from "@/components/slide/SlideView";
import type {
  Answer,
  Participant,
  Session,
  Slide,
  WordEntry,
} from "@/lib/presentations";
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
  const [endError, setEndError] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [words, setWords] = useState<WordEntry[]>([]);
  // Otázek bývá víc, než se na slide vejde; přednášející jimi listuje.
  const [qaPage, setQaPage] = useState(0);

  // Účastníci a jejich hlasy: jednou se načtou (kvůli reloadu uprostřed hry)
  // a dál přibývají realtimem.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [participantResult, answerResult, wordResult] = await Promise.all([
        supabase
          .from("participants")
          .select("*")
          .eq("session_id", session.id)
          .order("created_at", { ascending: true })
          .returns<Participant[]>(),
        supabase
          .from("answers")
          .select("*")
          .eq("session_id", session.id)
          .returns<Answer[]>(),
        supabase
          .from("words")
          .select("*")
          .eq("session_id", session.id)
          .returns<WordEntry[]>(),
      ]);
      if (cancelled) {
        return;
      }
      setParticipants(participantResult.data ?? []);
      setAnswers(answerResult.data ?? []);
      setWords(wordResult.data ?? []);
    }
    load();

    const channel = supabase
      .channel(`present-session-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) =>
          setParticipants((prev) => {
            const next = payload.new as Participant;
            return prev.some((p) => p.id === next.id) ? prev : [...prev, next];
          }),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "answers",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) =>
          setAnswers((prev) => {
            const next = payload.new as Answer;
            return prev.some((a) => a.id === next.id) ? prev : [...prev, next];
          }),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "words",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) =>
          setWords((prev) => {
            const next = payload.new as WordEntry;
            return prev.some((w) => w.id === next.id) ? prev : [...prev, next];
          }),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, session.id]);

  const total = slides.length;
  const clamped = Math.min(Math.max(position, 0), Math.max(total - 1, 0));
  const slide = slides[clamped];
  const interaction = slide ? getInteraction(slide.config) : null;
  const isQuiz = interaction?.kind === "quiz";

  // Hlasy k právě promítanému slidu.
  const slideAnswers = useMemo(
    () => (slide ? answers.filter((a) => a.slide_id === slide.id) : []),
    [answers, slide],
  );
  const answerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const answer of slideAnswers) {
      counts[answer.answer_id] = (counts[answer.answer_id] ?? 0) + 1;
    }
    return counts;
  }, [slideAnswers]);

  // Slova k promítanému slidu, spočítaná a seřazená od nejčastějšího.
  const cloudWords = useMemo<CloudWord[]>(() => {
    if (!slide?.config.wordcloud) {
      return [];
    }
    const counts = new Map<string, number>();
    for (const entry of words) {
      if (entry.slide_id === slide.id) {
        // Bez sjednocení velikosti písmen by "Ano" a "ano" byla dvě slova.
        const key = entry.text.toLocaleLowerCase("cs");
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return [...counts]
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text, "cs"));
  }, [words, slide]);

  // Otázky k promítanému slidu, od nejnovější.
  const slideQuestions = useMemo(() => {
    if (!slide?.config.qa) {
      return [];
    }
    return words
      .filter((entry) => entry.slide_id === slide.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((entry) => entry.text);
  }, [words, slide]);

  const qaPages = qaPageCount(slideQuestions.length);

  async function move(delta: -1 | 1) {
    const target = clamped + delta;
    if (target < 0 || target >= total) {
      return;
    }
    setIsPending(true);
    // Pozice a zakrytí se mění jedním zápisem. Kdyby to byly dva, účastník by
    // mezi nimi stihl vidět nový slide ještě s odkrytou odpovědí.
    let { data, error } = await supabase
      .from("sessions")
      .update({ current_position: target, reveal_answer: false })
      .eq("id", session.id)
      .select("current_position")
      .single<{ current_position: number }>();
    if (error) {
      // Databáze bez sloupce reveal_answer: posuň aspoň pozici.
      ({ data, error } = await supabase
        .from("sessions")
        .update({ current_position: target })
        .eq("id", session.id)
        .select("current_position")
        .single<{ current_position: number }>());
    }
    setIsPending(false);
    if (error || !data) {
      return;
    }
    // Follow the value the database returned, not an optimistic guess.
    setPosition(data.current_position);
    setRevealed(false);
    setQaPage(0);
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
    // Start uklidí i případné odkrytí zbylé z dřívějška.
    const { error } = await supabase
      .from("sessions")
      .update({ started: true, reveal_answer: false })
      .eq("id", session.id);
    setIsPending(false);
    setRevealed(false);
    // I když se zápis nepovede, přednášejícího nenecháme v lobby.
    setStartError(!!error);
    setStarted(true);
  }

  async function endPresentation() {
    if (!confirm("Ukončit prezentaci?")) {
      return;
    }
    setIsPending(true);
    const { error } = await supabase
      .from("sessions")
      .update({ is_active: false })
      .eq("id", session.id);
    if (error) {
      // Dřív se odcházelo i po neúspěchu a relace zůstala běžet.
      setIsPending(false);
      setEndError(true);
      return;
    }
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
          participants={participants}
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
                <SlideView
                  config={slide.config}
                  showCorrect={revealed}
                  answerCounts={interaction ? answerCounts : undefined}
                  words={cloudWords}
                  questions={slideQuestions}
                  questionPage={qaPage}
                />
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
              {interaction && (
                <span className="mt-1 block normal-case">
                  {slideAnswers.length} / {participants.length} odpovědělo
                </span>
              )}
              {slide?.config.wordcloud && (
                <span className="mt-1 block normal-case">
                  {cloudWords.reduce((sum, word) => sum + word.count, 0)} slov
                </span>
              )}
              {slide?.config.qa && (
                <span className="mt-1 block normal-case">
                  {slideQuestions.length} otázek
                </span>
              )}
            </span>
            {qaPages > 1 && (
              <button
                type="button"
                onClick={() => setQaPage((page) => (page + 1) % qaPages)}
                className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-white/15 motion-safe:hover:-translate-y-0.5"
              >
                Další otázky
              </button>
            )}
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

      {endError && (
        <p className="relative z-10 px-6 pb-5 text-center text-xs text-white/60">
          Prezentaci se nepodařilo ukončit. Zkus to prosím znovu.
        </p>
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
