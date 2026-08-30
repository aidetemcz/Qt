"use client";

import { useTransition } from "react";
import { createPresentation } from "@/app/dashboard/actions";

const defaultClassName = "btn btn-primary";

export default function NewPresentationButton({
  className = defaultClassName,
  label = "Nová prezentace",
  slideType,
}: {
  className?: string;
  label?: string;
  /** Typ prvního slidu; s ním se rovnou otevře editor. */
  slideType?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => createPresentation(slideType))}
      className={className}
    >
      {isPending ? "Vytvářím…" : label}
    </button>
  );
}
