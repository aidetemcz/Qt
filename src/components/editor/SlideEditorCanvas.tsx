"use client";

import { useEffect, useRef, useState } from "react";
import {
  BODY_MAX,
  cqh,
  cqw,
  DEFAULT_BODY_SIZE,
  DEFAULT_HEADING_SIZE,
  elementClass,
  getElements,
  HEADING_MAX,
  MAX_SIZE,
  MIN_SIZE,
  SLIDE_H,
  SLIDE_W,
} from "@/components/slide/SlideView";
import type {
  SlideConfig,
  SlideElement,
  SlideElementKind,
} from "@/lib/presentations";

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(v, max));

type Interaction = {
  mode: "move" | "resize";
  id: string;
  startClientX: number;
  startClientY: number;
  startEl: { x: number; y: number; w: number };
  scale: number; // base px per screen px
};

export default function SlideEditorCanvas({
  config,
  onChange,
}: {
  config: SlideConfig;
  onChange: (config: SlideConfig) => void;
}) {
  const elements = getElements(config);
  const elementsRef = useRef<SlideElement[]>(elements);
  elementsRef.current = elements;

  const frameRef = useRef<HTMLDivElement>(null);
  const interaction = useRef<Interaction | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const selected = elements.find((el) => el.id === selectedId) ?? null;

  function commit(next: SlideElement[]) {
    onChange({ ...config, elements: next });
  }
  function patchElement(id: string, patch: Partial<SlideElement>) {
    commit(
      elementsRef.current.map((el) =>
        el.id === id ? { ...el, ...patch } : el,
      ),
    );
  }

  function addElement(kind: SlideElementKind) {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `el-${Date.now()}`;
    const el: SlideElement = {
      id,
      kind,
      text: kind === "heading" ? "Nadpis" : "Hlavní text",
      x: 96,
      y: kind === "heading" ? 96 : 220,
      w: SLIDE_W - 192,
      fontSize: kind === "heading" ? DEFAULT_HEADING_SIZE : DEFAULT_BODY_SIZE,
    };
    commit([...elementsRef.current, el]);
    setSelectedId(id);
    setEditingId(null);
  }

  function deleteElement(id: string) {
    commit(elementsRef.current.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) setEditingId(null);
  }

  function currentScale() {
    const frame = frameRef.current;
    return frame ? SLIDE_W / frame.clientWidth : 1;
  }

  function onPointerMove(e: PointerEvent) {
    const it = interaction.current;
    if (!it) return;
    const dx = (e.clientX - it.startClientX) * it.scale;
    const dy = (e.clientY - it.startClientY) * it.scale;
    if (it.mode === "move") {
      patchElement(it.id, {
        x: clamp(Math.round(it.startEl.x + dx), 0, SLIDE_W - 40),
        y: clamp(Math.round(it.startEl.y + dy), 0, SLIDE_H - 20),
      });
    } else {
      patchElement(it.id, {
        w: clamp(Math.round(it.startEl.w + dx), 60, SLIDE_W - it.startEl.x),
      });
    }
  }

  function endInteraction() {
    interaction.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endInteraction);
  }

  function startInteraction(
    mode: Interaction["mode"],
    el: SlideElement,
    e: React.PointerEvent,
  ) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(el.id);
    interaction.current = {
      mode,
      id: el.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startEl: { x: el.x, y: el.y, w: el.w },
      scale: currentScale(),
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endInteraction);
  }

  useEffect(() => () => endInteraction(), []);

  return (
    <div className="flex w-full max-w-4xl flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3">
        <button
          type="button"
          onClick={() => addElement("heading")}
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          + Přidat nadpis
        </button>
        <button
          type="button"
          onClick={() => addElement("body")}
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          + Přidat hlavní text
        </button>

        {selected ? (
          <div className="ml-auto flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-neutral-500">
              Velikost ({selected.fontSize})
              <input
                type="range"
                min={MIN_SIZE}
                max={MAX_SIZE}
                value={selected.fontSize}
                onChange={(e) =>
                  patchElement(selected.id, {
                    fontSize: Number(e.target.value),
                  })
                }
                className="w-40 accent-brand"
              />
            </label>
            <button
              type="button"
              onClick={() => deleteElement(selected.id)}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:border-red-300 hover:text-red-600"
            >
              Odebrat
            </button>
          </div>
        ) : (
          <span className="ml-auto text-xs text-neutral-400">
            Klikni na text pro úpravu, tahni pro přesun, dvojklik pro psaní.
          </span>
        )}
      </div>

      <div
        ref={frameRef}
        onPointerDown={() => {
          setSelectedId(null);
          setEditingId(null);
        }}
        className="relative aspect-video w-full overflow-hidden rounded-xl bg-white shadow-sm"
        style={{ containerType: "size" }}
      >
        {elements.length === 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center text-neutral-400"
            style={{ fontSize: cqw(28) }}
          >
            Přidej nadpis nebo text tlačítky nahoře.
          </div>
        )}

        {elements.map((el) => {
          const isSelected = el.id === selectedId;
          const isEditing = el.id === editingId;
          return (
            <div
              key={el.id}
              className={`absolute ${isSelected ? "outline outline-2 outline-brand" : ""}`}
              style={{
                left: cqw(el.x),
                top: cqh(el.y),
                width: cqw(el.w),
                fontSize: cqw(el.fontSize),
              }}
            >
              {isEditing ? (
                <textarea
                  autoFocus
                  value={el.text}
                  maxLength={el.kind === "heading" ? HEADING_MAX : BODY_MAX}
                  onPointerDown={(e) => e.stopPropagation()}
                  onChange={(e) => patchElement(el.id, { text: e.target.value })}
                  onBlur={() => setEditingId(null)}
                  rows={1}
                  className={`block w-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none [font-size:inherit] ${elementClass(el.kind)}`}
                />
              ) : (
                <div
                  onPointerDown={(e) => startInteraction("move", el, e)}
                  onDoubleClick={() => {
                    setSelectedId(el.id);
                    setEditingId(el.id);
                  }}
                  className={`w-full cursor-move whitespace-pre-wrap break-words ${elementClass(el.kind)}`}
                >
                  {el.text || (el.kind === "heading" ? "Nadpis" : "Hlavní text")}
                </div>
              )}

              {isSelected && !isEditing && (
                <div
                  onPointerDown={(e) => startInteraction("resize", el, e)}
                  className="absolute top-1/2 h-3 w-3 -translate-y-1/2 cursor-ew-resize rounded-sm border border-brand bg-white"
                  style={{ right: cqw(-6) }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
