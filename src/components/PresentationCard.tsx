"use client";

import Link from "next/link";
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
  return new Date(isoDate).toLocaleDateString("cs-CZ", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** 1 slide, 2–4 slidy, jinak slidů. */
function slideWord(count: number): string {
  if (count === 1) {
    return "slide";
  }
  return count >= 2 && count <= 4 ? "slidy" : "slidů";
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

  const menuItem = "menu-item";

  return (
    <div
      className={`group card card-interactive animate-slide-up ${isPending ? "opacity-60" : ""}`}
    >
      {/* Náhled i název vedou rovnou do editoru, jako odkaz — jde tedy
          otevřít i v nové kartě. */}
      <Link
        href={`/editor/${presentation.id}`}
        aria-label={`Upravit ${presentation.title}`}
        className={`flex aspect-video items-center justify-center overflow-hidden rounded-t-2xl bg-gradient-to-br ${thumbnailFor(presentation.id)}`}
      >
        <span className="text-5xl font-extrabold text-white/90 drop-shadow-sm transition-transform duration-200 ease-out motion-safe:group-hover:scale-110">
          {presentation.title.charAt(0)}
        </span>
      </Link>
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
              className="input px-2 py-1 text-sm font-semibold"
            />
          ) : (
            <Link
              href={`/editor/${presentation.id}`}
              title={presentation.title}
              className="block truncate text-[0.9375rem] font-semibold text-neutral-900 transition-colors duration-150 hover:text-brand"
            >
              {presentation.title}
            </Link>
          )}
          <p className="mt-1 text-xs text-muted">
            {slideCount} {slideWord(slideCount)} · Upraveno{" "}
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
            className="btn btn-secondary btn-sm px-2.5 py-1.5"
          >
            <span className="text-lg leading-none">⋯</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 bottom-full z-20 pb-1.5">
              <div role="menu" className="menu-surface animate-fade-in w-44">
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
                    router.push(`/results/${presentation.id}`);
                  }}
                  className={menuItem}
                >
                  Výsledky
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
                  className={`${menuItem} hover:bg-red-50 hover:text-danger`}
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
