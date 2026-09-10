"use client";

import { useEffect, useRef, useState } from "react";
import SlideSettingsPanel from "@/components/editor/SlideSettingsPanel";
import {
  BODY_MAX,
  cqh,
  cqw,
  DEFAULT_BODY_SIZE,
  DEFAULT_HEADING_SIZE,
  elementClass,
  elementStyle,
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

/**
 * Doladí výšku pole podle obsahu. Bez toho zůstane pole vysoké na jeden
 * řádek, a po Enteru se dřív napsaný text schová nad horní okraj — vypadá
 * to, že zmizel.
 */
function autoGrow(field: HTMLTextAreaElement | null) {
  if (!field) {
    return;
  }
  field.style.height = "auto";
  field.style.height = `${field.scrollHeight}px`;
}

type Interaction = {
  mode: "move" | "resize";
  id: string;
  startClientX: number;
  startClientY: number;
  startEl: { x: number; y: number; w: number; fontSize: number };
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
      // Corner drag scales the text size; the box hugs the text, so it grows
      // with the font. Dragging down-right enlarges, up-left shrinks.
      const delta = (dx + dy) / 2;
      patchElement(it.id, {
        fontSize: clamp(
          Math.round(it.startEl.fontSize + delta),
          MIN_SIZE,
          MAX_SIZE,
        ),
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
      startEl: { x: el.x, y: el.y, w: el.w, fontSize: el.fontSize },
      scale: currentScale(),
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endInteraction);
  }

  useEffect(() => () => endInteraction(), []);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4 md:p-8">
        <div className="card mx-auto flex w-full max-w-4xl flex-wrap items-center gap-2 p-3">
          <button
            type="button"
            onClick={() => addElement("heading")}
            className="btn btn-primary btn-sm"
          >
            + Přidat nadpis
          </button>
          <button
            type="button"
            onClick={() => addElement("body")}
            className="btn btn-primary btn-sm"
          >
            + Přidat hlavní text
          </button>

          {selected ? (
            <button
              type="button"
              onClick={() => deleteElement(selected.id)}
              className="btn btn-secondary btn-sm ml-auto hover:border-red-300 hover:text-danger"
            >
              Odebrat
            </button>
          ) : (
            <span className="ml-auto text-xs text-muted">
              Tahni pro přesun, roh pro velikost, dvojklik pro psaní.
            </span>
          )}
        </div>

        <div
          ref={frameRef}
          onPointerDown={() => {
            setSelectedId(null);
            setEditingId(null);
          }}
          className="relative mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-card shadow-card ring-1 ring-border"
          style={{
            containerType: "size",
            background: config.background ?? "#ffffff",
          }}
        >
          {config.image?.src && (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary user URLs
            <img
              src={config.image.src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full select-none"
              style={{ objectFit: config.image.fit ?? "cover" }}
            />
          )}

          {elements.length === 0 && !config.image?.src && (
            <div
              className="absolute inset-0 flex items-center justify-center text-neutral-400"
              style={{ fontSize: cqw(28) }}
            >
              Přidej nadpis, text nebo obrázek.
            </div>
          )}

          {elements.map((el) => {
            const isSelected = el.id === selectedId;
            const isEditing = el.id === editingId;
            return (
              <div
                key={el.id}
                className={`absolute ${isSelected ? "outline-2 outline-offset-2 outline-brand rounded-sm" : ""}`}
                style={{
                  left: cqw(el.x),
                  top: cqh(el.y),
                  maxWidth: cqw(SLIDE_W - el.x),
                  width: isEditing ? cqw(SLIDE_W - el.x) : undefined,
                  fontSize: cqw(el.fontSize),
                  ...elementStyle(el),
                }}
              >
                {isEditing ? (
                  <textarea
                    autoFocus
                    ref={autoGrow}
                    value={el.text}
                    maxLength={el.kind === "heading" ? HEADING_MAX : BODY_MAX}
                    onPointerDown={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      autoGrow(e.currentTarget);
                      patchElement(el.id, { text: e.target.value });
                    }}
                    onBlur={() => setEditingId(null)}
                    rows={1}
                    className={`block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-[color:inherit] outline-none [font-size:inherit] [font-weight:inherit] [text-align:inherit] ${elementClass(el.kind)}`}
                  />
                ) : (
                  <div
                    onPointerDown={(e) => startInteraction("move", el, e)}
                    onDoubleClick={() => {
                      setSelectedId(el.id);
                      setEditingId(el.id);
                    }}
                    className={`cursor-move whitespace-pre-wrap break-words ${elementClass(el.kind)}`}
                  >
                    {el.text ||
                      (el.kind === "heading" ? "Nadpis" : "Hlavní text")}
                  </div>
                )}

                {isSelected && !isEditing && (
                  <div
                    onPointerDown={(e) => startInteraction("resize", el, e)}
                    title="Táhni pro změnu velikosti textu"
                    className="absolute h-3.5 w-3.5 cursor-nwse-resize rounded-full border-2 border-brand bg-surface shadow-sm transition-transform duration-150 hover:scale-125"
                    style={{ right: cqw(-6), bottom: cqh(-6) }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SlideSettingsPanel
        config={config}
        selected={selected}
        onPatchElement={(patch) => {
          if (selected) patchElement(selected.id, patch);
        }}
        onPatchConfig={(patch) => onChange({ ...config, ...patch })}
        onDeleteElement={() => {
          if (selected) deleteElement(selected.id);
        }}
      />
    </div>
  );
}
