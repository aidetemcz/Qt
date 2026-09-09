"use client";

import { useEffect, useMemo, useState } from "react";
import SlideView, {
  getInteraction,
  getQuizAnswers,
  QUIZ_ANSWER_STYLES,
  QA_PER_PARTICIPANT,
  QA_TEXT_MAX,
  scaleValues,
  WORD_MAX,
  WORDS_PER_PARTICIPANT,
} from "@/components/slide/SlideView";
import type { Session, Slide } from "@/lib/presentations";
import { createClient } from "@/lib/supabase/client";

/** Účastník uložený v prohlížeči, aby ho reload nezaložil znovu. */
type StoredParticipant = { id: string; nickname: string };

const NICKNAME_MAX = 20;

function storageKey(sessionId: string) {
  return `qt-participant-${sessionId}`;
}

function loadParticipant(sessionId: string): StoredParticipant | null {
  try {
    const raw = localStorage.getItem(storageKey(sessionId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredParticipant;
    return parsed.id && parsed.nickname ? parsed : null;
  } catch {
    return null;
  }
}

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
  // Odkrytí řídí přednášející a přiteče stejným odběrem. Drží se u pozice,
  // ke které dorazilo — jinak by odkrytí z minulé otázky prozradilo tu další.
  const [reveal, setReveal] = useState({
    position: session.current_position,
    on: !!session.reveal_answer,
  });
  // Bez migrace sloupec chybí — pak se čeká na nic a bereme to jako spuštěné.
  const [started, setStarted] = useState(session.started ?? true);

  const [participant, setParticipant] = useState<StoredParticipant | null>(
    null,
  );
  const [nickname, setNickname] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  // Vybraná odpověď podle slidu, aby se nedalo hlasovat dvakrát.
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  // Správné odpovědi dorazí až po odkrytí, ze serveru — v configu je nemáme.
  const [correctIds, setCorrectIds] = useState<string[]>([]);
  // Slova poslaná do word cloudu, podle slidu.
  const [sentWords, setSentWords] = useState<Record<string, string[]>>({});
  const [word, setWord] = useState("");
  // Rozkliknuté možnosti u ankety s víc odpověďmi, dokud se neodešlou.
  const [picks, setPicks] = useState<string[]>([]);

  // localStorage se čte až po připojení komponenty, jinak by se rozešel se
  // serverovým renderem.
  useEffect(() => setParticipant(loadParticipant(session.id)), [session.id]);

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
          setReveal((prev) => ({
            position: next.current_position ?? prev.position,
            on: !!next.reveal_answer,
          }));
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
  const quiz = slide ? getInteraction(slide.config) : null;
  // Odkrytí platí jen pro slide, u kterého ho přednášející zapnul.
  const revealed = reveal.on && reveal.position === clamped;

  const slideId = slide?.id;
  // Na jiném slidu začíná výběr znovu.
  useEffect(() => setPicks([]), [slideId]);

  // Po odkrytí si správnou odpověď vyzvedneme; server ji vydá jen pro právě
  // promítaný slide a jen když je opravdu odkrytá. Anketa žádnou nemá.
  useEffect(() => {
    if (!revealed || !slide) {
      setCorrectIds([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/reveal/${session.id}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { slideId: string | null; correct: string[] } | null) => {
        if (!cancelled && data && data.slideId === slide.id) {
          setCorrectIds(data.correct);
        }
      })
      .catch(() => {
        // Bez odpovědi se prostě neukáže, co bylo správně.
      });
    return () => {
      cancelled = true;
    };
  }, [revealed, slide, session.id]);

  async function join() {
    const trimmed = nickname.trim();
    if (!trimmed) {
      return;
    }
    setJoining(true);
    setJoinError(null);
    const entry: StoredParticipant = {
      id: crypto.randomUUID(),
      nickname: trimmed,
    };
    const { error } = await supabase
      .from("participants")
      .insert({ id: entry.id, session_id: session.id, nickname: trimmed });
    setJoining(false);
    if (error) {
      setJoinError("Připojení se nepovedlo, zkus to prosím znovu.");
      return;
    }
    try {
      localStorage.setItem(storageKey(session.id), JSON.stringify(entry));
    } catch {
      // Bez uložení to funguje taky, jen reload založí nového účastníka.
    }
    setParticipant(entry);
  }

  async function pick(answerId: string) {
    if (!participant || !slide || picked[slide.id] || sending) {
      return;
    }
    setSending(true);
    // Víc možností se ukládá do jednoho hlasu ("a,c"), aby dál platilo
    // omezení jeden hlas na slide a nešlo hlasovat opakovaně.
    const { error } = await supabase.from("answers").insert({
      session_id: session.id,
      slide_id: slide.id,
      participant_id: participant.id,
      answer_id: answerId,
    });
    setSending(false);
    // 23505 = na tenhle slide už hlas poslal (třeba z jiné záložky).
    if (error && error.code !== "23505") {
      return;
    }
    setPicked((prev) => ({ ...prev, [slide.id]: answerId }));
  }

  async function sendWord() {
    const trimmed = word.trim();
    const already = slide ? (sentWords[slide.id] ?? []) : [];
    const limit = slide?.config.qa ? QA_PER_PARTICIPANT : WORDS_PER_PARTICIPANT;
    if (
      !participant ||
      !slide ||
      !trimmed ||
      sending ||
      already.length >= limit
    ) {
      return;
    }
    setSending(true);
    const { error } = await supabase.from("words").insert({
      session_id: session.id,
      slide_id: slide.id,
      participant_id: participant.id,
      text: trimmed,
    });
    setSending(false);
    if (error) {
      return;
    }
    setSentWords((prev) => ({
      ...prev,
      [slide.id]: [...(prev[slide.id] ?? []), trimmed],
    }));
    setWord("");
  }

  const myAnswer = slide ? picked[slide.id] : undefined;
  const multi = quiz?.kind === "poll" && !!quiz.multi;
  // Před odesláním se ukazují rozkliknuté, potom to, co se uložilo.
  const chosen = myAnswer !== undefined ? myAnswer.split(",") : picks;
  const cloud = slide?.config.wordcloud;
  const scale = slide?.config.scale;
  const qa = slide?.config.qa;
  const myWords = slide ? (sentWords[slide.id] ?? []) : [];
  const wordsLeft =
    (qa ? QA_PER_PARTICIPANT : WORDS_PER_PARTICIPANT) - myWords.length;

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
        {!participant ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              join();
            }}
            className="animate-fade-in w-full max-w-sm text-center"
          >
            <p className="text-2xl font-extrabold text-white">Jak ti říkat?</p>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={NICKNAME_MAX}
              autoFocus
              placeholder="Přezdívka"
              aria-label="Přezdívka"
              className="mt-6 w-full rounded-full border border-white/15 bg-white/10 px-5 py-3 text-center text-lg font-semibold text-white placeholder:text-white/40 focus:border-white/40 focus:ring-2 focus:ring-white/20 focus:outline-none"
            />
            <button
              type="submit"
              disabled={joining || !nickname.trim()}
              className="mt-4 w-full rounded-full bg-brand px-6 py-3 font-semibold text-white shadow-brand transition-all duration-150 hover:bg-brand-dark disabled:opacity-40 motion-safe:hover:-translate-y-0.5"
            >
              {joining ? "Připojuji…" : "Připojit se"}
            </button>
            {joinError && (
              <p className="mt-3 text-sm text-white/60">{joinError}</p>
            )}
          </form>
        ) : !started ? (
          <div className="animate-fade-in text-center">
            <p className="text-2xl font-extrabold text-white">Jsi ve hře!</p>
            <p className="mt-3 text-sm text-white/50">
              Počkej, až přednášející prezentaci spustí.
            </p>
          </div>
        ) : scale && slide ? (
          <div key={slide.id} className="animate-fade-in w-full max-w-md">
            <p className="text-center text-lg font-bold text-white">
              {scale.question}
            </p>

            <div className="mt-6 flex gap-2">
              {scaleValues(scale).map((value, index) => {
                const id = String(value);
                const mine = chosen.includes(id);
                const style =
                  QUIZ_ANSWER_STYLES[index % QUIZ_ANSWER_STYLES.length];
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => pick(id)}
                    disabled={myAnswer !== undefined || sending}
                    style={{ background: style.color }}
                    className={`flex-1 rounded-2xl py-5 text-lg font-extrabold text-white transition-all duration-150 ${
                      myAnswer !== undefined && !mine ? "opacity-40" : ""
                    } ${mine ? "ring-4 ring-white" : ""} ${
                      myAnswer !== undefined
                        ? ""
                        : "motion-safe:hover:-translate-y-0.5"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex justify-between text-xs text-white/50">
              <span>{scale.minLabel ?? ""}</span>
              <span>{scale.maxLabel ?? ""}</span>
            </div>

            <p className="mt-5 text-center text-sm text-white/60">
              {myAnswer !== undefined ? "Hlas odeslán." : "Vyber hodnotu."}
            </p>
          </div>
        ) : qa && slide ? (
          <div key={slide.id} className="animate-fade-in w-full max-w-md">
            <p className="text-center text-lg font-bold text-white">
              {qa.question || "Na co se chceš zeptat?"}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendWord();
              }}
              className="mt-6 flex flex-col gap-3"
            >
              <textarea
                value={word}
                onChange={(e) => setWord(e.target.value)}
                maxLength={QA_TEXT_MAX}
                rows={3}
                disabled={wordsLeft <= 0}
                placeholder={wordsLeft > 0 ? "Napiš svoji otázku" : "Hotovo"}
                aria-label="Otázka"
                className="w-full resize-none rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-2 focus:ring-white/20 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={sending || wordsLeft <= 0 || !word.trim()}
                className="rounded-full bg-brand px-5 py-3 font-semibold text-white shadow-brand transition-all duration-150 hover:bg-brand-dark disabled:opacity-40 motion-safe:hover:-translate-y-0.5"
              >
                Poslat otázku
              </button>
            </form>

            {myWords.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2">
                {myWords.map((sent, index) => (
                  <li
                    key={`${sent}-${index}`}
                    className="animate-pop rounded-2xl bg-white/10 px-4 py-2 text-sm text-white/80"
                  >
                    {sent}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 text-center text-sm text-white/60">
              {wordsLeft > 0
                ? `Můžeš poslat ještě ${wordsLeft} ${wordsLeft === 1 ? "otázku" : "otázky"}.`
                : "Díky, víc otázek už poslat nejde."}
            </p>
          </div>
        ) : cloud && slide ? (
          <div key={slide.id} className="animate-fade-in w-full max-w-sm">
            <p className="text-center text-lg font-bold text-white">
              {cloud.question}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendWord();
              }}
              className="mt-6 flex gap-2"
            >
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                maxLength={WORD_MAX}
                disabled={wordsLeft <= 0}
                placeholder={wordsLeft > 0 ? "Napiš slovo" : "Hotovo"}
                aria-label="Slovo"
                className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-2 focus:ring-white/20 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={sending || wordsLeft <= 0 || !word.trim()}
                className="shrink-0 rounded-full bg-brand px-5 py-3 font-semibold text-white shadow-brand transition-all duration-150 hover:bg-brand-dark disabled:opacity-40 motion-safe:hover:-translate-y-0.5"
              >
                Poslat
              </button>
            </form>

            {myWords.length > 0 && (
              <ul className="mt-4 flex flex-wrap justify-center gap-2">
                {myWords.map((sent, index) => (
                  <li
                    key={`${sent}-${index}`}
                    className="animate-pop rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
                  >
                    {sent}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 text-center text-sm text-white/60">
              {wordsLeft > 0
                ? `Můžeš poslat ještě ${wordsLeft} ${wordsLeft === 1 ? "slovo" : "slova"}.`
                : "Díky, víc slov už poslat nejde."}
            </p>
          </div>
        ) : quiz && slide ? (
          <div key={slide.id} className="animate-fade-in w-full max-w-2xl">
            <p className="text-center text-lg font-bold text-white">
              {quiz.question}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {getQuizAnswers(quiz)
                .filter((answer) => answer.text.trim())
                .map((answer, index) => {
                  const style =
                    QUIZ_ANSWER_STYLES[index % QUIZ_ANSWER_STYLES.length];
                  const mine = chosen.includes(answer.id);
                  const isCorrect = correctIds.includes(answer.id);
                  // Po odeslání se ostatní ztlumí; po odkrytí i špatné.
                  const dimmed = correctIds.length
                    ? !isCorrect
                    : myAnswer !== undefined && !mine;
                  return (
                    <button
                      key={answer.id}
                      type="button"
                      onClick={() =>
                        multi
                          ? setPicks((prev) =>
                              prev.includes(answer.id)
                                ? prev.filter((id) => id !== answer.id)
                                : [...prev, answer.id],
                            )
                          : pick(answer.id)
                      }
                      disabled={myAnswer !== undefined || sending}
                      style={{ background: style.color }}
                      className={`flex items-center gap-3 rounded-2xl px-5 py-6 text-left text-lg font-semibold text-white transition-all duration-150 ${
                        dimmed ? "opacity-40" : "opacity-100"
                      } ${mine ? "ring-4 ring-white" : ""} ${
                        myAnswer !== undefined
                          ? ""
                          : "motion-safe:hover:-translate-y-0.5"
                      }`}
                    >
                      <span aria-hidden>{style.glyph}</span>
                      <span className="min-w-0 break-words">{answer.text}</span>
                      {isCorrect && <span className="ml-auto shrink-0">✓</span>}
                    </button>
                  );
                })}
            </div>

            {multi && myAnswer === undefined && (
              <button
                type="button"
                onClick={() => pick([...picks].sort().join(","))}
                disabled={picks.length === 0 || sending}
                className="mt-4 w-full rounded-full bg-brand px-5 py-3 font-semibold text-white shadow-brand transition-all duration-150 hover:bg-brand-dark disabled:opacity-40 motion-safe:hover:-translate-y-0.5"
              >
                Odeslat {picks.length > 0 ? `(${picks.length})` : ""}
              </button>
            )}

            <p className="mt-5 text-center text-sm text-white/60">
              {correctIds.length
                ? myAnswer
                  ? correctIds.includes(myAnswer)
                    ? "Správně!"
                    : "Tentokrát vedle."
                  : "Nestihl jsi odpovědět."
                : myAnswer !== undefined
                  ? quiz.kind === "quiz"
                    ? "Odpověď odeslána."
                    : "Hlas odeslán."
                  : quiz.kind === "quiz"
                    ? "Vyber odpověď."
                    : multi
                      ? "Vyber jednu nebo víc možností a odešli."
                      : "Vyber možnost."}
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
        {participant && (
          <span className="font-semibold text-white/60">
            {participant.nickname}
          </span>
        )}
        {participant && started && (
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
