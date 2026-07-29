import { notFound } from "next/navigation";
import Player from "@/components/play/Player";
import type { Session, Slide } from "@/lib/presentations";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Qt",
};

export default async function PlayPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  // Read the initial current_position from the database so a late joiner lands
  // on the current slide immediately, not only after the next realtime event.
  const { data: session } = await supabase
    .from("sessions")
    .select("id, presentation_id, code, current_position, is_active, created_at")
    .eq("id", sessionId)
    .maybeSingle<Session>();

  if (!session) {
    notFound();
  }

  const { data: slides } = await supabase
    .from("slides")
    .select("id, presentation_id, position, type, config")
    .eq("presentation_id", session.presentation_id)
    .order("position", { ascending: true })
    .returns<Slide[]>();

  return <Player session={session} slides={slides ?? []} />;
}
