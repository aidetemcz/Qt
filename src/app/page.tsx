import Image from "next/image";
import Link from "next/link";
import HeroSlides from "@/components/HeroSlides";
import NewPresentationButton from "@/components/NewPresentationButton";
import { QUICK_CREATE } from "@/lib/slideTypes";
import { createClient } from "@/lib/supabase/server";

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
          {/* Zatím to nikam nevede, tak je to i vidět — ne jen v bublině. */}
          <nav className="hidden items-center gap-1 sm:flex">
            {["Šablony", "Funkce", "Ceník"].map((item) => (
              <span
                key={item}
                className="flex cursor-default items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-400"
              >
                {item}
                <span className="rounded-full bg-sunken px-1.5 py-0.5 text-[0.5625rem] font-bold tracking-wide text-muted uppercase">
                  brzy
                </span>
              </span>
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
          <Link href="/join" className="btn btn-secondary btn-lg">
            Připojit se do místnosti
          </Link>
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

        <div className="mt-20 flex w-full justify-center">
          <HeroSlides />
        </div>
      </main>

      <footer className="border-t border-border/70 py-8 text-center text-sm text-muted">
        Qt — interaktivní prezentace
      </footer>
    </div>
  );
}
