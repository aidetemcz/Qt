"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { slideTypeById } from "@/lib/slideTypes";
import { templateById } from "@/lib/templates";
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
  // Do koše, ne nadobro — se smazanou prezentací by zmizely i její relace
  // a výsledky. Nasbíranou zpětnou vazbu nemá smazat jeden omylem trefený
  // řádek v nabídce.
  const { error } = await supabase
    .from("presentations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    throw new Error(`Prezentaci se nepodařilo smazat: ${error.message}`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/trash");
}

/** Vrátí prezentaci z koše zpátky mezi ostatní. */
export async function restorePresentation(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("presentations")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) {
    throw new Error(`Prezentaci se nepodařilo vrátit: ${error.message}`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/trash");
}

/** Nadobro — i s relacemi a výsledky, které na ní visí. */
export async function purgePresentation(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("presentations").delete().eq("id", id);
  if (error) {
    throw new Error(`Prezentaci se nepodařilo smazat: ${error.message}`);
  }
  revalidatePath("/trash");
}

/**
 * Kopie prezentace i se slidy. Před školením se stejná prezentace jede
 * znovu, jen s jiným publikem — a výsledky z minula ať zůstanou u originálu.
 */
export async function duplicatePresentation(id: string) {
  const supabase = await createClient();

  const [{ data: original }, { data: slides }] = await Promise.all([
    supabase
      .from("presentations")
      .select("title")
      .eq("id", id)
      .maybeSingle<{ title: string }>(),
    supabase
      .from("slides")
      .select("position, type, config")
      .eq("presentation_id", id)
      .order("position", { ascending: true })
      .returns<{ position: number; type: string; config: unknown }[]>(),
  ]);

  if (!original) {
    throw new Error("Prezentace nenalezena.");
  }

  const { data: copy, error } = await supabase
    .from("presentations")
    .insert({ title: `${original.title} (kopie)` })
    .select("id")
    .single<{ id: string }>();
  if (error || !copy) {
    throw new Error(`Kopii se nepodařilo založit: ${error?.message}`);
  }

  if (slides && slides.length > 0) {
    const { error: slideError } = await supabase.from("slides").insert(
      slides.map((slide) => ({
        presentation_id: copy.id,
        position: slide.position,
        type: slide.type,
        config: slide.config,
      })),
    );
    if (slideError) {
      throw new Error(`Slidy se nepodařilo zkopírovat: ${slideError.message}`);
    }
  }

  revalidatePath("/dashboard");
  redirect(`/editor/${copy.id}`);
}

/** Založí prezentaci z hotové šablony a otevře ji v editoru. */
export async function createFromTemplate(templateId: string) {
  const template = templateById(templateId);
  if (!template) {
    throw new Error("Neznámá šablona.");
  }
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("presentations")
    .insert({ title: template.title })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) {
    throw new Error(`Prezentaci se nepodařilo založit: ${error?.message}`);
  }

  const { error: slideError } = await supabase.from("slides").insert(
    template.slides.map((slide, index) => ({
      presentation_id: data.id,
      position: index + 1,
      type: slide.type,
      config: slide.config,
    })),
  );
  if (slideError) {
    throw new Error(`Slidy se nepodařilo založit: ${slideError.message}`);
  }

  revalidatePath("/dashboard");
  redirect(`/editor/${data.id}`);
}
