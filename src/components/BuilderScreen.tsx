"use client";

import { useMemo, useState } from "react";
import {
  composeSyllable,
  neutralizedSyllable,
  romanizeSyllable,
  type Curriculum,
} from "@/data/hangul";
import { CLUSTER_FINALS, NEUTRALIZE, SINGLE_FINALS } from "@/data/finals";
import { speakKo } from "@/lib/audio";
import { C, KO } from "./theme";

/**
 * All 27 finals, banded the way ด่าน 5 and ด่าน 6 teach them rather than in
 * Unicode order.
 */
const FINAL_GROUPS_UI = [
  { label: "ไม่มีตัวสะกด · เดี่ยว และ คู่", items: ["", ...SINGLE_FINALS] },
  { label: "ตัวสะกดประสม · 겹받침", items: CLUSTER_FINALS },
];

export function BuilderScreen({ curriculum }: { curriculum: Curriculum }) {
  // Pickers follow whichever teaching order is active, so the builder reinforces
  // the lesson order instead of contradicting it.
  const INITIALS = useMemo(
    () => curriculum.order.filter((j) => j.kind === "consonant").map((j) => j.ch),
    [curriculum],
  );
  const MEDIALS = useMemo(
    () => curriculum.order.filter((j) => j.kind === "vowel").map((j) => j.ch),
    [curriculum],
  );

  const [initial, setInitial] = useState("ㄱ");
  const [medial, setMedial] = useState("ㅏ");
  const [final, setFinal] = useState("");

  const syllable = composeSyllable(initial, medial, final);
  const rom = romanizeSyllable(initial, medial, final);
  // What the syllable actually sounds like. 볶 and 복 are one sound, so one
  // recording — see neutralizedSyllable.
  const spoken = neutralizedSyllable(initial, medial, final);
  const shifts = Boolean(final) && NEUTRALIZE[final] !== final;

  return (
    <div>
      <section
        style={{
          background: C.surface,
          border: `2px solid ${C.border}`,
          borderRadius: 30,
          padding: "clamp(20px, 4vw, 28px)",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "1.2px",
            color: C.pinkText,
            marginBottom: 4,
          }}
        >
          ผสมคำ · SYLLABLE BUILDER
        </div>
        <p style={{ fontSize: 14, color: C.inkSoft, fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
          แตะพยัญชนะ + สระ แล้วดูว่ารวมกันเป็นตัวอะไร (ใส่ตัวสะกดได้ด้วย)
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(8px, 3vw, 20px)",
            padding: "26px 0 18px",
            flexWrap: "wrap",
          }}
        >
          <Slot ch={initial} bg={C.pinkTint} border="#EFC2D6" />
          <Op>+</Op>
          <Slot ch={medial} bg={C.blueTint} border="#B3D6E3" />
          {final ? (
            <>
              <Op>+</Op>
              <Slot ch={final} bg={C.purpleTint} border="#C0AEDE" />
            </>
          ) : null}
          <Op>=</Op>
          <div
            key={syllable}
            style={{
              minWidth: "clamp(84px, 22vw, 116px)",
              height: "clamp(84px, 22vw, 116px)",
              padding: "0 10px",
              borderRadius: 28,
              background: C.purpleTint,
              border: `2px solid ${C.purpleBorder}`,
              display: "grid",
              placeItems: "center",
              fontFamily: KO,
              fontSize: "clamp(44px, 11vw, 62px)",
              color: C.ink,
              animation: "pop 0.3s ease",
            }}
          >
            {syllable || "?"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 800, color: "#7A5D6D" }}>{rom}</div>
          <button
            type="button"
            onClick={() => void speakKo(spoken, "syl")}
            className="btn-pink"
            style={{
              border: "none",
              cursor: "pointer",
              background: C.pink,
              color: C.surface,
              fontWeight: 800,
              fontSize: 13.5,
              padding: "11px 20px",
              borderRadius: 16,
              boxShadow: `0 3px 0 ${C.pinkDeep}`,
            }}
          >
            ฟังเสียง
          </button>
          <button
            type="button"
            onClick={() => {
              setInitial("ㄱ");
              setMedial("ㅏ");
              setFinal("");
            }}
            className="btn-ghost"
            style={{
              cursor: "pointer",
              border: `2px solid ${C.border}`,
              background: C.surface,
              color: C.inkFaint,
              fontWeight: 800,
              fontSize: 13.5,
              padding: "10px 18px",
              borderRadius: 16,
            }}
          >
            ล้าง
          </button>
        </div>

        {final ? (
          <p
            style={{
              textAlign: "center",
              fontSize: 12.5,
              fontWeight: 700,
              color: C.inkFaint,
              margin: "14px 0 0",
              lineHeight: 1.5,
            }}
          >
            {shifts ? (
              <>
                <span style={{ fontFamily: KO, fontSize: 15, color: C.ink }}>{syllable}</span> อ่านว่า{" "}
                <span style={{ fontFamily: KO, fontSize: 15, color: C.ink }}>{spoken}</span> — ตัวสะกด
                <span style={{ fontFamily: KO }}> {final} </span>ยุบเป็น
                <span style={{ fontFamily: KO }}> {NEUTRALIZE[final]}</span>
              </>
            ) : (
              "ตัวสะกดเกาหลีมีแค่ 7 เสียง — ตัวอักษรอื่นที่มาอยู่ท้ายจะถูกยุบเป็น 1 ใน 7 นี้"
            )}
          </p>
        ) : null}
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        <Picker
          title="พยัญชนะต้น · INITIAL"
          color={C.pinkText}
          hoverClass="tile"
          items={INITIALS}
          selected={initial}
          onPick={setInitial}
        />
        <Picker
          title="สระ · VOWEL"
          color={C.blueText}
          hoverClass="tile-blue"
          items={MEDIALS}
          selected={medial}
          onPick={setMedial}
        />
        <Picker
          title="ตัวสะกด · FINAL (ตัวเลือก)"
          color={C.purpleText}
          hoverClass="tile-purple"
          items={FINAL_GROUPS_UI}
          selected={final}
          onPick={setFinal}
        />
      </div>
    </div>
  );
}

