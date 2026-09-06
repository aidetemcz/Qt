import { NextResponse } from "next/server";
import type { Session, Slide } from "@/lib/presentations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Odpovědi se nesmí cachovat, mění se v průběhu prezentace.
export const dynamic = "force-dynamic";

/**
 * Vydá id správných odpovědí — ale jen pro slide, který se právě promítá, a
 * jen když ho přednášející odkryl. Účastníkům se totiž do prohlížeče posílají
 * slidy bez příznaku správnosti, aby ji nešlo přečíst v devtools předem.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const supabase = createAdminClient() ?? (await createClient());

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle<Session>();

  if (!session || !session.reveal_answer) {
    return NextResponse.json({ slideId: null, correct: [] });
  }

  const { data: slides } = await supabase
    .from("slides")
    .select("id, presentation_id, position, type, config")
    .eq("presentation_id", session.presentation_id)
    .order("position", { ascending: true })
    .returns<Slide[]>();

  const slide = slides?.[session.current_position];
  const correct = (slide?.config.quiz?.answers ?? [])
    .filter((answer) => answer.correct)
    .map((answer) => answer.id);

  return NextResponse.json({ slideId: slide?.id ?? null, correct });
}
