"use client";

/**
 * Spaced review, as a Leitner ladder.
 *
 * `progress.ts` answers "has this letter been opened?" — one bit per letter,
 * which is the right state for the stage map and the deck. It cannot answer
 * "what is worth reviewing today", because that needs a date and a history.
 *
 * This is kept as its own key rather than widened into Progress so the stage
 * map, the deck and the games keep reading exactly what they read before. A
 * student who already has learned letters is seeded into box 1, due today.
 *
 * Every drill reports its result here — one scheduler behind all of them, so a
 * letter missed in a listening drill comes back in the pair drill too.
 */

import { useCallback, useEffect, useState } from "react";
import type { Confusions } from "./similarity";

const KEY = "hangul-melon:srs:v1";
const PROGRESS_KEY = "hangul-melon:progress:v1";

/** Days until a card in box n comes back. Box 1 is same-day. */
const INTERVALS = [0, 0, 1, 3, 7, 16, 35];
export const TOP_BOX = INTERVALS.length - 1;

export interface SrsCard {
  /** 1..TOP_BOX — how well established the letter is */
  box: number;
  /** ISO date (YYYY-MM-DD) this card is next due */
  due: string;
  seen: number;
  wrong: number;
}

export interface DayResult {
  right: number;
  total: number;
  /** ISO date the day was finished */
  on: string;
}

export interface SrsState {
  cards: Record<string, SrsCard>;
  /** answer letter -> what was picked instead -> how many times */
  confusions: Confusions;
  /** path day number -> how it went */
  days: Record<string, DayResult>;
}

const EMPTY: SrsState = { cards: {}, confusions: {}, days: {} };

const today = () => new Date().toISOString().slice(0, 10);

const plusDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Letters already marked learned start as fresh box-1 cards, due now. */
function seedFromProgress(): SrsState {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return EMPTY;
    const learned = (JSON.parse(raw) as { learned?: Record<string, true> }).learned ?? {};
    const cards: Record<string, SrsCard> = {};
    for (const ch of Object.keys(learned)) {
      cards[ch] = { box: 1, due: today(), seen: 0, wrong: 0 };
    }
    return { cards, confusions: {}, days: {} };
  } catch {
    return EMPTY;
  }
}

function read(): SrsState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedFromProgress();
    const parsed = JSON.parse(raw) as Partial<SrsState>;
    return {
      cards: parsed.cards ?? {},
      confusions: parsed.confusions ?? {},
      days: parsed.days ?? {},
    };
  } catch {
    return EMPTY;
  }
}

function write(s: SrsState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode / quota — the schedule just won't persist */
  }
}

/** A right answer moves up one box; a wrong answer drops to box 1. */
function grade(card: SrsCard | undefined, ok: boolean): SrsCard {
  const base = card ?? { box: 1, due: today(), seen: 0, wrong: 0 };
  const box = ok ? Math.min(TOP_BOX, base.box + 1) : 1;
  return {
    box,
    due: plusDays(INTERVALS[box]),
    seen: base.seen + 1,
    wrong: base.wrong + (ok ? 0 : 1),
  };
}

export function dueKeys(state: SrsState): string[] {
  const d = today();
  return Object.keys(state.cards)
    .filter((ch) => state.cards[ch].due <= d)
    .sort((a, b) => state.cards[a].box - state.cards[b].box);
}

export function useSrs() {
  // Start empty so server and first client render agree, then hydrate.
  const [state, setState] = useState<SrsState>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = read();
    write(s);
    setState(s);
    setReady(true);
  }, []);

  /**
   * Record one answer. `picked` is the letter chosen when it was the wrong one —
   * that, not the miss itself, is what makes the confusion list personal.
   */
  const answer = useCallback((ch: string, ok: boolean, picked?: string) => {
    setState((prev) => {
      const cards = { ...prev.cards, [ch]: grade(prev.cards[ch], ok) };
      let confusions = prev.confusions;
      if (!ok && picked && picked !== ch) {
        const row = { ...(confusions[ch] ?? {}) };
        row[picked] = (row[picked] ?? 0) + 1;
        confusions = { ...confusions, [ch]: row };
      }
      const next = { ...prev, cards, confusions };
      write(next);
      return next;
    });
  }, []);

  /** Close out a path day. The day number is the key; finishing it twice keeps the better run. */
  const finishDay = useCallback((day: number, right: number, total: number) => {
    setState((prev) => {
      const had = prev.days[String(day)];
      if (had && had.right >= right) return prev;
      const next = {
        ...prev,
        days: { ...prev.days, [String(day)]: { right, total, on: today() } },
      };
      write(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    write(EMPTY);
    setState(EMPTY);
  }, []);

  return { srs: state, ready, answer, finishDay, reset };
}
