"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { curvify, type Stroke } from "@/data/strokes";
import { C } from "./theme";

/** Drawing speed in viewBox units per second. */
const SPEED = 150;
/** Pause between strokes, ms. */
const GAP = 260;
/** Pause before the whole thing loops back to the start, ms. */
const REST = 1100;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Draws a jamo one stroke at a time.
 *
 * Each stroke is a path revealed by animating stroke-dashoffset from its own
 * length down to zero, so the line grows from its start point exactly the way a
 * pen would move. Timing is proportional to path length, which keeps a long
 * sweep and a short tick moving at the same apparent speed.
 *
 * The order is carried by the animation itself — no numbered badges. On a
 * crowded glyph like ㅞ there is nowhere to put five of them that doesn't
 * collide with a stroke or with each other, and the numbered list beside the
 * diagram already names them in order.
 */
export function StrokeAnimation({ strokes, size = 172 }: { strokes: Stroke[]; size?: number }) {
  // Curve the authored straight segments once per letter, not per render.
  const paths = useMemo(() => strokes.map((s) => curvify(s.d)), [strokes]);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const [lengths, setLengths] = useState<number[]>([]);
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);

  // Path length drives both the dash pattern and the per-stroke timing.
  useLayoutEffect(() => {
    setLengths(pathRefs.current.slice(0, paths.length).map((p) => p?.getTotalLength() ?? 0));
  }, [paths]);

  useEffect(() => {
    if (lengths.length !== strokes.length || lengths.some((l) => l === 0)) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setDone(true);
      return;
    }

    setDone(false);

    let raf = 0;
    let started = false;
    let last = 0;
    let elapsed = 0;
    const total = lengths.reduce((sum, len) => sum + (len / SPEED) * 1000 + GAP, 0);

    const frame = (now: number) => {
      // Blank the strokes on the first real frame, not before scheduling one.
      // If rAF never fires — hidden tab, throttled background — the paths keep
      // their fully drawn default and the student sees the finished glyph
      // instead of an empty box.
      if (!started) {
        started = true;
        last = now;
        pathRefs.current.forEach((p, i) => {
          if (p) p.style.strokeDashoffset = String(lengths[i]);
        });
        raf = requestAnimationFrame(frame);
        return;
      }

      // Clamp the delta so a backgrounded tab resumes where it paused instead
      // of jumping straight to the finished glyph.
      elapsed += Math.min(now - last, 100);
      last = now;

      let cursor = 0;
      lengths.forEach((len, i) => {
        const duration = (len / SPEED) * 1000;
        const progress = clamp((elapsed - cursor) / duration, 0, 1);
        const el = pathRefs.current[i];
        if (el) el.style.strokeDashoffset = String(len * (1 - progress));
        cursor += duration + GAP;
      });

      if (elapsed >= total) {
        setDone(true);
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [lengths, strokes.length, run]);

  // Loop, with a rest so the finished glyph is readable between passes.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setRun((r) => r + 1), REST);
    return () => clearTimeout(t);
  }, [done]);

  const replay = useCallback(() => setRun((r) => r + 1), []);

  // The strokes are only shown, never listed, so the order has to reach a
  // screen reader some other way.
  const description = strokes.map((s, i) => `${i + 1}. ${s.label}`).join(" · ");

  return (
    <button
      type="button"
      onClick={replay}
      aria-label={`ลำดับเส้น ${strokes.length} เส้น — ${description} · แตะเพื่อเล่นซ้ำ`}
      title="แตะเพื่อเล่นซ้ำ"
      style={{
        cursor: "pointer",
        border: `2px solid ${C.purpleBorder}`,
        background: C.surface,
        borderRadius: 20,
        padding: 8,
        lineHeight: 0,
        flex: "0 0 auto",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        {/* Faint full glyph, so the target shape is visible from the start. */}
        {paths.map((d, i) => (
          <path
            key={`ghost-${i}`}
            d={d}
            fill="none"
            stroke={C.purpleBorder}
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {paths.map((d, i) => (
          <path
            key={`ink-${i}`}
            ref={(el) => {
              pathRefs.current[i] = el;
            }}
            d={d}
            fill="none"
            stroke={C.ink}
            // Thin enough that the crossbar and the side tick of a compound
            // vowel keep clear white between them at the font's proportions.
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
            // Dash pattern set, offset 0 = fully drawn. The animation blanks it
            // on start; anything that prevents the animation leaves it visible.
            style={{ strokeDasharray: lengths[i] ?? 0, strokeDashoffset: 0 }}
          />
        ))}
      </svg>
    </button>
  );
}
