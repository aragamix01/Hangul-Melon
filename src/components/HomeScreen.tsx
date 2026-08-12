"use client";

import { CURRICULA, TOTAL_LETTERS, type Curriculum, type CurriculumId } from "@/data/hangul";
import type { Progress } from "@/lib/progress";
import { C, KO } from "./theme";
import type { Screen } from "./Nav";

export function HomeScreen({
  curriculum,
  onCurriculum,
  progress,
  onStartStage,
  onGo,
}: {
  curriculum: Curriculum;
  onCurriculum: (id: CurriculumId) => void;
  progress: Progress;
  onStartStage: (stage: number) => void;
  onGo: (s: Screen) => void;
}) {
  const learnedCount = Object.keys(progress.learned).length;
  const stages = curriculum.stages;

  // Resume at the first stage that isn't finished yet.
  const nextStage =
    stages.find((s) => s.chars.some((ch) => !progress.learned[ch])) ?? stages[0];

  return (
    <div style={{ animation: "pop 0.35s ease both" }}>
      <section
        style={{
          background: C.surface,
          border: `2px solid ${C.border}`,
          borderRadius: 28,
          padding: "clamp(20px, 4vw, 30px)",
          marginBottom: 18,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 22,
          justifyContent: "space-between",
        }}
      >
        <div style={{ minWidth: 240, flex: "1 1 260px" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "1.4px",
              color: C.pinkText,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Today · วันนี้
          </div>
          <h1
            style={{
              fontSize: "clamp(24px, 4.5vw, 34px)",
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: "-0.6px",
              margin: "0 0 8px",
              textWrap: "pretty",
            }}
          >
            อักษรเกาหลี {TOTAL_LETTERS} ตัว ใน {stages.length} ด่าน
          </h1>
          <p
            style={{
              fontSize: 14.5,
              color: C.inkSoft,
              fontWeight: 600,
              lineHeight: 1.6,
              margin: "0 0 18px",
            }}
          >
            {curriculum.blurb}
          </p>
          <button
            type="button"
            onClick={() => onStartStage(nextStage.n)}
            className="btn-pink"
            style={{
              border: "none",
              background: C.pink,
              color: C.surface,
              fontWeight: 800,
              fontSize: 15,
              padding: "14px 26px",
              borderRadius: 18,
              boxShadow: `0 4px 0 ${C.pinkDeep}`,
              cursor: "pointer",
            }}
          >
            {learnedCount === 0
              ? "เริ่มด่าน 1 · Start"
              : `เรียนต่อ ด่าน ${nextStage.n} · ${nextStage.title}`}
          </button>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flex: "0 0 auto",
            animation: "float 5s ease-in-out infinite",
          }}
          aria-hidden="true"
        >
          {[
            { ch: "ㄱ", bg: C.pinkTint, bd: C.border, rot: "-6deg" },
            { ch: "ㅏ", bg: C.blueTint, bd: C.blueBorder, rot: "3deg" },
            { ch: "가", bg: C.purpleTint, bd: C.purpleBorder, rot: "8deg" },
          ].map((t) => (
            <div
              key={t.ch}
              style={{
                width: 74,
                height: 88,
                borderRadius: 22,
                background: t.bg,
                border: `2px solid ${t.bd}`,
                display: "grid",
                placeItems: "center",
                fontFamily: KO,
                fontSize: 38,
                transform: `rotate(${t.rot})`,
              }}
            >
              {t.ch}
            </div>
          ))}
        </div>
      </section>

      <ProgressBar value={learnedCount} max={TOTAL_LETTERS} />

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          margin: "26px 4px 12px",
        }}
      >
        <h2 style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>
          {stages.length} ด่าน · Learning path
        </h2>
        <CurriculumSwitch curriculum={curriculum} onCurriculum={onCurriculum} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        {stages.map((s) => {
          const done = s.chars.filter((ch) => progress.learned[ch]).length;
          const complete = done === s.chars.length;
          return (
            <button
              key={s.n}
              type="button"
              onClick={() => onStartStage(s.n)}
              className="lesson-card"
              style={{
                textAlign: "left",
                cursor: "pointer",
                background: C.surface,
                border: `2px solid ${complete ? C.blueBorderStrong : C.border}`,
                borderRadius: 24,
                padding: 18,
                display: "flex",
                gap: 14,
                alignItems: "center",
                transition: "transform 0.15s ease, border-color 0.15s ease",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: KO,
                  fontSize: 26,
                  flex: "0 0 auto",
                  background: s.tint,
                }}
              >
                {s.glyph}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 3 }}>
                  ด่าน {s.n} · {s.title}
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: C.inkFaint,
                    fontWeight: 600,
                    lineHeight: 1.45,
                    fontFamily: KO,
                  }}
                >
                  {s.sub}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: complete ? C.blueText : C.label,
                    marginTop: 6,
                    letterSpacing: "0.4px",
                  }}
                >
                  {done}/{s.chars.length} {complete ? "· ครบแล้ว" : ""}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <h2 style={{ fontWeight: 800, fontSize: 15, margin: "26px 4px 12px" }}>
        ฝึกเพิ่ม · Practice
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        {[
          {
            id: "build" as const,
            glyph: "가",
            tint: C.purpleTint,
            title: "ผสมคำ",
            sub: "พยัญชนะ + สระ + ตัวสะกด แล้วฟังเสียง",
          },
          {
            id: "play" as const,
            glyph: "★",
            tint: C.pinkTint2,
            title: "ฝึกเล่น",
            sub: "จับคู่ และ ฟังเสียงเลือกคำตอบ",
          },
        ].map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => onGo(l.id)}
            className="lesson-card"
            style={{
              textAlign: "left",
              cursor: "pointer",
              background: C.surface,
              border: `2px solid ${C.border}`,
              borderRadius: 24,
              padding: 18,
              display: "flex",
              gap: 14,
              alignItems: "center",
              transition: "transform 0.15s ease, border-color 0.15s ease",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                display: "grid",
                placeItems: "center",
                fontFamily: KO,
                fontSize: 26,
                flex: "0 0 auto",
                background: l.tint,
              }}
            >
              {l.glyph}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 3 }}>{l.title}</div>
              <div
                style={{
                  fontSize: 12.5,
                  color: C.inkFaint,
                  fontWeight: 600,
                  lineHeight: 1.45,
                }}
              >
                {l.sub}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Two orders ship: 가나다 (the order Korean actually uses, and the default) and
 * the shape-derivation order (easier to memorise, useless for a dictionary).
 * Progress is stored per letter, so switching keeps everything already learned.
 */
