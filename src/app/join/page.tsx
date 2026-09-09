"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Odkaz z QR kódu nese kód v adrese, tak ho předvyplníme. Čte se přímo
  // z adresy, aby stránka nepotřebovala Suspense a zůstala statická.
  useEffect(() => {
    const fromLink = (
      new URLSearchParams(window.location.search).get("kod") ?? ""
    )
      .replace(/\D/g, "")
      .slice(0, 6);
    if (fromLink) {
      setCode(fromLink);
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("sessions")
      .select("id")
      .eq("code", code.trim())
      .eq("is_active", true)
      .maybeSingle<{ id: string }>();
    setLoading(false);
    if (!data) {
      setError("Místnost nenalezena");
      return;
    }
    router.push(`/play/${data.id}`);
  }

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
          Připojit se
        </h1>
        <p className="mt-3 mb-8 text-center text-sm text-muted">
          Zadej 6místný kód místnosti.
        </p>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            required
            maxLength={6}
            value={code}
            onChange={(e) => {
              setError(null);
              setCode(e.target.value.replace(/\D/g, ""));
            }}
            placeholder="000000"
            className="input bg-sunken py-5 text-center font-mono text-3xl font-bold tracking-[0.35em] text-ink"
          />
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="btn btn-primary btn-lg w-full text-sm"
          >
            {loading ? "Hledám…" : "Připojit se"}
          </button>
        </form>
      </div>
    </div>
  );
}
