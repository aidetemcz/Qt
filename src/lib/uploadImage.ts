import { createClient } from "@/lib/supabase/client";

/** Veřejný Storage bucket s obrázky na slidech. */
export const IMAGE_BUCKET = "slide-images";

/**
 * Nahraje obrázek do Storage a vrátí veřejnou adresu. Používá to jak obrázek
 * na pozadí slidu, tak vložený obrázkový prvek, ať se chovají stejně.
 */
export async function uploadSlideImage(
  file: File,
): Promise<{ url: string } | { error: string }> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { cacheControl: "3600" });
  if (error) {
    return {
      error: `Nahrání se nepovedlo: ${error.message}. Zkontroluj, že existuje veřejný bucket „${IMAGE_BUCKET}".`,
    };
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return { url: publicUrl };
}

/**
 * Rozměry obrázku, aby se vložil ve správném poměru stran. Když se načíst
 * nepovede, vrátí se 4:3 — prvek pak jde doladit tažením za roh.
 */
export function imageAspect(src: string): Promise<number> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () =>
      resolve(
        image.naturalHeight > 0
          ? image.naturalWidth / image.naturalHeight
          : 4 / 3,
      );
    image.onerror = () => resolve(4 / 3);
    image.src = src;
  });
}
