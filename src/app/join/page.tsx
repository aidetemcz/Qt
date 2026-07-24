"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand/10 via-white to-accent/10 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <Link href="/" className="flex justify-center">
          <Image src="/logo-qt.svg" alt="Q&Q logo" width={76} height={25} />
        </Link>
        <h1 className="mt-6 text-center text-lg font-bold">Připojit se</h1>
        <p className="mt-1 mb-6 text-center text-sm text-neutral-500">
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
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] outline-none focus:border-brand"
          />
          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Hledám…" : "Připojit se"}
          </button>
        </form>
      </div>
    </div>
  );
}
