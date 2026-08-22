import { notFound } from "next/navigation";
import Presenter from "@/components/present/Presenter";
import type { Presentation, Session, Slide } from "@/lib/presentations";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Prezentace · Qt",
};

export default async function PresentPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select(
      "id, presentation_id, code, current_position, is_active, created_at",
    )
    .eq("id", sessionId)
    .maybeSingle<Session>();

  if (!session) {
    notFound();
  }

  const [presentationResult, slidesResult] = await Promise.all([
    supabase
      .from("presentations")
      .select("id, title, created_at, updated_at")
      .eq("id", session.presentation_id)
      .maybeSingle<Presentation>(),
    supabase
      .from("slides")
      .select("id, presentation_id, position, type, config")
      .eq("presentation_id", session.presentation_id)
      .order("position", { ascending: true })
      .returns<Slide[]>(),
  ]);

  return (
    <Presenter
      session={session}
      title={presentationResult.data?.title ?? ""}
      slides={slidesResult.data ?? []}
    />
  );
}
