"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  deletePresentation,
  renamePresentation,
  startPresentation,
} from "@/app/dashboard/actions";
import type { Presentation } from "@/lib/presentations";

/** Tailwind gradient classes for the card thumbnail placeholder */
const thumbnails = [
  "from-brand to-accent",
  "from-accent to-accent-dark",
  "from-brand-dark to-brand",
  "from-accent-dark to-brand",
];

function thumbnailFor(id: string): string {
  let hash = 0;
  for (const char of id) {
    hash = (hash + char.charCodeAt(0)) % thumbnails.length;
  }
  return thumbnails[hash];
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function PresentationCard({
  presentation,
  slideCount,
}: {
  presentation: Presentation;
  slideCount: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submitTitle(value: string) {
    setIsEditing(false);
    const trimmed = value.trim();
    if (!trimmed || trimmed === presentation.title) {
      return;
    }
    startTransition(() => renamePresentation(presentation.id, trimmed));
  }

  function handleDelete() {
    if (confirm(`Delete "${presentation.title}"?`)) {
      startTransition(() => deletePresentation(presentation.id));
    }
  }

  function handlePresent() {
    startTransition(() => startPresentation(presentation.id));
  }

  return (
    <div
      className={`group overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md ${isPending ? "opacity-50" : ""}`}
    >
      <div
        className={`flex aspect-video items-center justify-center bg-gradient-to-br ${thumbnailFor(presentation.id)}`}
      >
        <span className="text-4xl font-extrabold text-white/80">
          {presentation.title.charAt(0)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <input
              type="text"
              autoFocus
              defaultValue={presentation.title}
              onBlur={(e) => submitTitle(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                } else if (e.key === "Escape") {
                  e.currentTarget.value = presentation.title;
                  e.currentTarget.blur();
                }
              }}
              className="w-full rounded border border-brand/50 px-1.5 py-0.5 text-sm font-semibold outline-none focus:border-brand"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              title="Rename"
              className="block max-w-full truncate text-left text-sm font-semibold hover:text-brand"
            >
              {presentation.title}
            </button>
          )}
          <p className="mt-0.5 text-xs text-neutral-500">
            {slideCount} {slideCount === 1 ? "slide" : "slides"} · Edited{" "}
            {formatDate(presentation.updated_at)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handlePresent}
            disabled={isPending}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            Prezentovat
          </button>
          <Link
            href={`/editor/${presentation.id}`}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-brand hover:text-brand"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-brand hover:text-brand disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
