import { notFound } from "next/navigation";
import Editor from "@/components/editor/Editor";
import type { Presentation, Slide } from "@/lib/presentations";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Editor · Q&Q",
};

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [presentationResult, slidesResult] = await Promise.all([
    supabase
      .from("presentations")
      .select("id, title, created_at, updated_at")
      .eq("id", id)
      .maybeSingle<Presentation>(),
    supabase
      .from("slides")
      .select("id, presentation_id, position, type, config")
      .eq("presentation_id", id)
      .order("position", { ascending: true })
      .returns<Slide[]>(),
  ]);

  if (presentationResult.error || slidesResult.error) {
    throw new Error(
      presentationResult.error?.message ?? slidesResult.error?.message,
    );
  }
  if (!presentationResult.data) {
    notFound();
  }

  return (
    <Editor
      presentation={presentationResult.data}
      initialSlides={slidesResult.data ?? []}
    />
  );
}
