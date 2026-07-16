"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Client-side magic link callback.
 *
 * Supabase without custom SMTP cannot edit email templates, so the magic
 * link routes through the hosted verify endpoint and returns the session in
 * the URL fragment (implicit flow) that a server route cannot read. Here we
 * parse the fragment explicitly and call setSession, with fallbacks for the
 * PKCE `?code=` and `token_hash` flows. On failure the concrete reason is
 * shown on-screen to make misconfiguration easy to diagnose.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { detectSessionInUrl: false } },
    );

    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    const nextParam = search.get("next") ?? "/dashboard";
    const next =
      nextParam.startsWith("/") && !nextParam.startsWith("//")
        ? nextParam
        : "/dashboard";

    // Supabase reports failures (expired/used token) in the fragment for the
    // implicit flow and in the query for the code flow — check both.
    const providerError =
      hash.get("error_description") ||
      hash.get("error_code") ||
      hash.get("error") ||
      search.get("error_description") ||
      search.get("error_code") ||
      search.get("error");

    function fail(detail: string) {
      console.error("[auth/callback]", detail);
      setReason(detail);
    }

    async function run() {
      try {
        if (providerError) {
          fail(providerError);
          return;
        }

        // Implicit flow: tokens arrive in the URL fragment.
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            fail(`setSession: ${error.message}`);
            return;
          }
          router.replace(next);
          return;
        }

        // PKCE flow: exchange the code (uses the stored code_verifier cookie).
        const code = search.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            fail(`exchangeCodeForSession: ${error.message}`);
            return;
          }
          router.replace(next);
          return;
        }

        // token_hash template (reachable only with custom SMTP).
        const tokenHash = search.get("token_hash");
        const type = search.get("type") as EmailOtpType | null;
        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash: tokenHash,
          });
          if (error) {
            fail(`verifyOtp: ${error.message}`);
            return;
          }
          router.replace(next);
          return;
        }

        const q = [...search.keys()].join(",") || "-";
        const h = [...hash.keys()].join(",") || "-";
        fail(`Odkaz nepředal žádný token. query:[${q}] hash:[${h}]`);
      } catch (e) {
        fail(e instanceof Error ? e.message : String(e));
      }
    }

    run();
  }, [router]);

  if (reason) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand/10 via-white to-accent/10 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-bold">Přihlášení se nepovedlo</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Přihlašovací odkaz je neplatný nebo už vypršel.
          </p>
          <p className="mt-3 break-words rounded-lg bg-neutral-100 px-3 py-2 text-left text-xs text-neutral-500">
            {reason}
          </p>
          <Link
            href="/login"
            className="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Zpět na přihlášení
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand/10 via-white to-accent/10 px-4">
      <p className="text-sm text-neutral-600">Přihlašuji…</p>
    </div>
  );
}
