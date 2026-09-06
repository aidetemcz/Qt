import { notFound } from "next/navigation";
import Player from "@/components/play/Player";
import type { Session, Slide, SlideQuiz } from "@/lib/presentations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Qt",
};

/**
 * Odstraní z kvízů příznak správné odpovědi. Účastník ji nesmí mít
 * v prohlížeči dřív, než ji přednášející odkryje — po odkrytí si ji Player
 * vyzvedne z /api/reveal.
 */
function withoutCorrect(slides: Slide[]): Slide[] {
  const strip = (question: SlideQuiz) => ({
    ...question,
    answers: question.answers.map((answer) => ({
      id: answer.id,
      text: answer.text,
    })),
  });

  return slides.map((slide) => {
    const { quiz, poll } = slide.config;
    if (!quiz && !poll) {
      return slide;
    }
    return {
      ...slide,
      config: {
        ...slide.config,
        ...(quiz ? { quiz: strip(quiz) } : {}),
        ...(poll ? { poll: strip(poll) } : {}),
      },
    };
  });
}

export default async function PlayPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  // Slidy jsou v databázi čitelné jen pro vlastníka prezentace. Účastníkovi je
  // proto načte server a pošle mu je bez příznaku správné odpovědi.
  const supabase = createAdminClient() ?? (await createClient());

  // Read the initial current_position from the database so a late joiner lands
  // on the current slide immediately, not only after the next realtime event.
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
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

  return <Player session={session} slides={withoutCorrect(slides ?? [])} />;
}
