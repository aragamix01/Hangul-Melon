/**
 * Which letters a student is likely to mix up — computed, not hand-listed.
 *
 * Writing the pairs out by hand means a table to maintain next to the data it
 * describes, covering only the letters someone thought of. Everything here is
 * derived from fields `src/data` already holds, so adding a letter, a 받침 or a
 * whole curriculum extends the list for free:
 *
 *   place  — stroke geometry sampled into a point cloud, compared by chamfer
 *            distance. Catches "these two sit on top of each other": ㅏ/ㅑ, ㄱ/ㅋ.
 *   parts  — the same strokes as a multiset of (orientation, length), position
 *            thrown away. Catches mirrors and rotations, which a positional
 *            metric scores as far apart: ㅗ/ㅜ, ㅏ/ㅓ.
 *   sound  — the Thai reading and the romanization. Catches ㅐ/ㅔ and the
 *            plain/aspirated/tense triplets, where the shapes differ but the
 *            ear does not.
 *   final  — NEUTRALIZE in data/finals.ts is already a complete table of which
 *            letters collapse onto the same 받침 sound. Free signal.
 *   errors — the student's own wrong answers. The only signal that knows which
 *            confusions are actually theirs, so it carries the most weight.
 */

import { NEUTRALIZE } from "@/data/finals";
import { CONSONANTS, VOWELS, type Jamo } from "@/data/hangul";

type Pt = [number, number];

/** Sample spacing along a path, in the 100×100 box the strokes are drawn in. */
const STEP = 3;

interface Cmd {
  op: string;
  args: number[];
}

/** Strokes use only M / L / A with absolute coordinates — see data/strokes.ts. */
function parse(d: string): Cmd[] {
  const out: Cmd[] = [];
  const re = /([MLA])([^MLA]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    out.push({ op: m[1], args: m[2].match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [] });
  }
  return out;
}

function pushLine(into: Pt[], from: Pt, to: Pt) {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const n = Math.max(1, Math.round(len / STEP));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    into.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]);
  }
}

/**
 * The only arcs in the data are the two halves of a circle, written chord to
 * chord, so the centre is the midpoint of the chord. A point cloud does not
 * care which way we walk the arc, but it does care *which* half — and the
 * sweep flag is what tells the two halves apart.
 */
function pushArc(into: Pt[], from: Pt, to: Pt, r: number, sweep: number) {
  const cx = (from[0] + to[0]) / 2;
  const cy = (from[1] + to[1]) / 2;
  const a0 = Math.atan2(from[1] - cy, from[0] - cx);
  let a1 = Math.atan2(to[1] - cy, to[0] - cx);
  if (sweep === 1) {
    while (a1 <= a0) a1 += Math.PI * 2;
  } else {
    while (a1 >= a0) a1 -= Math.PI * 2;
  }
  const n = Math.max(2, Math.round((Math.abs(a1 - a0) * r) / STEP));
  for (let i = 1; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    into.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
}

/** Points along one stroke's path, in the 100×100 box. */
export function samplePath(d: string): Pt[] {
  const pts: Pt[] = [];
  {
    let cur: Pt | null = null;
    for (const { op, args } of parse(d)) {
      if (op === "A") {
        for (let i = 0; i + 6 < args.length; i += 7) {
          const next: Pt = [args[i + 5], args[i + 6]];
          if (cur) pushArc(pts, cur, next, args[i], args[i + 4]);
          cur = next;
        }
        continue;
      }
      for (let i = 0; i + 1 < args.length; i += 2) {
        const next: Pt = [args[i], args[i + 1]];
        if (op === "M" && i === 0) pts.push(next);
        else if (cur) pushLine(pts, cur, next);
        cur = next;
      }
    }
  }
  return pts;
}

function cloudOf(j: Jamo): Pt[] {
  return j.strokes.flatMap((s) => samplePath(s.d));
}

/** Mean nearest-neighbour distance, both directions, in box units. */
export function chamfer(a: Pt[], b: Pt[]): number {
  const oneWay = (p: Pt[], q: Pt[]) => {
    let sum = 0;
    for (const [px, py] of p) {
      let best = Infinity;
      for (const [qx, qy] of q) {
        const dx = px - qx;
        const dy = py - qy;
        const d = dx * dx + dy * dy;
        if (d < best) best = d;
      }
      sum += Math.sqrt(best);
    }
    return sum / (p.length || 1);
  };
  return (oneWay(a, b) + oneWay(b, a)) / 2;
}

/**
 * A glyph as a bag of "a 72-long horizontal", "a 36-long vertical" — the pieces
 * it is built from, with no record of where they sit.
 */
function signature(j: Jamo): string[] {
  const parts: string[] = [];
  for (const s of j.strokes) {
    let cur: Pt | null = null;
    for (const { op, args } of parse(s.d)) {
      if (op === "A") {
        for (let i = 0; i + 6 < args.length; i += 7) {
          parts.push(`o${Math.round(args[i] / 8) * 8}`);
          cur = [args[i + 5], args[i + 6]];
        }
        continue;
      }
      for (let i = 0; i + 1 < args.length; i += 2) {
        const next: Pt = [args[i], args[i + 1]];
        if (cur && !(op === "M" && i === 0)) {
          const dx = Math.abs(next[0] - cur[0]);
          const dy = Math.abs(next[1] - cur[1]);
          const len = Math.round(Math.hypot(dx, dy) / 8) * 8;
          const dir = dx > dy * 2 ? "h" : dy > dx * 2 ? "v" : "d";
          parts.push(`${dir}${len}`);
        }
        cur = next;
      }
    }
  }
  return parts.sort();
}

/** Jaccard over multisets. */
function bagSimilarity(a: string[], b: string[]): number {
  const left = [...a];
  let shared = 0;
  for (const x of b) {
    const i = left.indexOf(x);
    if (i >= 0) {
      left.splice(i, 1);
      shared++;
    }
  }
  const union = a.length + b.length - shared;
  return union ? shared / union : 0;
}

function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let carry = row[0];
    row[0] = i;
    for (let k = 1; k <= b.length; k++) {
      const keep = row[k];
      row[k] = Math.min(row[k] + 1, row[k - 1] + 1, carry + (a[i - 1] === b[k - 1] ? 0 : 1));
      carry = keep;
    }
  }
  return row[b.length];
}

