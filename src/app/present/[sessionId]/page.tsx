import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
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

  // Hvězdička schválně: reveal_answer přibyl později, a kdyby se vyjmenoval
  // před spuštěním migrace, celý dotaz by selhal a prezentace by zmizela.
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
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

  // Adresu na připojení i QR kód skládá server — účastníci si ho načtou
  // z plátna, takže se nemusí trefovat do šestimístného kódu.
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const joinUrl = `${protocol}://${host}/join?kod=${session.code}`;
  const qrSvg = await QRCode.toString(joinUrl, {
    type: "svg",
    margin: 0,
    color: { dark: "#241d1a", light: "#00000000" },
  });

  return (
    <Presenter
      session={session}
      title={presentationResult.data?.title ?? ""}
      slides={slidesResult.data ?? []}
      joinHost={host}
      qrSvg={qrSvg}
    />
  );
}
