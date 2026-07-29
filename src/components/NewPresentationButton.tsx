"use client";

import { useTransition } from "react";
import { createPresentation } from "@/app/dashboard/actions";

const defaultClassName =
  "rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60";

export default function NewPresentationButton({
  className = defaultClassName,
  label = "New presentation",
}: {
  className?: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => createPresentation())}
      className={className}
    >
      {isPending ? "Creating…" : label}
    </button>
  );
}