function Slot({ ch, bg, border }: { ch: string; bg: string; border: string }) {
  return (
    <div
      style={{
        width: "clamp(64px, 17vw, 88px)",
        height: "clamp(64px, 17vw, 88px)",
        borderRadius: 24,
        background: bg,
        border: `2px dashed ${border}`,
        display: "grid",
        placeItems: "center",
        fontFamily: KO,
        fontSize: "clamp(32px, 8vw, 44px)",
        color: C.ink,
      }}
    >
      {ch || "?"}
    </div>
  );
}

const Op = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 24, color: "#D9BACA", fontWeight: 800 }} aria-hidden="true">
    {children}
  </div>
);

/**
 * `items` is either one flat list of characters, or several labelled bands.
 * The final picker needs the bands: 28 undifferentiated tiles hide the fact
 * that eleven of them are 겹받침, which is a different lesson from the rest.
 */
type PickerGroup = { label?: string; items: string[] };

function Picker({
  title,
  color,
  hoverClass,
  items,
  selected,
  onPick,
}: {
  title: string;
  color: string;
  hoverClass: string;
  items: string[] | PickerGroup[];
  selected: string;
  onPick: (ch: string) => void;
}) {
  const groups: PickerGroup[] =
    typeof items[0] === "string" ? [{ items: items as string[] }] : (items as PickerGroup[]);

  return (
    <div
      style={{
        background: C.surface,
        border: `2px solid ${C.border}`,
        borderRadius: 26,
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "1.2px",
          color,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {groups.map((g, gi) => (
        <div key={g.label ?? gi}>
          {g.label ? (
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: "0.8px",
                color: C.inkFaintest,
                margin: gi === 0 ? "0 0 7px" : "12px 0 7px",
              }}
            >
              {g.label}
            </div>
          ) : null}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))",
              gap: 7,
            }}
          >
            {g.items.map((ch) => {
              const on = selected === ch;
              return (
                <button
                  key={ch || "none"}
                  type="button"
                  onClick={() => onPick(ch)}
                  aria-pressed={on}
                  className={hoverClass}
                  style={{
                    cursor: "pointer",
                    aspectRatio: "1",
                    borderRadius: 15,
                    fontFamily: ch ? KO : "inherit",
                    fontSize: 22,
                    background: on ? C.pinkTint : C.surface,
                    border: `2px solid ${on ? C.pink : C.border}`,
                    color: C.ink,
                  }}
                >
                  {ch || "–"}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
