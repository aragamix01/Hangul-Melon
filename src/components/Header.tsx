"use client";

import { TOTAL_CARDS } from "@/data/hangul";
import { C, KO } from "./theme";

const pill: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: C.surface,
  border: `2px solid ${C.border}`,
  borderRadius: 999,
  padding: "7px 13px",
  fontWeight: 700,
  fontSize: 13,
};

const dot = (bg: string): React.CSSProperties => ({
  width: 9,
  height: 9,
  borderRadius: 999,
  background: bg,
  display: "inline-block",
});

export function Header({ streak, learned }: { streak: number; learned: number }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 22,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 16,
            background: C.pink,
            display: "grid",
            placeItems: "center",
            fontFamily: KO,
            fontSize: 22,
            color: C.surface,
            boxShadow: `0 4px 0 ${C.pinkDeep}`,
          }}
        >
          한
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.2px" }}>
            Hangul Melon
          </div>
          <div style={{ fontSize: 12, color: C.inkFaint, fontWeight: 600 }}>
            เรียนภาษาเกาหลีวันละนิด
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={pill} title="เข้าเรียนต่อเนื่อง">
          <span style={dot(C.gold)} />
          {streak} วัน
        </div>
        <div style={pill} title="บัตรคำที่จำได้แล้ว">
          <span style={dot(C.blue)} />
          {learned}/{TOTAL_CARDS}
        </div>
      </div>
    </header>
  );
}
