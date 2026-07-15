import Image from "next/image";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Přihlášení · Q&Q",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand/10 via-white to-accent/10 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <Link href="/" className="flex justify-center">
          <Image src="/logo-qt.svg" alt="Q&Q logo" width={76} height={25} />
        </Link>
        <h1 className="mt-6 text-center text-lg font-bold">Přihlášení</h1>
        <p className="mt-1 mb-6 text-center text-sm text-neutral-500">
          Pošleme ti na email odkaz, kterým se přihlásíš. Bez hesla.
        </p>
        <LoginForm urlError={error} />
      </div>
    </div>
  );
}
