import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Only allow relative redirect targets to prevent open redirects.
  const nextParam = searchParams.get("next") ?? "/dashboard";
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/dashboard";

  const supabase = await createClient();
  let succeeded = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    succeeded = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    succeeded = !error;
  }

  if (succeeded) {
    // Behind the Vercel proxy the original host arrives in x-forwarded-host;
    // prefer it so the redirect keeps the user on the deployment they came from.
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";
    if (!isLocalEnv && forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=invalid_link`);
}
