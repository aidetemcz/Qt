import Image from "next/image";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Přihlášení · Qt",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="panel animate-slide-up w-full max-w-md p-9 sm:p-10">
        <Link
          href="/"
          className="flex justify-center transition-opacity duration-150 hover:opacity-80"
        >
          <Image src="/logo-qt.svg" alt="Qt logo" width={84} height={28} />
        </Link>
        <h1 className="mt-8 text-center text-3xl font-extrabold text-ink">
          Přihlášení
        </h1>
        <p className="mx-auto mt-3 mb-8 max-w-xs text-center text-sm leading-relaxed text-muted">
          Pošleme ti na email odkaz, kterým se přihlásíš. Bez hesla.
        </p>
        <LoginForm urlError={error} />
      </div>
    </div>
  );
}
