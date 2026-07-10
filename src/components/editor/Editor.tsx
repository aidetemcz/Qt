"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
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
  const text = config.heading.trim() || config.body.trim();
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
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const selected = slides.find((slide) => slide.id === selectedId) ?? null;

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
        config: { heading: "", body: "" },
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
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="flex items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-brand hover:text-brand"
          >
            ← Dashboard
          </Link>
          <h1 className="truncate text-sm font-semibold">
            {presentation.title}
          </h1>
        </div>
        <span
          className={`shrink-0 text-xs ${saveState === "error" ? "font-medium text-red-600" : "text-neutral-400"}`}
          aria-live="polite"
        >
          {saveLabels[saveState]}
        </span>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="flex w-full flex-col gap-2 border-b border-neutral-200 bg-white p-3 md:w-56 md:border-b-0 md:border-r">
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
              className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              + Přidat slide
            </button>
            {addMenuOpen && (
              <div className="absolute left-0 right-0 top-full z-10 pt-1">
                <div
                  role="menu"
                  className="rounded-lg border border-neutral-200 bg-white p-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAddMenuOpen(false);
                      addSlide();
                    }}
                    className="flex w-full flex-col rounded-md px-3 py-2 text-left hover:bg-brand/5"
                  >
                    <span className="text-sm font-medium text-neutral-800">
                      Text
                    </span>
                    <span className="text-xs text-neutral-500">
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
                  className={`group rounded-lg border p-2 ${
                    slide.id === selectedId
                      ? "border-brand bg-brand/5"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(slide.id)}
                    className="flex w-full items-start gap-2 text-left"
                  >
                    <span className="shrink-0 text-xs font-bold text-neutral-400">
                      {index + 1}
                    </span>
                    <span className="line-clamp-2 min-w-0 flex-1 text-xs text-neutral-700">
                      {snippet(slide.config)}
                    </span>
                  </button>
                  <div className="mt-1.5 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => moveSlide(index, -1)}
                      disabled={index === 0}
                      title="Posunout nahoru"
                      className="rounded px-1.5 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSlide(index, 1)}
                      disabled={index === slides.length - 1}
                      title="Posunout dolů"
                      className="rounded px-1.5 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSlide(slide)}
                      title="Smazat slide"
                      className="rounded px-1.5 py-0.5 text-xs text-neutral-500 hover:bg-red-50 hover:text-red-600"
                    >
                      Smazat
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex flex-1 items-start justify-center p-4 md:p-8">
          {selected ? (
            <div className="w-full max-w-3xl rounded-xl border border-neutral-200 bg-white p-6 shadow-sm md:aspect-video md:p-10">
              <input
                type="text"
                value={selected.config.heading}
                onChange={(e) =>
                  updateConfig(selected.id, {
                    ...selected.config,
                    heading: e.target.value,
                  })
                }
                placeholder="Nadpis slidu"
                className="w-full border-0 text-2xl font-bold outline-none placeholder:text-neutral-300 md:text-3xl"
              />
              <textarea
                value={selected.config.body}
                onChange={(e) =>
                  updateConfig(selected.id, {
                    ...selected.config,
                    body: e.target.value,
                  })
                }
                placeholder="Text slidu…"
                rows={10}
                className="mt-4 w-full resize-none border-0 text-base text-neutral-700 outline-none placeholder:text-neutral-300"
              />
            </div>
          ) : (
            <p className="mt-16 text-sm text-neutral-500">
              Žádné slidy. Přidej první tlačítkem „Přidat slide".
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
