"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { renamePresentation, startPresentation } from "@/app/dashboard/actions";
import QuestionEditor from "@/components/editor/QuestionEditor";
import SlideEditorCanvas from "@/components/editor/SlideEditorCanvas";
import SlideTypePicker from "@/components/editor/SlideTypePicker";
import PromptEditor from "@/components/editor/PromptEditor";
import SlideView, {
  getElements,
  getInteraction,
} from "@/components/slide/SlideView";
import {
  SLIDE_TYPES,
  slideTypeById,
  type SlideTypeDef,
} from "@/lib/slideTypes";
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
  if (config.wordcloud) {
    return config.wordcloud.question.trim() || "Word cloud";
  }
  if (config.qa) {
    return config.qa.question.trim() || "Otázky a odpovědi";
  }
  const interaction = getInteraction(config);
  if (interaction) {
    return (
      interaction.question.trim() ||
      (interaction.kind === "quiz" ? "Kvízová otázka" : "Anketa")
    );
  }
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
  // When open, the working area shows the slide-type chooser instead of the
  // canvas (Kahoot style) — the rail stays visible the whole time.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [title, setTitle] = useState(presentation.title);
  const savedTitle = useRef(presentation.title);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const [isPresenting, startPresenting] = useTransition();

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

  async function addSlide(type: SlideTypeDef = SLIDE_TYPES[0]) {
    setSaveState("saving");
    const lastPosition = slides[slides.length - 1]?.position ?? 0;
    const { data, error } = await supabase
      .from("slides")
      .insert({
        presentation_id: presentation.id,
        position: lastPosition + 1,
        type: type.id,
        config: type.initialConfig,
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

  /** Dopíše rozepsané změny hned. Prezentace se načítá z databáze, takže
   *  bez toho by se promítla verze o vteřinu starší. */
  async function flushSaves() {
    const timers = saveTimers.current;
    if (timers.size === 0) {
      return;
    }
    const ids = [...timers.keys()];
    for (const id of ids) {
      clearTimeout(timers.get(id));
    }
    timers.clear();
    setSaveState("saving");
    const results = await Promise.all(
      ids.map((id) => {
        const pending = slides.find((s) => s.id === id);
        return pending
          ? supabase
              .from("slides")
              .update({ config: pending.config })
              .eq("id", id)
          : Promise.resolve({ error: null });
      }),
    );
    setSaveState(results.some((r) => r.error) ? "error" : "saved");
  }

  async function present() {
    await flushSaves();
    startPresenting(() => startPresentation(presentation.id));
  }

  async function deleteSlide(slide: Slide) {
    if (!confirm(`Smazat slide „${snippet(slide.config)}"?`)) {
      return;
    }
    clearTimeout(saveTimers.current.get(slide.id));
    saveTimers.current.delete(slide.id);
    setSaveState("saving");
    const { error } = await supabase.from("slides").delete().eq("id", slide.id);
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
    // Na širokém okně editor vyplní obrazovku a scrolluje se uvnitř sloupců —
    // jinak by dlouhý seznam slidů odsunul pracovní plochu mimo obraz.
    <div className="flex min-h-screen flex-col bg-background md:h-screen md:min-h-0 md:overflow-hidden">
      <header className="topbar sticky top-0 z-20 flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard" className="btn btn-secondary btn-sm shrink-0">
            ← Prezentace
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
        <div className="flex shrink-0 items-center gap-3">
          <span
            className={`rounded-full px-2.5 py-1 text-xs transition-colors duration-150 ${
              saveState === "error"
                ? "bg-red-50 font-medium text-danger"
                : "text-muted"
            } ${saveState === "saved" ? "animate-pop" : ""}`}
            aria-live="polite"
          >
            {saveLabels[saveState]}
          </span>
          <button
            type="button"
            onClick={present}
            disabled={isPresenting || slides.length === 0}
            title={
              slides.length === 0
                ? "Nejdřív přidej aspoň jeden slide"
                : undefined
            }
            className="btn btn-primary btn-sm"
          >
            {isPresenting ? "Spouštím…" : "Prezentovat"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:min-h-0 md:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface md:min-h-0 md:w-56 md:border-b-0 md:border-r">
          <ul className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 md:min-h-0">
            {slides.map((slide, index) => (
              <li key={slide.id} className="animate-fade-in">
                <div
                  className={`group relative rounded-2xl border p-2 transition-all duration-150 ${
                    slide.id === selectedId && !pickerOpen
                      ? "border-brand bg-brand-50 shadow-sm"
                      : "border-border bg-surface hover:border-brand/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setPickerOpen(false);
                      setSelectedId(slide.id);
                    }}
                    className="block w-full text-left"
                    title={snippet(slide.config)}
                  >
                    <span className="mb-1.5 flex items-center gap-1.5">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md text-[0.6875rem] font-bold ${
                          slide.id === selectedId && !pickerOpen
                            ? "bg-brand text-white"
                            : "bg-sunken text-muted"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="truncate text-[0.625rem] font-semibold tracking-wide text-muted uppercase">
                        {slideTypeById(slide.type)?.label ?? slide.type}
                      </span>
                    </span>
                    {/* Live miniature of the slide itself. */}
                    <span className="pointer-events-none block overflow-hidden rounded-xl ring-1 ring-border">
                      <SlideView config={slide.config} />
                    </span>
                  </button>
                  <div className="mt-1.5 flex items-center justify-end gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => moveSlide(index, -1)}
                      disabled={index === 0}
                      title="Posunout nahoru"
                      className="rounded-md px-1.5 py-0.5 text-xs text-muted transition-colors duration-150 hover:bg-sunken hover:text-ink disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSlide(index, 1)}
                      disabled={index === slides.length - 1}
                      title="Posunout dolů"
                      className="rounded-md px-1.5 py-0.5 text-xs text-muted transition-colors duration-150 hover:bg-sunken hover:text-ink disabled:opacity-30"
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

          <div
            className="border-t border-border p-3"
            onMouseEnter={() => setPickerOpen(true)}
          >
            <button
              type="button"
              onClick={() => setPickerOpen((open) => !open)}
              aria-expanded={pickerOpen}
              className="btn btn-primary w-full"
            >
              + Přidat slide
            </button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 overflow-hidden md:min-h-0">
          {pickerOpen ? (
            <div className="flex flex-1 justify-center overflow-auto p-4 md:p-8">
              <SlideTypePicker
                onClose={() => setPickerOpen(false)}
                onPick={(type) => {
                  setPickerOpen(false);
                  addSlide(type);
                }}
              />
            </div>
          ) : selected ? (
            selected.config.wordcloud || selected.config.qa ? (
              <PromptEditor
                key={selected.id}
                kind={selected.config.wordcloud ? "wordcloud" : "qa"}
                config={selected.config}
                onChange={(config) => updateConfig(selected.id, config)}
              />
            ) : getInteraction(selected.config) ? (
              <QuestionEditor
                key={selected.id}
                kind={getInteraction(selected.config)!.kind}
                lockedAnswers={selected.type === "truefalse"}
                config={selected.config}
                onChange={(config) => updateConfig(selected.id, config)}
              />
            ) : (
              <SlideEditorCanvas
                key={selected.id}
                config={selected.config}
                onChange={(config) => updateConfig(selected.id, config)}
              />
            )
          ) : (
            <div className="mx-auto mt-20 text-center">
              <p className="text-base font-semibold text-ink">
                Zatím žádné slidy
              </p>
              <p className="mt-2 text-sm text-muted">
                Přidej první tlačítkem „Přidat slide".
              </p>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="btn btn-primary mt-6"
              >
                + Přidat slide
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
