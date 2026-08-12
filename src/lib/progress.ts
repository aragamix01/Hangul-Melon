"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "hangul-melon:progress:v1";
/** Pre-rename key. Read once, then retired — see read(). */
const LEGACY_KEY = "hangul-nabi:progress:v1";

export interface Progress {
  /** jamo character -> true once the student has tapped "จำได้แล้ว" */
  learned: Record<string, true>;
  /** ISO date (YYYY-MM-DD) of the last day the app was opened */
  lastDay: string;
  streak: number;
}

const EMPTY: Progress = { learned: {}, lastDay: "", streak: 0 };

const today = () => new Date().toISOString().slice(0, 10);

function daysBetween(a: string, b: string): number {
  const ms = Date.parse(b) - Date.parse(a);
  return Math.round(ms / 86_400_000);
}

function read(): Progress {
  try {
    // Carry over anyone who learned letters under the old app name, then drop
    // the old key so this only ever runs once per browser.
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        localStorage.setItem(KEY, legacy);
        localStorage.removeItem(LEGACY_KEY);
        raw = legacy;
      }
    }
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return { ...EMPTY, ...parsed, learned: parsed.learned ?? {} };
  } catch {
    return EMPTY;
  }
}

function write(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private mode / quota — progress just won't persist */
  }
}

/** Roll the streak forward on first load of a new day. */
function touchStreak(p: Progress): Progress {
  const d = today();
  if (p.lastDay === d) return p;
  const gap = p.lastDay ? daysBetween(p.lastDay, d) : Infinity;
  return { ...p, lastDay: d, streak: gap === 1 ? p.streak + 1 : 1 };
}

export function useProgress() {
  // Start from EMPTY so server and first client render agree, then hydrate.
  const [progress, setProgress] = useState<Progress>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const p = touchStreak(read());
    write(p);
    setProgress(p);
    setReady(true);
  }, []);

  const markLearned = useCallback((ch: string) => {
    setProgress((prev) => {
      if (prev.learned[ch]) return prev;
      const next = { ...prev, learned: { ...prev.learned, [ch]: true as const } };
      write(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const next = touchStreak({ ...EMPTY, lastDay: "", streak: 0 });
    write(next);
    setProgress(next);
  }, []);

  return { progress, ready, markLearned, reset };
}
