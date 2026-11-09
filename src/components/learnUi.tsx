"use client";

/** The handful of shapes the path screens share. Tokens come from theme.ts. */

import { C, KO } from "./theme";

export const card: React.CSSProperties = {
  background: C.surface,
  border: `2px solid ${C.border}`,
  borderRadius: 24,
  padding: "clamp(15px, 3.5vw, 20px)",
};

export const eyebrow: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "1.4px",
  color: C.pinkText,
  textTransform: "uppercase",
};

export const primary: React.CSSProperties = {
  display: "block",
  width: "100%",
  border: "none",
  background: C.pink,
  color: C.surface,
  fontWeight: 800,
  fontSize: 15.5,
  padding: "15px 20px",
  borderRadius: 18,
  boxShadow: `0 4px 0 ${C.pinkDeep}`,
  cursor: "pointer",
  textAlign: "center",
};

export const quiet: React.CSSProperties = {
  border: `2px solid ${C.border}`,
  background: C.surface,
  color: C.inkSoft,
  borderRadius: 16,
  padding: "12px 16px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
  minHeight: 44,
  whiteSpace: "nowrap",
};

export function Glyph({
  ch,
  size = 44,
  tone = "pink",
}: {
  ch: string;
  size?: number;
  tone?: "pink" | "blue" | "plain";
}) {
  const bg = tone === "pink" ? C.pinkTint : tone === "blue" ? C.blueTint : C.surface;
  const bd = tone === "blue" ? C.blueBorder : C.border;
  return (
    <span
      style={{
        fontFamily: KO,
        fontSize: size,
        lineHeight: 1,
        display: "grid",
        placeItems: "center",
        width: size * 1.5,
        height: size * 1.5,
        borderRadius: 20,
        background: bg,
        border: `2px solid ${bd}`,
        color: C.ink,
      }}
    >
      {ch}
    </span>
  );
}

/** The four bars at the top of every step. */
export function StepBars({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", gap: 5, marginTop: 12 }}>
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          style={{
            flex: 1,
            height: 7,
            borderRadius: 999,
            background: n < step ? C.blue : n === step ? C.pink : C.pinkTrack,
          }}
        />
      ))}
    </div>
  );
}

export function StepHeader({
  step,
  sub,
  onBack,
}: {
  step: number;
  sub: string;
  onBack: () => void;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          onClick={onBack}
          aria-label="ย้อนกลับ"
          style={{
            width: 36,
            height: 36,
            borderRadius: 14,
            border: `2px solid ${C.border}`,
            background: C.surface,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={C.inkSoft} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 3 L5 8 L10 13" />
          </svg>
        </button>
        <div style={{ flexGrow: 1 }}>
          <div style={eyebrow}>ขั้นที่ {step} จาก 4</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#7A6472" }}>{sub}</div>
        </div>
      </div>
      <StepBars step={step} />
    </div>
  );
}

export function SpeakerGlyph({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 L6 9 H3 v6 h3 l5 4 z" />
      <path d="M16 9 a4 4 0 0 1 0 6" />
      <path d="M18.5 6.5 a7.5 7.5 0 0 1 0 11" />
    </svg>
  );
}

export function SoundButton({
  onClick,
  size = 86,
  label = "เล่นเสียงอีกครั้ง",
}: {
  onClick: () => void;
  size?: number;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.35,
        border: `2px solid ${C.borderStrong}`,
        background: C.pinkTint,
        color: C.pinkText,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <SpeakerGlyph size={size * 0.4} />
    </button>
  );
}
