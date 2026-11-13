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

/**
 * Days until a card in box n comes back. Box 1 is same-day.
 *
 * The course is fourteen days long, so the ladder has to fit inside it. At the
 * textbook intervals a letter answered right three times is parked for 16 days
 * and never seen again before the end — which is how the hard letters were
 * disappearing after one good day. The top rung is 11 days instead, so a
 * letter met on day 1 comes back on roughly days 2, 4, 8 and 14 whatever
 * happens, and anything missed restarts the climb the same day.
 */
const INTERVALS = [0, 0, 1, 2, 4, 7, 11];
export const TOP_BOX = INTERVALS.length - 1;

export interface SrsCard {
  /** 1..TOP_BOX — how well established the letter is */
  box: number;
  /** ISO date (YYYY-MM-DD) this card is next due */
  due: string;
  seen: number;
  wrong: number;
  /** ISO date this letter was last put in front of the student */
  last?: string;
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
    last: today(),
  };
}

export function dueKeys(state: SrsState): string[] {
  const d = today();
  return Object.keys(state.cards)
    .filter((ch) => state.cards[ch].due <= d)
    .sort((a, b) => weakness(state, b) - weakness(state, a));
}

/**
 * How much trouble a letter has given, 0–1.
 *
 * Due-ness alone sorts by the calendar, which fills a day with whatever was
 * learned most recently — the easy early letters, over and over, while a
 * letter that has been missed three times waits its turn. This ranks by how
 * badly it is going instead: the miss rate, how far down the ladder it sits,
 * and how often it has been confused with something else.
 */
export function weakness(state: SrsState, ch: string): number {
  const card = state.cards[ch];
  if (!card) return 1;
  const missRate = card.seen ? card.wrong / card.seen : 0.5;
  const low = (TOP_BOX - card.box) / (TOP_BOX - 1);
  const mixedUp = Object.values(state.confusions[ch] ?? {}).reduce((a, b) => a + b, 0);
  return 0.5 * missRate + 0.3 * low + 0.2 * Math.min(1, mixedUp / 3);
}

/**
 * The letters worth drilling, weakest first, whether or not the calendar says
 * they are due. `exclude` keeps the day's new letters out.
 */
export function weakest(state: SrsState, limit: number, exclude: Set<string> = new Set()): string[] {
  return Object.keys(state.cards)
    .filter((ch) => !exclude.has(ch))
    .sort((a, b) => weakness(state, b) - weakness(state, a))
    .slice(0, limit);
}

/**
 * The letters not seen for longest, oldest first.
 *
 * Weakness alone never calls back a letter that has gone well: it sits at the
 * top of the ladder with eleven days on the clock and, in a fortnight-long
 * course, is simply never asked again. A review day sweeps by age as well, so
 * the end of the course touches everything rather than only the sore spots.
 */
export function stalest(state: SrsState, limit: number, exclude: Set<string> = new Set()): string[] {
  return Object.keys(state.cards)
    .filter((ch) => !exclude.has(ch))
    .sort((a, b) => (state.cards[a].last ?? "").localeCompare(state.cards[b].last ?? ""))
    .slice(0, limit);
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
   * Record which letter was picked instead. That, not the miss itself, is what
   * makes the confusion list personal, so it is kept per attempt.
   */
  const note = useCallback((ch: string, picked: string) => {
    if (picked === ch) return;
    setState((prev) => {
      const row = { ...(prev.confusions[ch] ?? {}) };
      row[picked] = (row[picked] ?? 0) + 1;
      const next = { ...prev, confusions: { ...prev.confusions, [ch]: row } };
      write(next);
      return next;
    });
  }, []);

  /**
   * Move each letter one rung, once, at the end of a day.
   *
   * A letter is asked three or four times in a session — picked out of its
   * neighbour, traced, typed, read. Grading each of those separately let a
   * letter climb three boxes in ten minutes and vanish for a fortnight, which
   * is the opposite of spacing: repeats inside one sitting are one exposure.
   * So the day reports one verdict per letter, and a letter missed even once
   * counts as missed.
   */
  const gradeDay = useCallback((outcomes: Record<string, boolean>) => {
    setState((prev) => {
      const cards = { ...prev.cards };
      for (const [ch, ok] of Object.entries(outcomes)) cards[ch] = grade(cards[ch], ok);
      const next = { ...prev, cards };
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

  return { srs: state, ready, note, gradeDay, finishDay, reset };
}
