import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side magic link callback (canonical @supabase/ssr App Router flow).
 *
 * Supabase's hosted verify endpoint returns a `?code=`. The server client
 * reads the PKCE code_verifier from the request cookies (written by the
 * browser client during signInWithOtp) and writes the session cookies to the
 * response, which is more reliable than exchanging on the client. A
 * `token_hash` link is handled via verifyOtp for completeness.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const providerError =
    searchParams.get("error_description") ||
    searchParams.get("error_code") ||
    searchParams.get("error");

  // Only allow relative redirect targets to prevent open redirects.
  const nextParam = searchParams.get("next") ?? "/dashboard";
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/dashboard";

  // Behind the Vercel proxy the original host arrives in x-forwarded-host.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const base =
    process.env.NODE_ENV !== "development" && forwardedHost
      ? `https://${forwardedHost}`
      : origin;

  function fail(reason: string) {
    console.error("[auth/callback]", reason);
    return NextResponse.redirect(`${base}/login?error=invalid_link`);
  }

  if (providerError) {
    return fail(providerError);
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return fail(`exchangeCodeForSession: ${error.message}`);
    }
    return NextResponse.redirect(`${base}${next}`);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) {
      return fail(`verifyOtp: ${error.message}`);
    }
    return NextResponse.redirect(`${base}${next}`);
  }

  return fail(
    `no code or token_hash — query:[${[...searchParams.keys()].join(",") || "-"}]`,
  );
}
