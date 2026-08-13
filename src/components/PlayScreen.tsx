"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { demoParts, type Curriculum, type Jamo } from "@/data/hangul";
import type { Progress } from "@/lib/progress";
import { speakKo, stopAudio } from "@/lib/audio";
import { SpeakerIcon } from "./SpeakerButton";
import { C, KO } from "./theme";

const shuffle = <T,>(a: T[]): T[] =>
  a
    .map((x) => [Math.random(), x] as const)
    .sort((p, q) => p[0] - q[0])
    .map(([, x]) => x);

/**
 * Quiz only on letters the student has actually opened. Before there are
 * enough of those, fall back to the first ten of the teaching order so the
 * games are never empty and never ambush a beginner with ㅢ.
 */
function quizPool(curriculum: Curriculum, progress: Progress): Jamo[] {
  const learned = curriculum.order.filter((j) => progress.learned[j.ch]);
  return learned.length >= 5 ? learned : curriculum.order.slice(0, 10);
}

export function PlayScreen({
  curriculum,
  progress,
}: {
  curriculum: Curriculum;
  progress: Progress;
}) {
  const [mode, setMode] = useState<"match" | "listen">("match");
  const pool = useMemo(() => quizPool(curriculum, progress), [curriculum, progress]);

  // Switching games shouldn't leave the previous game's clip playing over the new one.
  useEffect(() => stopAudio(), [mode]);

  const tab = (on: boolean): React.CSSProperties => ({
    border: "none",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13.5,
    padding: "9px 18px",
    borderRadius: 999,
    background: on ? C.surface : "transparent",
    color: on ? C.ink : C.inkFaintest,
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          background: C.pinkTrack,
          padding: 5,
          borderRadius: 999,
          width: "fit-content",
          flexWrap: "wrap",
        }}
      >
        <button type="button" onClick={() => setMode("match")} style={tab(mode === "match")}>
          จับคู่ · Match
        </button>
        <button type="button" onClick={() => setMode("listen")} style={tab(mode === "listen")}>
          ฟังเสียง · Listen
        </button>
      </div>

      {mode === "match" ? <MatchGame pool={pool} /> : <ListenGame pool={pool} />}
    </div>
  );
}

function Hearts({ n }: { n: number }) {
  return (
    <div style={{ display: "flex", gap: 6 }} aria-label={`เหลือ ${n} ชีวิต`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            background: i < n ? C.pink : "#F2DCE5",
            display: "inline-block",
          }}
        />
      ))}
    </div>
  );
}

