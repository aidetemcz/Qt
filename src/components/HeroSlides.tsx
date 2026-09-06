"use client";

import { useEffect, useState } from "react";
import SlideView, { type CloudWord } from "@/components/slide/SlideView";
import type { SlideConfig } from "@/lib/presentations";

/** Jeden slide ukázky i s daty, která by k němu v prezentaci přitekla. */
type Demo = {
  config: SlideConfig;
  words?: CloudWord[];
  answerCounts?: Record<string, number>;
  questions?: string[];
};

const DEMOS: Demo[] = [
  {
    config: {
      quiz: {
        question: "Kolik krajů má Česko?",
        answers: [
          { id: "a", text: "8" },
          { id: "b", text: "14", correct: true },
          { id: "c", text: "12" },
          { id: "d", text: "16" },
        ],
      },
    },
    answerCounts: { a: 2, b: 11, c: 4, d: 1 },
  },
  {
    config: {
      background: "#f1f7f9",
      wordcloud: { question: "Jedním slovem: jak se dnes cítíš?" },
    },
    words: [
      { text: "natěšeně", count: 9 },
      { text: "zvědavě", count: 6 },
      { text: "v pohodě", count: 4 },
      { text: "ospale", count: 3 },
      { text: "nervózně", count: 2 },
    ],
  },
  {
    config: {
      background: "#fdf1ef",
      elements: [
        {
          id: "heading",
          kind: "heading",
          text: "Co nás dnes čeká",
          x: 72,
          y: 120,
          w: 816,
          fontSize: 72,
        },
        {
          id: "body",
          kind: "body",
          text: "Tři otázky, jedna anketa\na prostor na vaše dotazy.",
          x: 72,
          y: 260,
          w: 816,
          fontSize: 34,
        },
      ],
    },
  },
  {
    config: {
      poll: {
        question: "Kdy dáme přestávku?",
        answers: [
          { id: "a", text: "Za deset minut" },
          { id: "b", text: "Až po kvízu" },
          { id: "c", text: "Vydržíme do konce" },
          { id: "d", text: "" },
        ],
      },
    },
    answerCounts: { a: 7, b: 9, c: 3 },
  },
  {
    config: {
      background: "#241d1a",
      quiz: {
        question: "Nejdelší řeka Česka je Vltava.",
        answers: [
          { id: "a", text: "Pravda", correct: true },
          { id: "b", text: "Lež" },
        ],
      },
    },
    answerCounts: { a: 12, b: 6 },
  },
  {
    config: {
      background: "#f6efea",
      qa: { question: "Na co se chcete zeptat?" },
    },
    questions: [
      "Jak si mám připravit vlastní kvíz?",
      "Půjde prezentaci pustit i z mobilu?",
      "Kolik lidí se může připojit najednou?",
      "Dají se výsledky někam uložit?",
    ],
  },
];

const ROTATE_MS = 4500;

function Card({ demo }: { demo: Demo }) {
  return (
    <SlideView
      config={demo.config}
      words={demo.words}
      answerCounts={demo.answerCounts}
      questions={demo.questions}
    />
  );
}

/**
 * Ukázka slidů pod nadpisem. Trojice se posouvá dokola, takže na stránce
 * postupně proběhnou všechny typy. Vykresluje je SlideView, tedy stejná
 * komponenta jako editor i prezentace.
 */
export default function HeroSlides() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Kdo si vypnul animace, dostane statickou ukázku.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % DEMOS.length),
      ROTATE_MS,
    );
    return () => clearInterval(timer);
  }, []);

  const left = DEMOS[index % DEMOS.length];
  const center = DEMOS[(index + 1) % DEMOS.length];
  const right = DEMOS[(index + 2) % DEMOS.length];

  return (
    <div className="flex w-full max-w-5xl items-center justify-center gap-4">
      <div className="hidden w-64 -rotate-6 overflow-hidden rounded-card shadow-card ring-1 ring-border sm:block lg:w-72">
        <div key={`left-${index}`} className="animate-fade-in">
          <Card demo={left} />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm shrink-0 lg:max-w-md">
        <div className="overflow-hidden rounded-card shadow-pop ring-1 ring-border">
          <div key={`center-${index}`} className="animate-fade-in">
            <Card demo={center} />
          </div>
        </div>
        <div className="absolute -top-3 -right-2 flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 shadow-card ring-1 ring-border">
          <span className="h-1.5 w-1.5 rounded-full bg-brand motion-safe:animate-pulse" />
          <span className="text-[0.625rem] font-bold tracking-wide text-brand uppercase">
            Živě
          </span>
          <span className="font-mono text-[0.625rem] font-bold tracking-widest text-muted">
            042 317
          </span>
        </div>
      </div>

      <div className="hidden w-64 rotate-6 overflow-hidden rounded-card shadow-card ring-1 ring-border sm:block lg:w-72">
        <div key={`right-${index}`} className="animate-fade-in">
          <Card demo={right} />
        </div>
      </div>
    </div>
  );
}