function CurriculumSwitch({
  curriculum,
  onCurriculum,
}: {
  curriculum: Curriculum;
  onCurriculum: (id: CurriculumId) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: C.pinkTrack,
        padding: 4,
        borderRadius: 999,
      }}
      role="group"
      aria-label="ลำดับการเรียน"
    >
      {Object.values(CURRICULA).map((c) => {
        const on = c.id === curriculum.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onCurriculum(c.id)}
            aria-pressed={on}
            title={c.blurb}
            style={{
              border: "none",
              cursor: "pointer",
              borderRadius: 999,
              padding: "7px 14px",
              display: "grid",
              justifyItems: "center",
              gap: 1,
              background: on ? C.surface : "transparent",
              color: on ? C.ink : C.inkFaintest,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                fontFamily: c.id === "canonical" ? KO : undefined,
              }}
            >
              {c.label}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.75 }}>{c.sublabel}</span>
          </button>
        );
      })}
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div
      style={{
        background: C.surface,
        border: `2px solid ${C.border}`,
        borderRadius: 20,
        padding: "14px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          fontWeight: 800,
          color: C.label,
          letterSpacing: "1.1px",
          marginBottom: 8,
        }}
      >
        <span>ความคืบหน้า · PROGRESS</span>
        <span>{pct}%</span>
      </div>
      <div
        style={{ height: 10, borderRadius: 999, background: C.pinkTrack, overflow: "hidden" }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 999,
            background: C.pink,
            transition: "width 0.35s ease",
          }}
        />
      </div>
    </div>
  );
}
