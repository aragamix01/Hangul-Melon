"use client";

import { C, KO } from "./theme";

export type Screen = "home" | "cards" | "build" | "play";

const ITEMS: Array<{ id: Screen; glyph: string; label: string }> = [
  { id: "home", glyph: "한", label: "หน้าแรก" },
  { id: "cards", glyph: "ㄱ", label: "บัตรคำ" },
  { id: "build", glyph: "가", label: "ผสมคำ" },
  { id: "play", glyph: "★", label: "ฝึกเล่น" },
];

export function Nav({
  screen,
  onGo,
}: {
  screen: Screen;
  onGo: (s: Screen) => void;
}) {
  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        padding: "12px clamp(12px, 4vw, 20px) calc(12px + env(safe-area-inset-bottom))",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          display: "flex",
          gap: 4,
          background: C.surface,
          border: `2px solid ${C.border}`,
          borderRadius: 26,
          padding: 6,
          boxShadow: "0 8px 24px rgba(120, 70, 100, 0.14)",
          width: "min(100%, 460px)",
        }}
      >
        {ITEMS.map((n) => {
          const on = screen === n.id;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onGo(n.id)}
              aria-current={on ? "page" : undefined}
              className="nav-btn"
              style={{
                flex: 1,
                cursor: "pointer",
                border: "none",
                borderRadius: 20,
                padding: "10px 4px 9px",
                display: "grid",
                gap: 3,
                justifyItems: "center",
                background: on ? C.pinkTint : "transparent",
                color: on ? "#C46D93" : C.inkFaintest,
              }}
            >
              <span style={{ fontFamily: KO, fontSize: 19, lineHeight: 1 }}>{n.glyph}</span>
              <span style={{ fontSize: 11, fontWeight: 800 }}>{n.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
