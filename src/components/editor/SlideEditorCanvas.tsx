"use client";

import { useEffect, useRef, useState } from "react";
import SlideSettingsPanel from "@/components/editor/SlideSettingsPanel";
import {
  BODY_MAX,
  cqh,
  cqw,
  DEFAULT_BODY_SIZE,
  DEFAULT_HEADING_SIZE,
  DEFAULT_IMAGE_W,
  elementClass,
  elementHeight,
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
import { imageAspect, uploadSlideImage } from "@/lib/uploadImage";

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(v, max));

/** Nejužší rám, pod který se prvek tažením nesmrskne. */
const MIN_W = 60;

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

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `el-${Date.now()}`;
}

type Interaction = {
  mode: "move" | "size" | "width";
  id: string;
  startClientX: number;
  startClientY: number;
  startEl: { x: number; y: number; w: number; h: number; fontSize: number };
  scale: number; // base px per screen px
  /** Přesáhlo tažení práh? Pod ním se klik bere jako klik, ne jako přesun. */
  moved: boolean;
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
  const fileInput = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  function addElement(kind: Exclude<SlideElementKind, "image">) {
    const id = newId();
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

  /** Vloží obrázek jako prvek, se kterým jde po slidu hýbat. */
  async function addImage(src: string) {
    const aspect = await imageAspect(src);
    const w = DEFAULT_IMAGE_W;
    const h = Math.round(w / aspect);
    const id = newId();
    commit([
      ...elementsRef.current,
      {
        id,
        kind: "image",
        text: "",
        src,
        fit: "contain",
        x: Math.round((SLIDE_W - w) / 2),
        y: clamp(Math.round((SLIDE_H - h) / 2), 0, SLIDE_H - 40),
        w,
        h: Math.min(h, SLIDE_H),
        fontSize: DEFAULT_BODY_SIZE,
      },
    ]);
    setSelectedId(id);
    setEditingId(null);
  }

  async function pickImage(file: File) {
    setUploadError(null);
    setUploading(true);
    const result = await uploadSlideImage(file);
    setUploading(false);
    if ("error" in result) {
      setUploadError(result.error);
      return;
    }
    await addImage(result.url);
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
    // Do pár pixelů je to pořád klik — jinak by se při psaní omylem hýbalo.
    if (!it.moved && Math.abs(dx) + Math.abs(dy) < 3 * it.scale) {
      return;
    }
    it.moved = true;
    if (it.mode === "move") {
      patchElement(it.id, {
        x: clamp(Math.round(it.startEl.x + dx), 0, SLIDE_W - 40),
        y: clamp(Math.round(it.startEl.y + dy), 0, SLIDE_H - 20),
      });
      return;
    }
    if (it.mode === "width") {
      patchElement(it.id, {
        w: clamp(Math.round(it.startEl.w + dx), MIN_W, SLIDE_W - it.startEl.x),
      });
      return;
    }
    const element = elementsRef.current.find((el) => el.id === it.id);
    if (element?.kind === "image") {
      // Obrázek se zvětšuje za roh a drží si poměr stran.
      const aspect = it.startEl.w / Math.max(it.startEl.h, 1);
      const w = clamp(
        Math.round(it.startEl.w + dx),
        MIN_W,
        SLIDE_W - it.startEl.x,
      );
      patchElement(it.id, { w, h: Math.round(w / aspect) });
      return;
    }
    // U textu roh mění velikost písma; rám se drží obsahu.
    const delta = (dx + dy) / 2;
    patchElement(it.id, {
      fontSize: clamp(
        Math.round(it.startEl.fontSize + delta),
        MIN_SIZE,
        MAX_SIZE,
      ),
    });
  }

  function endInteraction() {
    const it = interaction.current;
    interaction.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endInteraction);
    // Klik bez tažení otevře text k psaní — dvojklik kvůli tomu není potřeba.
    if (it && it.mode === "move" && !it.moved) {
      const element = elementsRef.current.find((el) => el.id === it.id);
      if (element && element.kind !== "image") {
        setEditingId(it.id);
      }
    }
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
      startEl: {
        x: el.x,
        y: el.y,
        w: el.w,
        h: elementHeight(el),
        fontSize: el.fontSize,
      },
      scale: currentScale(),
      moved: false,
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
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) pickImage(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="btn btn-primary btn-sm"
          >
            {uploading ? "Nahrávám…" : "+ Přidat obrázek"}
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
              Klikni pro psaní, tahni pro přesun, za roh pro velikost.
            </span>
          )}
        </div>

        {uploadError && (
          <p className="mx-auto w-full max-w-4xl text-xs text-danger">
            {uploadError}
          </p>
        )}

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
            const isEditing = el.id === editingId && el.kind !== "image";
            return (
              <div
                key={el.id}
                className={`absolute ${isSelected ? "outline-2 outline-offset-2 outline-brand rounded-sm" : ""}`}
                style={{
                  left: cqw(el.x),
                  top: cqh(el.y),
                  width: cqw(el.w),
                  height:
                    el.kind === "image" ? cqh(elementHeight(el)) : undefined,
                  fontSize: cqw(el.fontSize),
                  ...elementStyle(el),
                }}
              >
                {el.kind === "image" ? (
                  <div
                    onPointerDown={(e) => startInteraction("move", el, e)}
                    className="h-full w-full cursor-move"
                  >
                    {el.src ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary user URLs
                      <img
                        src={el.src}
                        alt=""
                        draggable={false}
                        className="pointer-events-none h-full w-full select-none"
                        style={{ objectFit: el.fit ?? "contain" }}
                      />
                    ) : null}
                  </div>
                ) : isEditing ? (
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
                    className={`cursor-text whitespace-pre-wrap break-words ${elementClass(el.kind)}`}
                  >
                    {el.text ||
                      (el.kind === "heading" ? "Nadpis" : "Hlavní text")}
                  </div>
                )}

                {isSelected && !isEditing && (
                  <>
                    {el.kind !== "image" && (
                      <div
                        onPointerDown={(e) => startInteraction("width", el, e)}
                        title="Táhni pro šířku textu"
                        className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-brand bg-surface shadow-sm transition-transform duration-150 hover:scale-125"
                        style={{ right: cqw(-6) }}
                      />
                    )}
                    <div
                      onPointerDown={(e) => startInteraction("size", el, e)}
                      title={
                        el.kind === "image"
                          ? "Táhni pro velikost obrázku"
                          : "Táhni pro velikost písma"
                      }
                      className="absolute h-3.5 w-3.5 cursor-nwse-resize rounded-full border-2 border-brand bg-surface shadow-sm transition-transform duration-150 hover:scale-125"
                      style={{ right: cqw(-6), bottom: cqh(-6) }}
                    />
                  </>
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
