"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { renamePresentation } from "@/app/dashboard/actions";
import SlideEditorCanvas from "@/components/editor/SlideEditorCanvas";
import { getElements } from "@/components/slide/SlideView";
import type { Presentation, Slide, SlideConfig } from "@/lib/presentations";
import { createClient } from "@/lib/supabase/client";

type SaveState = "idle" | "saving" | "saved" | "error";

const saveLabels: Record<SaveState, string> = {
  idle: "",
  saving: "Ukládám…",
  saved: "Uloženo",
  error: "Chyba při ukládání",
};

function snippet(config: SlideConfig): string {
  const text = getElements(config)
    .map((el) => el.text)
    .join(" ")
    .trim();
  return text || "Prázdný slide";
}

export default function Editor({
  presentation,
  initialSlides,
}: {
  presentation: Presentation;
  initialSlides: Slide[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSlides[0]?.id ?? null,
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [title, setTitle] = useState(presentation.title);
  const savedTitle = useRef(presentation.title);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const selected = slides.find((slide) => slide.id === selectedId) ?? null;

  async function commitTitle() {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(savedTitle.current);
      return;
    }
    if (trimmed === savedTitle.current) {
      return;
    }
    setSaveState("saving");
    try {
      await renamePresentation(presentation.id, trimmed);
      savedTitle.current = trimmed;
      setTitle(trimmed);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  function updateConfig(id: string, config: SlideConfig) {
    setSlides((prev) =>
      prev.map((slide) => (slide.id === id ? { ...slide, config } : slide)),
    );
    setSaveState("saving");
    const timers = saveTimers.current;
    clearTimeout(timers.get(id));
    timers.set(
      id,
      setTimeout(async () => {
        timers.delete(id);
        const { error } = await supabase
          .from("slides")
          .update({ config })
          .eq("id", id);
        setSaveState(error ? "error" : timers.size > 0 ? "saving" : "saved");
      }, 1000),
    );
  }

  async function addSlide() {
    setSaveState("saving");
    const lastPosition = slides[slides.length - 1]?.position ?? 0;
    const { data, error } = await supabase
      .from("slides")
      .insert({
        presentation_id: presentation.id,
        position: lastPosition + 1,
        type: "text",
        config: { elements: [] },
      })
      .select("id, presentation_id, position, type, config")
      .single<Slide>();
    if (error || !data) {
      setSaveState("error");
      return;
    }
    setSlides((prev) => [...prev, data]);
    setSelectedId(data.id);
    setSaveState("saved");
  }

  async function deleteSlide(slide: Slide) {
    if (!confirm(`Smazat slide „${snippet(slide.config)}"?`)) {
      return;
    }
    clearTimeout(saveTimers.current.get(slide.id));
    saveTimers.current.delete(slide.id);
    setSaveState("saving");
    const { error } = await supabase
      .from("slides")
      .delete()
      .eq("id", slide.id);
    if (error) {
      setSaveState("error");
      return;
    }
    setSlides((prev) => {
      const next = prev.filter((s) => s.id !== slide.id);
      if (selectedId === slide.id) {
        const index = prev.findIndex((s) => s.id === slide.id);
        setSelectedId(next[Math.min(index, next.length - 1)]?.id ?? null);
      }
      return next;
    });
    setSaveState("saved");
  }

  async function moveSlide(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slides.length) {
      return;
    }
    const a = slides[index];
    const b = slides[target];
    const reordered = [...slides];
    reordered[index] = { ...b, position: a.position };
    reordered[target] = { ...a, position: b.position };
    setSlides(reordered);
    setSaveState("saving");
    const [first, second] = await Promise.all([
      supabase.from("slides").update({ position: b.position }).eq("id", a.id),
      supabase.from("slides").update({ position: a.position }).eq("id", b.id),
    ]);
    setSaveState(first.error || second.error ? "error" : "saved");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="topbar sticky top-0 z-20 flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard" className="btn btn-secondary btn-sm shrink-0">
            ← Dashboard
          </Link>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              } else if (e.key === "Escape") {
                setTitle(savedTitle.current);
                e.currentTarget.blur();
              }
            }}
            aria-label="Název prezentace"
            placeholder="Název prezentace"
            className="min-w-0 flex-1 truncate rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-neutral-900 transition-colors duration-150 outline-none hover:border-border hover:bg-background focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs transition-colors duration-150 ${
            saveState === "error"
              ? "bg-red-50 font-medium text-danger"
              : "text-muted"
          } ${saveState === "saved" ? "animate-pop" : ""}`}
          aria-live="polite"
        >
          {saveLabels[saveState]}
        </span>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="flex w-full flex-col gap-3 border-b border-border bg-surface p-3 md:w-64 md:border-b-0 md:border-r">
          <div
            className="relative"
            onMouseEnter={() => setAddMenuOpen(true)}
            onMouseLeave={() => setAddMenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => setAddMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={addMenuOpen}
              className="btn btn-primary w-full"
            >
              + Přidat slide
            </button>
            {addMenuOpen && (
              <div className="absolute left-0 right-0 top-full z-10 pt-1.5">
                <div role="menu" className="menu-surface animate-fade-in">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAddMenuOpen(false);
                      addSlide();
                    }}
                    className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors duration-150 hover:bg-brand-50"
                  >
                    <span className="text-sm font-medium text-neutral-900">
                      Text
                    </span>
                    <span className="text-xs text-muted">
                      Nadpis a odstavec textu
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
          <ul className="flex flex-col gap-2 overflow-y-auto">
            {slides.map((slide, index) => (
              <li key={slide.id}>
                <div
                  className={`group animate-fade-in rounded-xl border p-2.5 transition-all duration-150 ${
                    slide.id === selectedId
                      ? "border-brand bg-brand-50 shadow-sm"
                      : "border-border bg-surface hover:border-brand/40 hover:bg-brand-50/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(slide.id)}
                    className="flex w-full items-start gap-2 text-left"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[0.6875rem] font-bold ${
                        slide.id === selectedId
                          ? "bg-brand text-white"
                          : "bg-background text-muted"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="line-clamp-2 min-w-0 flex-1 text-xs leading-relaxed text-neutral-700">
                      {snippet(slide.config)}
                    </span>
                  </button>
                  <div className="mt-1.5 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => moveSlide(index, -1)}
                      disabled={index === 0}
                      title="Posunout nahoru"
                      className="rounded-md px-1.5 py-0.5 text-xs text-muted transition-colors duration-150 hover:bg-background hover:text-neutral-900 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSlide(index, 1)}
                      disabled={index === slides.length - 1}
                      title="Posunout dolů"
                      className="rounded-md px-1.5 py-0.5 text-xs text-muted transition-colors duration-150 hover:bg-background hover:text-neutral-900 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSlide(slide)}
                      title="Smazat slide"
                      className="rounded-md px-1.5 py-0.5 text-xs text-muted transition-colors duration-150 hover:bg-red-50 hover:text-danger"
                    >
                      Smazat
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex flex-1 flex-col items-center gap-4 overflow-auto p-4 md:p-8">
          {selected ? (
            <SlideEditorCanvas
              config={selected.config}
              onChange={(config) => updateConfig(selected.id, config)}
            />
          ) : (
            <p className="mt-16 text-sm text-muted">
              Žádné slidy. Přidej první tlačítkem „Přidat slide".
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
