"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Ukončí běžící relaci. Když přednášející zavře okno místo kliknutí na
 * "Ukončit prezentaci", zůstane relace aktivní — odsud se dá dorazit.
 */
export async function endSession(sessionId: string, presentationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ is_active: false })
    .eq("id", sessionId);
  if (error) {
    throw new Error(`Relaci se nepodařilo ukončit: ${error.message}`);
  }
  revalidatePath(`/results/${presentationId}`);
}