function MatchGame({ pool }: { pool: Jamo[] }) {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [hearts, setHearts] = useState(3);
  const [status, setStatus] = useState("แตะตัวอักษรเพื่อเริ่ม");

  const pairs = useMemo(
    () => shuffle(pool).slice(0, Math.min(5, pool.length)),
    // `round` intentionally re-rolls the deal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool, round],
  );
  const left = useMemo(() => shuffle(pairs.map((p) => p.ch)), [pairs]);
  // Carries whole jamo, not just the romanization string, so the tile can show
  // the Thai sound underneath. Matching still keys on `rom`, which is unique
  // across all 40 letters.
  const right = useMemo(() => shuffle(pairs), [pairs]);

  const reset = useCallback(() => {
    setPicked(null);
    setSolved([]);
    setWrong(null);
    setHearts(3);
    setStatus("แตะตัวอักษรเพื่อเริ่ม");
    setRound((r) => r + 1);
  }, []);

  const tapLeft = (ch: string) => {
    if (solved.includes(ch)) return;
    const j = pairs.find((p) => p.ch === ch);
    if (j) void speakKo(j.nameKo, "name");
    setPicked(ch);
    setWrong(null);
    setStatus("เลือกคำอ่านที่ตรงกัน");
  };

  const tapRight = (rom: string) => {
    if (!picked) {
      setStatus("เลือกตัวอักษรก่อนนะ");
      return;
    }
    const pair = pairs.find((p) => p.ch === picked);
    if (pair && pair.rom === rom) {
      const next = [...solved, picked, rom];
      setSolved(next);
      setPicked(null);
      setStatus(next.length >= pairs.length * 2 ? "เก่งมาก! ครบทุกคู่แล้ว 🎉" : "ถูกต้อง!");
    } else {
      setWrong(rom);
      setPicked(null);
      setHearts((h) => Math.max(0, h - 1));
      setStatus("ยังไม่ใช่ ลองอีกครั้ง");
      setTimeout(() => setWrong(null), 600);
    }
  };

  return (
    <section
      style={{
        background: C.surface,
        border: `2px solid ${C.border}`,
        borderRadius: 30,
        padding: "clamp(18px, 4vw, 26px)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>จับคู่ตัวอักษรกับเสียง</div>
          <div style={{ fontSize: 13, color: C.inkFaint, fontWeight: 600 }}>
            แตะตัวอักษร แล้วแตะคำอ่านที่ตรงกัน
          </div>
          {/* The clip is the letter's *name* (니은), not its romanization (n).
              Say so, or the mismatch reads as a bug. */}
          <div style={{ fontSize: 12, color: C.label, fontWeight: 700, marginTop: 3 }}>
            เสียงที่ได้ยิน = ชื่อตัวอักษร ไม่ใช่คำอ่าน
          </div>
        </div>
        <Hearts n={hearts} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {left.map((ch) => {
          const done = solved.includes(ch);
          const on = picked === ch;
          return (
            <button
              key={ch}
              type="button"
              onClick={() => tapLeft(ch)}
              className="tile"
              style={{
                cursor: "pointer",
                padding: "18px 10px",
                borderRadius: 20,
                fontFamily: KO,
                fontSize: 30,
                background: done ? C.blueTint : on ? C.pinkTint : C.surface,
                border: `2px solid ${done ? C.blueBorderStrong : on ? C.pink : C.border}`,
                color: done ? "#84AEBD" : C.ink,
              }}
            >
              {ch}
            </button>
          );
        })}
      </div>

      <div style={{ height: 12 }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {right.map((j) => {
          const done = solved.includes(j.rom);
          const bad = wrong === j.rom;
          return (
            <button
              key={j.rom}
              type="button"
              onClick={() => tapRight(j.rom)}
              className="tile-blue"
              style={{
                cursor: "pointer",
                padding: "13px 10px",
                borderRadius: 20,
                display: "grid",
                gap: 2,
                justifyItems: "center",
                background: done ? C.blueTint : bad ? C.badRed : C.surface,
                border: `2px solid ${done ? C.blueBorderStrong : bad ? C.badBorder : C.border}`,
                color: done ? "#84AEBD" : C.ink,
              }}
            >
              <span style={{ fontWeight: 800, fontSize: 17 }}>{j.rom}</span>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: done ? "#9CC3D0" : C.inkFaint,
                }}
              >
                {j.thai}
              </span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.inkSoft }}>{status}</div>
        <button
          type="button"
          onClick={reset}
          className="btn-blue"
          style={{
            cursor: "pointer",
            border: "none",
            background: C.blue,
            color: C.surface,
            fontWeight: 800,
            fontSize: 13.5,
            padding: "11px 20px",
            borderRadius: 16,
            boxShadow: `0 3px 0 ${C.blueDeep}`,
          }}
        >
          รอบใหม่
        </button>
      </div>
    </section>
  );
}

function ListenGame({ pool }: { pool: Jamo[] }) {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [hearts, setHearts] = useState(3);
  const [status, setStatus] = useState("แตะปุ่มลำโพงเพื่อฟัง");
  /**
   * True from a correct answer until the next question starts.
   *
   * The reveal is on screen for 1.6s. Left interactive, a student can tap the
   * replay button in that window and have the clip cut off mid-word when the
   * next question auto-plays — two voices over each other, and the answer they
   * asked to hear never finishes.
   */
  const [locked, setLocked] = useState(false);

  /**
   * Every round is all-consonant or all-vowel, never mixed.
   *
   * A demo syllable contains both a consonant and a vowel — 나 is ㄴ *and* ㅏ.
   * With both kinds on screen the question has two defensible answers and the
   * student is just guessing which one we meant. Restricting the round to one
   * kind makes "which letter did you hear" a question with one answer.
   */
  const options = useMemo(() => {
    const consonants = pool.filter((j) => j.kind === "consonant");
    const vowels = pool.filter((j) => j.kind === "vowel");
    // Alternate kinds; fall back to whichever has enough letters to fill a round.
    const preferred = round % 2 === 0 ? consonants : vowels;
    const other = round % 2 === 0 ? vowels : consonants;
    const set = preferred.length >= 2 ? preferred : other.length >= 2 ? other : pool;
    return shuffle(set).slice(0, Math.min(4, set.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, round]);

  const answer = useMemo(
    () => options[Math.floor(Math.random() * options.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options],
  );
  const askingFor: "consonant" | "vowel" = answer?.kind ?? "consonant";

  // Auto-play each new question except the very first (browsers block audio
  // before the user has interacted with the page). Cut whatever is still
  // sounding first, so a lingering clip never overlaps the new question.
  useEffect(() => {
    if (round === 0 || !answer) return;
    const t = setTimeout(() => {
      stopAudio();
      void speakKo(answer.demo, "sound");
    }, 150);
    return () => clearTimeout(t);
  }, [round, answer]);

  // Drop any pending advance if the player leaves this game mid-reveal.
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );

  if (!answer) return null;

  const replay = () => {
    if (locked) return;
    void speakKo(answer.demo, "sound");
  };

  const tap = (j: Jamo) => {
    if (locked) return;
    const [head, tail] = demoParts(answer);
    if (j.ch === answer.ch) {
      setPicked(j.ch);
      setLocked(true);
      // Always show the split, so the student sees exactly which half of the
      // sound they were being asked for.
      setStatus(`ถูกต้อง! ${answer.demo} = ${head} + ${tail} → ${answer.ch} = ${answer.rom}`);
      advanceTimer.current = setTimeout(() => {
        setPicked(null);
        setStatus("แตะปุ่มลำโพงเพื่อฟัง");
        setLocked(false);
        setRound((r) => r + 1);
      }, 1600);
    } else {
      setPicked(j.ch);
      setHearts((h) => Math.max(0, h - 1));
      setStatus(
        askingFor === "consonant"
          ? "ยังไม่ใช่ — ฟังเฉพาะเสียงแรก ก่อนถึงสระ ㅏ"
          : "ยังไม่ใช่ — ㅇ ตัวหน้าไม่มีเสียง ฟังเฉพาะสระ",
      );
      setTimeout(() => setPicked(null), 900);
    }
  };

  return (
    <section
      style={{
        background: C.surface,
        border: `2px solid ${C.border}`,
        borderRadius: 30,
        padding: "clamp(18px, 4vw, 26px)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            {askingFor === "consonant"
              ? "ฟังพยางค์ แล้วเลือกพยัญชนะต้น"
              : "ฟังพยางค์ แล้วเลือกสระ"}
          </div>
          <div style={{ fontSize: 12.5, color: C.inkFaint, fontWeight: 600, marginTop: 2 }}>
            {askingFor === "consonant" ? (
              <>
                ทุกข้อลงท้ายด้วยสระ <span style={{ fontFamily: KO }}>ㅏ</span> เหมือนกันหมด
                — เลือกเฉพาะเสียงแรก
              </>
            ) : (
              <>
                ทุกข้อขึ้นต้นด้วย <span style={{ fontFamily: KO }}>ㅇ</span> ที่ไม่มีเสียง
                — เลือกเฉพาะสระ
              </>
            )}
          </div>
        </div>
        <Hearts n={hearts} />
      </div>

      <button
        type="button"
        onClick={replay}
        disabled={locked}
        aria-label="ฟังเสียงอีกครั้ง"
        className="btn-pink"
        style={{
          border: "none",
          cursor: locked ? "default" : "pointer",
          opacity: locked ? 0.55 : 1,
          transition: "opacity 0.2s ease",
          width: "clamp(96px, 26vw, 124px)",
          height: "clamp(96px, 26vw, 124px)",
          borderRadius: 40,
          background: C.pink,
          color: C.surface,
          boxShadow: `0 5px 0 ${C.pinkDeep}`,
          display: "grid",
          placeItems: "center",
          margin: "18px auto 6px",
          animation: "wiggle 3s ease-in-out infinite",
        }}
      >
        <SpeakerIcon size={44} />
      </button>
      <div style={{ fontSize: 13, color: C.inkFaint, fontWeight: 700, marginBottom: 18 }}>
        แตะเพื่อฟังอีกครั้ง
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 10,
        }}
      >
        {options.map((q) => {
          const on = picked === q.ch;
          const right = q.ch === answer.ch;
          return (
            <button
              key={q.ch}
              type="button"
              onClick={() => tap(q)}
              disabled={locked && !on}
              aria-label={q.name}
              className="tile"
              style={{
                cursor: locked ? "default" : "pointer",
                padding: "20px 10px",
                borderRadius: 20,
                fontFamily: KO,
                fontSize: 34,
                background: on ? (right ? C.blueTint : C.badRed) : C.surface,
                border: `2px solid ${on ? (right ? C.blueBorderStrong : C.badBorder) : C.border}`,
                color: C.ink,
              }}
            >
              {q.ch}
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 16,
          fontSize: 13.5,
          fontWeight: 700,
          color: C.inkSoft,
          // Reserve the taller line so revealing the breakdown doesn't shift
          // the answer buttons under the student's finger.
          minHeight: 40,
          display: "grid",
          placeItems: "center",
          fontFamily: `var(--font-thai), ${KO}`,
        }}
      >
        {status}
      </div>
    </section>
  );
}
