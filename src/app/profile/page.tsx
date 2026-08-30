import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Profil · Qt",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sem se bez přihlášení nedostaneš (hlídá middleware), tohle je pojistka.
  if (!user) {
    redirect("/login");
  }

  const name = (user.user_metadata?.name as string | undefined)?.trim();
  const email = user.email ?? "";
  const initial = (name || email || "?").charAt(0).toLocaleUpperCase("cs");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-xl">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            Profil
          </h1>

          <div className="panel animate-slide-up mt-6 p-7 sm:p-8">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-2xl font-extrabold text-white">
                {initial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-ink">
                  {name || "Bez jména"}
                </p>
                <p className="truncate text-sm text-muted">{email}</p>
              </div>
            </div>

            <dl className="mt-8 flex flex-col gap-5">
              <div>
                <dt className="text-xs font-bold tracking-wide text-muted uppercase">
                  Jméno
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  {name || (
                    <span className="text-muted">
                      Nezadané — vyplní se při přihlášení odkazem
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-wide text-muted uppercase">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-ink">{email}</dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
              <form action={signOut}>
                <button type="submit" className="btn btn-secondary">
                  Odhlásit
                </button>
              </form>
              <Link href="/dashboard" className="btn btn-ghost">
                Zpět na prezentace
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
