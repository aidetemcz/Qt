"use client";

import { useTransition } from "react";
import { createPresentation } from "@/app/dashboard/actions";

const defaultClassName = "btn btn-primary";

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
