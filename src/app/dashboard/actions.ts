"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { slideTypeById } from "@/lib/slideTypes";
import { createClient } from "@/lib/supabase/server";

/** Random 6-digit numeric join code, e.g. "042317" (leading zeros allowed). */
function generateCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 1_000_000).padStart(6, "0");
}

export async function startPresentation(presentationId: string) {
  const supabase = await createClient();

  let sessionId: string | null = null;
  for (let attempt = 0; attempt < 10 && !sessionId; attempt++) {
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        presentation_id: presentationId,
        code: generateCode(),
        current_position: 0,
        is_active: true,
      })
      .select("id")
      .single<{ id: string }>();

    if (!error && data) {
      sessionId = data.id;
      break;
    }
    // 23505 = unique_violation: the code collided, try another one.
    if (error && error.code !== "23505") {
      throw new Error(`Failed to start presentation: ${error.message}`);
    }
  }

  if (!sessionId) {
    throw new Error("Nepodařilo se vygenerovat unikátní kód, zkus to znovu.");
  }

  redirect(`/present/${sessionId}`);
}

/**
 * Založí prezentaci. Se `slideType` jí rovnou přidá první slide toho typu
 * a otevře editor — to je rychlé založení z hlavní stránky a z dashboardu.
 */
export async function createPresentation(slideType?: string) {
  const supabase = await createClient();
  const type = slideType ? slideTypeById(slideType) : undefined;

  const { data, error } = await supabase
    .from("presentations")
    .insert({ title: "Nová prezentace" })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) {
    throw new Error(`Failed to create presentation: ${error?.message}`);
  }

  if (type?.available) {
    const { error: slideError } = await supabase.from("slides").insert({
      presentation_id: data.id,
      position: 1,
      type: type.id,
      config: type.initialConfig,
    });
    if (slideError) {
      throw new Error(`Failed to create slide: ${slideError.message}`);
    }
  }

  revalidatePath("/dashboard");
  if (type) {
    redirect(`/editor/${data.id}`);
  }
}

export async function renamePresentation(id: string, title: string) {
  const trimmed = title.trim();
  if (!trimmed) {
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("presentations")
    .update({ title: trimmed, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    throw new Error(`Failed to rename presentation: ${error.message}`);
  }
  revalidatePath("/dashboard");
}

export async function deletePresentation(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("presentations").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete presentation: ${error.message}`);
  }
  revalidatePath("/dashboard");
}