const strSim = (a: string, b: string) =>
  a && b ? 1 - levenshtein(a, b) / Math.max(a.length, b.length) : 0;

const head = (thai: string) => thai.split("·")[0].trim();

/**
 * The Thai letters a consonant actually lands on.
 *
 * `thai` is written for a human ("ค → ก", "ซ (เกร็งคอ)", "ซ · แต่เจอ ㅣ ..."),
 * so take the head of the field and keep only single-letter tokens. Anything
 * else — ㅇ's "ออกเสียงตามสระที่เจอ" — carries no single sound and drops out.
 */
function thaiBase(j: Jamo): string[] {
  return head(j.thai)
    .split("(")[0]
    .split("→")
    .map((t) => t.trim())
    .filter((t) => Array.from(t).length === 1);
}

export interface ConfusionPair {
  a: Jamo;
  b: Jamo;
  /** 0–1, the blend in pairOf */
  score: number;
  place: number;
  parts: number;
  sound: number;
  errors: number;
  /** Why this pair surfaced — the badges on the card */
  reasons: string[];
}

/** How often the student picked one letter when the answer was the other. */
export type Confusions = Record<string, Record<string, number>>;

const clouds = new Map<string, Pt[]>();
const signatures = new Map<string, string[]>();

const cloud = (j: Jamo) => {
  let c = clouds.get(j.ch);
  if (!c) clouds.set(j.ch, (c = cloudOf(j)));
  return c;
};

const sig = (j: Jamo) => {
  let s = signatures.get(j.ch);
  if (!s) signatures.set(j.ch, (s = signature(j)));
  return s;
};

function soundScore(a: Jamo, b: Jamo): { score: number; reason?: string } {
  if (a.kind === "consonant") {
    const sa = thaiBase(a);
    const sb = thaiBase(b);
    const shared = sa.filter((t) => sb.includes(t));
    if (!shared.length) return { score: 0 };
    return {
      score: shared.length / Math.max(sa.length, sb.length),
      reason: `เสียงไทยฐานเดียวกัน (${shared.join(" ")})`,
    };
  }
  const score = Math.max(strSim(a.rom, b.rom), strSim(head(a.thai), head(b.thai)));
  return score >= 0.5
    ? { score, reason: `คำอ่านใกล้กัน (${head(a.thai)} / ${head(b.thai)})` }
    : { score };
}

