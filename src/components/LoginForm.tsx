"use client";

import { useState } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const urlErrorMessages: Record<string, string> = {
  invalid_link:
    "Přihlašovací odkaz je neplatný nebo už vypršel. Nech si poslat nový.",
};

function czechAuthError(error: AuthError): string {
  const message = error.message.toLowerCase();
  if (error.status === 429 || message.includes("rate limit")) {
    return "Příliš mnoho pokusů o přihlášení. Zkus to prosím za chvíli znovu.";
  }
  if (message.includes("database error") || message.includes("not allowed")) {
    return "Tento email nemá povolený přístup. Použij prosím povolenou emailovou adresu.";
  }
  if (message.includes("invalid") && message.includes("email")) {
    return "Zadaný email nevypadá platně. Zkontroluj ho prosím.";
  }
  return "Odeslání odkazu se nepovedlo. Zkus to prosím znovu.";
}

export default function LoginForm({ urlError }: { urlError?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError ? (urlErrorMessages[urlError] ?? null) : null,
  );

  async function sendLink(isResend: boolean) {
    setError(null);
    setStatus("sending");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        data: { name: name.trim() },
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (authError) {
      setStatus(isResend ? "sent" : "idle");
      setError(czechAuthError(authError));
      return;
    }
    setResent(isResend);
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="text-center">
        <p className="text-sm font-medium text-neutral-800">
          Poslali jsme ti přihlašovací odkaz na email
        </p>
        <p className="mt-1 text-sm text-neutral-500">{email.trim()}</p>
        {resent && (
          <p className="mt-3 text-xs text-neutral-500">
            Odkaz jsme poslali znovu.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={() => sendLink(true)}
          className="mt-4 text-sm font-medium text-brand underline-offset-2 hover:underline"
        >
          Poslat znovu
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        sendLink(false);
      }}
      className="flex flex-col gap-4"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700">Jméno</span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jana Nováková"
          className="rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jana@firma.cz"
          className="rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
      >
        {status === "sending" ? "Odesílám…" : "Poslat přihlašovací odkaz"}
      </button>
    </form>
  );
}
