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

      <main className="flex flex-1 flex-col items-center px-6 pt-20 pb-16 text-center">
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
          What will you{" "}
          <span className="bg-gradient-to-r from-brand to-accent-dark bg-clip-text text-transparent">
            present
          </span>{" "}
          today?
        </h1>
        <p className="mt-6 max-w-xl text-lg text-neutral-600">
          Qt makes interactive presentations that get your audience
          talking — quizzes, polls and live Q&amp;A in one place.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-brand px-6 py-3 text-base font-medium text-white transition-colors hover:bg-brand-dark"
          >
            Go to your projects
          </Link>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="cursor-not-allowed rounded-lg border border-neutral-300 bg-white px-6 py-3 text-base font-medium text-neutral-400"
          >
            Browse templates
          </button>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              disabled
              title="Coming soon"
              className="cursor-not-allowed rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-500 shadow-sm"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-16 flex w-full max-w-4xl items-end justify-center gap-4">
          <div className="hidden h-40 w-56 -rotate-3 rounded-xl bg-gradient-to-br from-accent to-accent-dark shadow-lg sm:block" />
          <div className="h-48 w-64 rounded-xl bg-gradient-to-br from-brand to-accent shadow-xl" />
          <div className="hidden h-40 w-56 rotate-3 rounded-xl bg-gradient-to-br from-brand-dark to-brand shadow-lg sm:block" />
        </div>
      </main>

      <footer className="border-t border-neutral-200 py-6 text-center text-sm text-neutral-400">
        Qt — interactive presentations
      </footer>
    </div>
  );
}
