import Link from "next/link";
import { redirect } from "next/navigation";
import BrandEditor from "@/components/brand/BrandEditor";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Značka · Qt",
};

export default async function BrandPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Značka</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                Barvy a logo
              </h1>
            </div>
            <Link href="/dashboard" className="btn btn-secondary btn-sm">
              ← Prezentace
            </Link>
          </div>

          <p className="mt-4 max-w-2xl text-sm text-muted">
            Nastav si to jednou a v editoru to máš po ruce — ať nemusíš barvu
            firmy hledat v jiné prezentaci.
          </p>

          <BrandEditor userId={user.id} />
        </div>
      </main>
    </div>
  );
}
