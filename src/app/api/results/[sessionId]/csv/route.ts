import { NextResponse } from "next/server";
import type {
  Answer,
  Participant,
  Presentation,
  Session,
  Slide,
  WordEntry,
} from "@/lib/presentations";
import { buildResults, resultsToCsv } from "@/lib/results";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Výsledky relace jako tabulka ke stažení. Běží pod přihlášeným uživatelem,
 * takže RLS pustí jen relace jeho vlastních prezentací.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle<Session>();

  if (!session) {
    return NextResponse.json({ error: "Relace nenalezena" }, { status: 404 });
  }

  const [
    { data: presentation },
    { data: slides },
    { data: answers },
    { data: words },
    { data: participants },
  ] = await Promise.all([
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
    supabase
      .from("answers")
      .select("*")
      .eq("session_id", sessionId)
      .returns<Answer[]>(),
    supabase
      .from("words")
      .select("*")
      .eq("session_id", sessionId)
      .returns<WordEntry[]>(),
    supabase
      .from("participants")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .returns<Participant[]>(),
  ]);

  // Bez práva na prezentaci (cizí relace) se nic nevydá.
  if (!presentation) {
    return NextResponse.json({ error: "Bez oprávnění" }, { status: 403 });
  }

  const csv = resultsToCsv(
    buildResults(slides ?? [], answers ?? [], words ?? []),
    participants ?? [],
  );

  const stamp = session.created_at.slice(0, 10);
  const name = presentation.title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="qt-${name || "vysledky"}-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
