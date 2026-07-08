"use client";

import { useTransition } from "react";
import { createPresentation } from "@/app/dashboard/actions";

export default function NewPresentationButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => createPresentation())}
      className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
    >
      {isPending ? "Creating…" : "New presentation"}
    </button>
  );
}
