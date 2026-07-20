import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Magic links go through Supabase's hosted verify endpoint with the
      // default (non-custom-SMTP) email template, which returns the session in
      // the URL fragment. The implicit flow reads that fragment without a
      // per-browser code_verifier, so the link works even across tabs/devices.
      auth: { flowType: "implicit" },
    },
  );
}
