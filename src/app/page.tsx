import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Q&amp;Q
        </h1>
        <p className="mt-4 text-lg text-neutral-600">
          Interactive presentations that get your audience talking.
        </p>
        <div className="mt-10">
          <Link
            href="/dashboard"
            className="inline-block rounded-lg bg-neutral-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-neutral-700"
          >
            Go to your projects
          </Link>
        </div>
      </div>
    </main>
  );
}
