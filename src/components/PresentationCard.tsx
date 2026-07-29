"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
    setMenuOpen(false);
    if (confirm(`Smazat „${presentation.title}"?`)) {
      startTransition(() => deletePresentation(presentation.id));
    }
  }

  function handlePresent() {
    setMenuOpen(false);
    startTransition(() => startPresentation(presentation.id));
  }

  const menuItem =
    "block w-full rounded-md px-3 py-2 text-left text-sm text-neutral-700 hover:bg-brand/5 hover:text-brand disabled:opacity-50";

  return (
    <div
      className={`group rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md ${isPending ? "opacity-50" : ""}`}
    >
      <div
        className={`flex aspect-video items-center justify-center rounded-t-xl bg-gradient-to-br ${thumbnailFor(presentation.id)}`}
      >
        <span className="text-4xl font-extrabold text-white/80">
          {presentation.title.charAt(0)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 p-4">
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
            <h2 className="truncate text-sm font-semibold" title={presentation.title}>
              {presentation.title}
            </h2>
          )}
          <p className="mt-0.5 text-xs text-neutral-500">
            {slideCount} {slideCount === 1 ? "slide" : "slides"} · Edited{" "}
            {formatDate(presentation.updated_at)}
          </p>
        </div>

        <div
          className="relative shrink-0"
          onMouseEnter={() => setMenuOpen(true)}
          onMouseLeave={() => setMenuOpen(false)}
        >
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            disabled={isPending}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Možnosti prezentace"
            className="rounded-lg border border-neutral-200 px-2 py-1.5 text-neutral-600 hover:border-brand hover:text-brand disabled:opacity-50"
          >
            <span className="text-lg leading-none">⋯</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 pt-1">
              <div
                role="menu"
                className="w-40 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handlePresent}
                  disabled={isPending}
                  className={menuItem}
                >
                  Prezentovat
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push(`/editor/${presentation.id}`);
                  }}
                  className={menuItem}
                >
                  Upravit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setIsEditing(true);
                  }}
                  className={menuItem}
                >
                  Přejmenovat
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleDelete}
                  disabled={isPending}
                  className={`${menuItem} hover:bg-red-50 hover:text-red-600`}
                >
                  Smazat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
