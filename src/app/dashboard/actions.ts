"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPresentation() {
  const supabase = await createClient();
  const { error } = await supabase
    .from("presentations")
    .insert({ title: "Nová prezentace" });
  if (error) {
    throw new Error(`Failed to create presentation: ${error.message}`);
  }
  revalidatePath("/dashboard");
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
  const { error } = await supabase
    .from("presentations")
    .delete()
    .eq("id", id);
  if (error) {
    throw new Error(`Failed to delete presentation: ${error.message}`);
  }
  revalidatePath("/dashboard");
}
