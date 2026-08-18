import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const categories = [
  "Presentation",
  "Quiz",
  "Live poll",
  "Word cloud",
  "Q&A session",
];

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
            {["Templates", "Features", "Pricing"].map((item) => (
              <button
                key={item}
                type="button"
                disabled
                title="Coming soon"
                className="btn btn-disabled"
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <Link href="/join" className="btn btn-ghost">
              Join a room
            </Link>
            {!user && (
              <Link href="/login" className="btn btn-ghost">
                Log in
              </Link>
            )}
            <Link href="/dashboard" className="btn btn-primary">
              Go to projects
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 pt-16 pb-20 text-center sm:pt-24">
        <p className="eyebrow animate-fade-in">Live · Interactive · Free</p>
        <h1 className="animate-slide-up mt-5 max-w-4xl text-5xl leading-[1.05] font-extrabold text-ink sm:text-7xl">
          What will you <span className="marker">present</span> today?
        </h1>
        <p className="animate-slide-up mt-7 max-w-xl text-lg leading-relaxed text-muted">
          Qt makes interactive presentations that get your audience talking —
          quizzes, polls and live Q&amp;A in one place.
        </p>
        <div className="animate-slide-up mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            Go to your projects
          </Link>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="btn btn-secondary btn-lg btn-disabled"
          >
            Browse templates
          </button>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              disabled
              title="Coming soon"
              className="cursor-not-allowed rounded-full border border-border bg-surface/80 px-4 py-2 text-sm font-medium text-muted shadow-sm"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Stacked slide mockups — a peek at the product. */}
        <div className="mt-20 flex w-full max-w-4xl items-end justify-center gap-5">
          <div className="card hidden aspect-video w-56 -rotate-6 items-end p-5 sm:flex">
            <div className="w-full space-y-2 text-left">
              <div className="h-2.5 w-2/3 rounded-full bg-accent/60" />
              <div className="h-2 w-full rounded-full bg-border" />
              <div className="h-2 w-4/5 rounded-full bg-border" />
            </div>
          </div>
          <div className="card z-10 flex aspect-video w-72 flex-col justify-center gap-3 p-6 shadow-card-hover sm:w-80">
            <div className="h-3.5 w-3/4 rounded-full bg-brand" />
            <div className="h-2.5 w-full rounded-full bg-border" />
            <div className="h-2.5 w-5/6 rounded-full bg-border" />
            <div className="mt-2 flex gap-2">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-[0.625rem] font-bold text-brand">
                LIVE
              </span>
              <span className="rounded-full bg-sunken px-3 py-1 font-mono text-[0.625rem] font-bold tracking-widest text-muted">
                042 317
              </span>
            </div>
          </div>
          <div className="card hidden aspect-video w-56 rotate-6 items-end p-5 sm:flex">
            <div className="w-full space-y-2 text-left">
              <div className="h-2.5 w-1/2 rounded-full bg-brand/60" />
              <div className="h-2 w-full rounded-full bg-border" />
              <div className="h-2 w-3/5 rounded-full bg-border" />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/70 py-8 text-center text-sm text-muted">
        Qt — interactive presentations
      </footer>
    </div>
  );
}
