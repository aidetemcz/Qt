import { NextResponse } from "next/server";
import {
  getInteraction,
  getQuizAnswers,
  scaleValues,
} from "@/components/slide/SlideView";
import type { Participant, Session, Slide } from "@/lib/presentations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Platná id voleb na daném slidu — co jiného účastník pošle, se zahodí. */
function allowedIds(slide: Slide): string[] {
  const interaction = getInteraction(slide.config);
  if (interaction) {
    return getQuizAnswers(interaction)
      .filter((answer) => answer.text.trim())
      .map((answer) => answer.id);
  }
  if (slide.config.scale) {
    return scaleValues(slide.config.scale).map(String);
  }
  return [];
}

/**
 * Hlas účastníka. Jde přes server, protože měnit hlas znamená v Postgresu
 * sáhnout na existující řádek — a to by účastníkovi šlo povolit jedině tím,
 * že by směl tabulku hlasů i číst. Pak by si ale v prohlížeči přečetl, kdo
 * jak hlasoval. Server proto ověří, že relace běží, že slide do ní patří
 * a že volba na něm existuje, a teprve pak hlas zapíše.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nečitelný požadavek" }, { status: 400 });
  }

  const { sessionId, slideId, participantId, answerId } = (body ??
    {}) as Record<string, unknown>;
  if (
    typeof sessionId !== "string" ||
    typeof slideId !== "string" ||
    typeof participantId !== "string" ||
    typeof answerId !== "string"
  ) {
    return NextResponse.json({ error: "Chybí údaje hlasu" }, { status: 400 });
  }

  const admin = createAdminClient();
  const supabase = admin ?? (await createClient());

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle<Session>();

  if (!session || !session.is_active) {
    return NextResponse.json({ error: "Relace neběží" }, { status: 404 });
  }

  const [{ data: slide }, { data: participant }] = await Promise.all([
    supabase
      .from("slides")
      .select("id, presentation_id, position, type, config")
      .eq("id", slideId)
      .maybeSingle<Slide>(),
    supabase
      .from("participants")
      .select("*")
      .eq("id", participantId)
      .maybeSingle<Participant>(),
  ]);

  // Slide musí patřit k promítané prezentaci a účastník do téhle relace.
  if (!slide || slide.presentation_id !== session.presentation_id) {
    return NextResponse.json({ error: "Neznámý slide" }, { status: 404 });
  }
  if (!participant || participant.session_id !== sessionId) {
    return NextResponse.json({ error: "Neznámý účastník" }, { status: 403 });
  }

  const allowed = allowedIds(slide);
  // Anketa s víc odpověďmi přijde jako "a,c"; každý kus musí existovat.
  const picks = answerId.split(",").filter(Boolean);
  const multi = !!slide.config.poll?.multi;
  if (
    picks.length === 0 ||
    (!multi && picks.length > 1) ||
    new Set(picks).size !== picks.length ||
    picks.some((id) => !allowed.includes(id))
  ) {
    return NextResponse.json({ error: "Neplatná volba" }, { status: 400 });
  }
  const value = [...picks].sort().join(",");

  const row = {
    session_id: sessionId,
    slide_id: slideId,
    participant_id: participantId,
    answer_id: value,
  };

  if (admin) {
    // Servisní klíč obchází RLS, takže upsert projde i bez práva na čtení.
    const { error } = await supabase
      .from("answers")
      .upsert(row, { onConflict: "slide_id,participant_id" });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, answerId: value });
  }

  // Bez servisního klíče (lokální vývoj) zbývá prosté vložení: hlas projde,
  // ale změnit už ho nejde.
  const { error } = await supabase.from("answers").insert(row);
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, answerId: value, locked: !!error });
}
