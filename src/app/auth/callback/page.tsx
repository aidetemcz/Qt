"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Client-side magic link callback.
 *
 * Supabase's default (non-custom-SMTP) email template can only deliver the
 * session in the URL fragment (implicit flow), which a server route never
 * sees. The browser client detects that fragment (and a `?code=` when
 * present) on load and persists the session to cookies, so middleware and
 * server components pick it up. A `token_hash` link is handled explicitly.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let done = false;

    function finish(ok: boolean, next: string) {
      if (done) return;
      done = true;
      router.replace(ok ? next : "/login?error=invalid_link");
    }

    // A session appearing means detectSessionInUrl processed the fragment or
    // the code and stored it — the happy path for the default template.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish(true, nextTarget());
    });

    function nextTarget() {
      const nextParam =
        new URLSearchParams(window.location.search).get("next") ?? "/dashboard";
      return nextParam.startsWith("/") && !nextParam.startsWith("//")
        ? nextParam
        : "/dashboard";
    }

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const next = nextTarget();

      // Supabase may redirect back with an explicit error (expired/used token).
      if (params.get("error") || params.get("error_code")) {
        finish(false, next);
        return;
      }

      // token_hash template (only reachable with custom SMTP) — verify directly.
      const tokenHash = params.get("token_hash");
      const type = params.get("type") as EmailOtpType | null;
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type,
          token_hash: tokenHash,
        });
        finish(!error, next);
        return;
      }

      // For `?code=` and the `#access_token` fragment, detectSessionInUrl runs
      // on client init and fires onAuthStateChange. Give it a moment, then
      // confirm a session was established.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const { data } = await supabase.auth.getSession();
      finish(!!data.session, next);
    })();

    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand/10 via-white to-accent/10 px-4">
      <p className="text-sm text-neutral-600">Přihlašuji…</p>
    </div>
  );
}
