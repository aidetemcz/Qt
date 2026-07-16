import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function redirectTo(request: NextRequest, path: string) {
  const { origin } = new URL(request.url);
  // Behind the Vercel proxy the original host arrives in x-forwarded-host;
  // prefer it so the redirect keeps the user on the deployment they came from.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  if (!isLocalEnv && forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${path}`);
  }
  return NextResponse.redirect(`${origin}${path}`);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Supabase itself may redirect back here with an error (e.g. expired or
  // already-consumed one-time token) instead of a code.
  const providerError =
    searchParams.get("error_description") ??
    searchParams.get("error_code") ??
    searchParams.get("error");

  // Only allow relative redirect targets to prevent open redirects.
  const nextParam = searchParams.get("next") ?? "/dashboard";
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/dashboard";

  if (providerError) {
    console.error("[auth/callback] provider error:", providerError);
    return redirectTo(request, "/login?error=invalid_link");
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectTo(request, next);
    }
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return redirectTo(request, next);
    }
    console.error("[auth/callback] verifyOtp failed:", error.message);
  } else {
    // Neither a code nor a token_hash reached the server. This usually means
    // the email template delivers tokens in the URL fragment (implicit flow),
    // which the server cannot read — switch the template to the token_hash form.
    console.error(
      "[auth/callback] no code or token_hash in query:",
      [...searchParams.keys()].join(",") || "(empty)",
    );
  }

  return redirectTo(request, "/login?error=invalid_link");
}
