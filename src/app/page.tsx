import Image from "next/image";
import Link from "next/link";
import NewPresentationButton from "@/components/NewPresentationButton";
import SlideView from "@/components/slide/SlideView";
import type { SlideConfig } from "@/lib/presentations";
import { QUICK_CREATE } from "@/lib/slideTypes";
import { createClient } from "@/lib/supabase/server";

/** Obsah ukázkových slidů v hlavičce. */
const demoQuiz: SlideConfig = {
  quiz: {
    question: "Kolik krajů má Česko?",
    answers: [
      { id: "a", text: "8" },
      { id: "b", text: "14", correct: true },
      { id: "c", text: "12" },
      { id: "d", text: "16" },
    ],
  },
};
const demoCounts = { a: 2, b: 11, c: 4, d: 1 };

const demoCloud: SlideConfig = {
  background: "#f1f7f9",
  wordcloud: { question: "Jedním slovem: jak se dnes cítíš?" },
};
const demoWords = [
  { text: "natěšeně", count: 9 },
  { text: "zvědavě", count: 6 },
  { text: "v pohodě", count: 4 },
  { text: "ospale", count: 3 },
  { text: "nervózně", count: 2 },
];

const demoText: SlideConfig = {
  background: "#fdf1ef",
  elements: [
    {
      id: "heading",
      kind: "heading",
      text: "Co nás dnes čeká",
      x: 72,
      y: 120,
      w: 816,
      fontSize: 72,
    },
    {
      id: "body",
      kind: "body",
      text: "Tři otázky, jedna anketa\na prostor na vaše dotazy.",
      x: 72,
      y: 260,
      w: 816,
      fontSize: 34,
    },
  ],
};

/** Vzhled dlaždice s typem — sdílený tlačítkem i odkazem na přihlášení. */
const categoryClass =
  "rounded-full border border-border bg-surface/80 px-4 py-2 text-sm font-medium text-muted shadow-sm transition-all duration-150 hover:border-brand/40 hover:text-brand disabled:opacity-50 motion-safe:hover:-translate-y-0.5";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="topbar sticky top-0 z-10">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity duration-150 hover:opacity-80"
          >
            <Image
              src="/logo-qt.svg"
              alt="Qt logo"
              width={91}
              height={30}
              priority
            />
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {["Šablony", "Funkce", "Ceník"].map((item) => (
              <button
                key={item}
                type="button"
                disabled
                title="Připravujeme"
                className="btn btn-disabled"
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <Link href="/join" className="btn btn-ghost">
              Připojit se
            </Link>
            {!user && (
              <Link href="/login" className="btn btn-ghost">
                Přihlásit se
              </Link>
            )}
            <Link href="/dashboard" className="btn btn-primary">
              Moje prezentace
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 pt-16 pb-20 text-center sm:pt-24">
        <p className="eyebrow animate-fade-in">Živě · Interaktivně · Zdarma</p>
        <h1 className="animate-slide-up mt-5 max-w-4xl text-5xl leading-[1.05] font-extrabold text-ink sm:text-7xl">
          Co dnes budeš <span className="marker">prezentovat</span>?
        </h1>
        <p className="animate-slide-up mt-7 max-w-xl text-lg leading-relaxed text-muted">
          Qt dělá z prezentací něco, do čeho publikum mluví — kvízy, ankety a
          otázky na jednom místě.
        </p>
        <div className="animate-slide-up mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            Moje prezentace
          </Link>
          <button
            type="button"
            disabled
            title="Připravujeme"
            className="btn btn-secondary btn-lg btn-disabled"
          >
            Procházet šablony
          </button>
        </div>

        {/* Klik založí prezentaci s daným slidem; kdo není přihlášený,
            projde nejdřív přihlášením. */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-2">
          {QUICK_CREATE.map((item) =>
            user ? (
              <NewPresentationButton
                key={item.id}
                slideType={item.id}
                label={item.label}
                className={categoryClass}
              />
            ) : (
              <Link key={item.id} href="/login" className={categoryClass}>
                {item.label}
              </Link>
            ),
          )}
        </div>

        {/* Ukázka skutečných slidů — vykresluje je stejná komponenta jako
            editor i prezentace, takže se nemůžou rozejít s produktem. */}
        <div className="mt-20 flex w-full max-w-5xl items-center justify-center gap-4">
          <div className="hidden w-64 -rotate-6 overflow-hidden rounded-card shadow-card ring-1 ring-border sm:block lg:w-72">
            <SlideView config={demoCloud} words={demoWords} />
          </div>

          <div className="relative z-10 w-full max-w-sm shrink-0 lg:max-w-md">
            <div className="overflow-hidden rounded-card shadow-pop ring-1 ring-border">
              <SlideView config={demoQuiz} answerCounts={demoCounts} />
            </div>
            <div className="absolute -top-3 -right-2 flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 shadow-card ring-1 ring-border">
              <span className="h-1.5 w-1.5 rounded-full bg-brand motion-safe:animate-pulse" />
              <span className="text-[0.625rem] font-bold tracking-wide text-brand uppercase">
                Živě
              </span>
              <span className="font-mono text-[0.625rem] font-bold tracking-widest text-muted">
                042 317
              </span>
            </div>
          </div>

          <div className="hidden w-64 rotate-6 overflow-hidden rounded-card shadow-card ring-1 ring-border sm:block lg:w-72">
            <SlideView config={demoText} />
          </div>
        </div>
      </main>

      <footer className="border-t border-border/70 py-8 text-center text-sm text-muted">
        Qt — interaktivní prezentace
      </footer>
    </div>
  );
}