function pairOf(a: Jamo, b: Jamo, confusions: Confusions): ConfusionPair {
  const place = Math.exp(-chamfer(cloud(a), cloud(b)) / 8);
  const parts = bagSimilarity(sig(a), sig(b));
  const sound = soundScore(a, b);
  const sameFinal =
    a.kind === "consonant" && !!NEUTRALIZE[a.ch] && NEUTRALIZE[a.ch] === NEUTRALIZE[b.ch];
  const wrong = (confusions[a.ch]?.[b.ch] ?? 0) + (confusions[b.ch]?.[a.ch] ?? 0);
  const errors = Math.min(1, wrong / 3);

  // Position-independent similarity is the weaker evidence of the two, so it
  // is discounted slightly rather than treated as an overlap.
  const shape = Math.max(place, parts * 0.95);
  const score = 0.34 * shape + 0.26 * sound.score + 0.1 * (sameFinal ? 1 : 0) + 0.3 * errors;

  const reasons: string[] = [];
  if (wrong) reasons.push(`คุณสลับกันแล้ว ${wrong} ครั้ง`);
  if (place > 0.45) reasons.push("รูปทับกันเกือบสนิท");
  else if (parts > 0.6) reasons.push("ชิ้นส่วนเส้นเหมือนกัน วางต่างที่");
  if (sound.reason) reasons.push(sound.reason);
  if (sameFinal) reasons.push(`เป็นตัวสะกดแล้วเสียงเดียวกัน (${NEUTRALIZE[a.ch]})`);

  return { a, b, score, place, parts, sound: sound.score, errors, reasons };
}

/** All 40 letters, consonants first. */
export const ALL_JAMO: Jamo[] = [...CONSONANTS, ...VOWELS];

/**
 * The pairs most worth drilling, highest first.
 *
 * Same-kind pairs only: a consonant and a vowel are never mistaken for each
 * other inside a syllable block, so scoring them adds noise. `only` narrows the
 * ranking to the letters the student has actually met.
 */
export function rankPairs(
  confusions: Confusions = {},
  limit = 8,
  only?: (j: Jamo) => boolean,
): ConfusionPair[] {
  const pool = only ? ALL_JAMO.filter(only) : ALL_JAMO;
  const out: ConfusionPair[] = [];
  for (let i = 0; i < pool.length; i++) {
    for (let k = i + 1; k < pool.length; k++) {
      if (pool[i].kind !== pool[k].kind) continue;
      out.push(pairOf(pool[i], pool[k], confusions));
    }
  }
  return out.sort((p, q) => q.score - p.score).slice(0, limit);
}

/**
 * Wrong options for a multiple-choice question: the letters this one is most
 * confusable with, so getting it right means the student can tell them apart
 * rather than having eliminated three obvious misfits.
 */
export type Point = Pt;

/** How close a drawn stroke has to sit to the real one. Box units, finger-sized. */
const TRACE_TOLERANCE = 15;

export interface TraceResult {
  ok: boolean;
  /** Reason the attempt failed, for the line under the box */
  problem?: "count" | "shape";
  /** Worst per-stroke distance, so a near miss can be shown as one */
  worst: number;
}

/**
 * Score a traced letter.
 *
 * Stroke *order* is part of the answer, so each drawn stroke is compared to the
 * one at the same index rather than to whichever model stroke happens to be
 * nearest: ㄹ drawn bottom-up lands on the right shape by the wrong route, and
 * the whole point of teaching stroke order is that the route is the lesson.
 */
export function traceScore(drawn: Point[][], j: Jamo): TraceResult {
  if (drawn.length !== j.strokes.length) {
    return { ok: false, problem: "count", worst: Infinity };
  }
  let worst = 0;
  for (let i = 0; i < drawn.length; i++) {
    if (!drawn[i].length) return { ok: false, problem: "shape", worst: Infinity };
    const d = chamfer(drawn[i], samplePath(j.strokes[i].d));
    if (d > worst) worst = d;
  }
  return worst <= TRACE_TOLERANCE ? { ok: true, worst } : { ok: false, problem: "shape", worst };
}

export function distractorsFor(
  answer: Jamo,
  pool: Jamo[],
  n: number,
  confusions: Confusions = {},
): Jamo[] {
  return pool
    .filter((j) => j.ch !== answer.ch && j.kind === answer.kind)
    .map((j) => ({ j, s: pairOf(answer, j, confusions).score }))
    .sort((x, y) => y.s - x.s)
    .slice(0, n)
    .map((x) => x.j);
}
