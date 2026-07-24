import { notFound } from "next/navigation";
import type { Session } from "@/lib/presentations";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Prezentace · Q&Q",
};

// Minimal placeholder — the presentation canvas is the next step.
export default async function PresentPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, presentation_id, code, current_position, is_active, created_at")
    .eq("id", sessionId)
    .maybeSingle<Session>();

  if (!session) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-brand/10 via-white to-accent/10 px-4 text-center">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          Připojovací kód
        </p>
        <p className="mt-1 font-mono text-6xl font-bold tracking-[0.3em] text-brand">
          {session.code}
        </p>
      </div>
      <p className="text-sm text-neutral-500">
        Plátno prezentace připravujeme — zatím jen vytvořená session.
      </p>
    </div>
  );
}
