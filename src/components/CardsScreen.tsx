"use client";

import { useEffect, useMemo, useState } from "react";
import { TOTAL_LETTERS, demoParts, type Curriculum, type Jamo } from "@/data/hangul";
import type { Progress } from "@/lib/progress";
import { speakKo } from "@/lib/audio";
import { SpeakerButton, SpeakerIcon } from "./SpeakerButton";
import { C, KO } from "./theme";

export function CardsScreen({
  curriculum,
  stage,
  onStage,
  progress,
  onLearned,
}: {
  curriculum: Curriculum;
  /** 0 = show all 40 in teaching order */
  stage: number;
  onStage: (n: number) => void;
  progress: Progress;
  onLearned: (ch: string) => void;
}) {
  const deck: Jamo[] = useMemo(
    () =>
      stage === 0
        ? curriculum.order
        : curriculum.order.filter((j) => curriculum.stageOf(j.ch) === stage),
    [curriculum, stage],
  );

  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [stage, curriculum]);

  const idx = Math.min(index, deck.length - 1);
  const card = deck[idx];
  const cardStage = curriculum.stageOf(card.ch);
  const stageInfo = curriculum.stages.find((s) => s.n === cardStage)!;

  const next = () => {
    onLearned(card.ch);
    setIndex((i) => (i + 1) % deck.length);
  };
  const prev = () => setIndex((i) => (i - 1 + deck.length) % deck.length);

  return (
    <div>
      <StageChips
        curriculum={curriculum}
        stage={stage}
        onStage={onStage}
        progress={progress}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 18,
          alignItems: "start",
        }}
      >
        <article
          style={{
            background: C.surface,
            border: `2px solid ${C.border}`,
            borderRadius: 30,
            padding: "clamp(20px, 4vw, 28px)",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12,
              fontWeight: 800,
              color: C.label,
              letterSpacing: "1.2px",
              marginBottom: 6,
            }}
          >
            <span>
              {idx + 1} / {deck.length}
            </span>
            <span>
              {card.kind === "consonant" ? "พยัญชนะ CONSONANT" : "สระ VOWEL"} · ด่าน {cardStage}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              padding: "10px 0 4px",
            }}
          >
            <div
              style={{
                fontFamily: KO,
                fontSize: "clamp(96px, 22vw, 150px)",
                lineHeight: 1.05,
                color: C.ink,
              }}
            >
              {card.ch}
            </div>
            <SpeakerButton
              text={card.nameKo}
              bucket="name"
              label={`ฟังชื่อตัวอักษร ${card.name}`}
            />
          </div>

          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.3px" }}>
              {card.rom}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.inkFaint, marginTop: 2 }}>
              <span style={{ fontFamily: KO }}>{card.name}</span> · เสียงไทย {card.thai}
            </div>
          </div>

          {/* Two clips, two different jobs: the letter's NAME vs the sound it
              actually makes inside a word. Beginners confuse these constantly. */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <AudioChip
              onClick={() => void speakKo(card.nameKo, "name")}
              caption="ชื่อตัวอักษร"
              value={card.nameKo}
              tint={C.pinkTint2}
              border="#F6DCE6"
              fg={C.pinkText}
            />
            <AudioChip
              onClick={() => void speakKo(card.demo, "sound")}
              caption="เสียงในคำจริง"
              value={card.demo}
              // The demo is never the letter alone — show what got added, so the
              // student can subtract it by ear.
              note={`${demoParts(card)[0]} + ${demoParts(card)[1]}`}
              tint={C.blueTint}
              border={C.blueBorder}
              fg={C.blueText}
            />
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <InfoBox
              label="ตำแหน่ง · POSITION"
              text={card.position}
              bg={C.pinkTint2}
              border="#F6DCE6"
              labelColor={C.pinkText}
              textColor="#6E5763"
            />
            {card.positions ? <PositionSounds card={card} /> : null}
            <InfoBox
              label="จำง่าย · MEMORY HINT"
              text={card.hint}
              bg={C.blueTint}
              border={C.blueBorder}
              labelColor={C.blueText}
              textColor={C.blueInk}
            />
            <div
              style={{
                background: C.purpleTint,
                border: `2px solid ${C.purpleBorder}`,
                borderRadius: 18,
                padding: "13px 15px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "1.1px",
                  color: C.purpleText,
                  marginBottom: 7,
                }}
              >
                ลำดับเส้น · STROKE ORDER ({card.strokeCount} เส้น)
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {card.strokes.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      background: C.surface,
                      border: `2px solid ${C.purpleBorder}`,
                      borderRadius: 14,
                      padding: "6px 11px 6px 7px",
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 999,
                        background: C.purpleBorder,
                        color: "#7B67A6",
                        fontSize: 11,
                        fontWeight: 800,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#7A5D6D" }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button
              type="button"
              onClick={prev}
              className="btn-ghost"
              style={{
                flex: 1,
                cursor: "pointer",
                border: `2px solid ${C.border}`,
                background: C.surface,
                color: C.inkSoft,
                fontWeight: 800,
                fontSize: 14,
                padding: 13,
                borderRadius: 18,
              }}
            >
              ก่อนหน้า
            </button>
            <button
              type="button"
              onClick={next}
              className="btn-blue"
              style={{
                flex: 2,
                cursor: "pointer",
                border: "none",
                background: C.blue,
                color: C.surface,
                fontWeight: 800,
                fontSize: 14,
                padding: 13,
                borderRadius: 18,
                boxShadow: `0 4px 0 ${C.blueDeep}`,
              }}
            >
              จำได้แล้ว · Got it
            </button>
          </div>
        </article>

        <aside style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <div
            style={{
              background: C.surface,
              border: `2px solid ${C.border}`,
              borderRadius: 26,
              padding: 18,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "1.2px",
                color: C.purpleText,
                marginBottom: 8,
              }}
            >
              กฎของด่าน {stageInfo.n} · THE RULE
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>
              {stageInfo.title}
            </div>
            <p
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: C.inkSoft,
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {stageInfo.rule}
            </p>
          </div>

          <div
            style={{
              background: C.surface,
              border: `2px solid ${C.border}`,
              borderRadius: 30,
              padding: 18,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "1.2px",
                color: C.label,
                marginBottom: 12,
              }}
            >
              {stage === 0
                ? `ทั้งหมด ${TOTAL_LETTERS} ตัว · ALL LETTERS`
                : `ด่าน ${stage} · THIS STAGE`}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))",
                gap: 8,
              }}
            >
              {deck.map((d, i) => {
                const on = i === idx;
                return (
                  <button
                    key={d.ch}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={d.name}
                    className="tile"
                    style={{
                      cursor: "pointer",
                      aspectRatio: "1",
                      borderRadius: 16,
                      fontFamily: KO,
                      fontSize: 24,
                      display: "grid",
                      placeItems: "center",
                      background: on
                        ? C.pinkTint
                        : progress.learned[d.ch]
                          ? C.blueTint
                          : C.surface,
                      border: `2px solid ${on ? C.pink : C.border}`,
                      color: C.ink,
                    }}
                  >
                    {d.ch}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StageChips({
  curriculum,
  stage,
  onStage,
  progress,
}: {
  curriculum: Curriculum;
  stage: number;
  onStage: (n: number) => void;
  progress: Progress;
}) {
  const chip = (on: boolean): React.CSSProperties => ({
    border: "none",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13.5,
    padding: "9px 16px",
    borderRadius: 999,
    whiteSpace: "nowrap",
    background: on ? C.surface : "transparent",
    color: on ? C.ink : C.inkFaintest,
  });

  return (
    <div
      className="scroll-x"
      style={{
        display: "flex",
        gap: 6,
        marginBottom: 16,
        background: C.pinkTrack,
        padding: 5,
        borderRadius: 999,
        maxWidth: "100%",
      }}
    >
      {curriculum.stages.map((s) => {
        const complete = s.chars.every((ch) => progress.learned[ch]);
        return (
          <button key={s.n} type="button" onClick={() => onStage(s.n)} style={chip(stage === s.n)}>
            {complete ? "✓ " : ""}
            {s.n}. {s.title}
          </button>
        );
      })}
      <button type="button" onClick={() => onStage(0)} style={chip(stage === 0)}>
        ทั้งหมด {TOTAL_LETTERS}
      </button>
    </div>
  );
}

/**
 * Only rendered for ㄱ ㄷ ㅂ ㅈ. These are the letters where the romanization on
 * the card ("g") and the sound a beginner actually hears at the start of a word
 * ("k") disagree — so show all three slots side by side, each with a real word
 * they can play and compare.
 */
function PositionSounds({ card }: { card: Jamo }) {
  const rows = card.positions!;
  return (
    <div
      style={{
        background: "#FFF6E9",
        border: "2px solid #F3DEC0",
        borderRadius: 18,
        padding: "13px 15px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "1.1px",
          color: "#B0873F",
          marginBottom: 4,
        }}
      >
        เสียงเปลี่ยนตามตำแหน่ง · SOUND SHIFTS
      </div>
      <p style={{ fontSize: 12.5, fontWeight: 600, color: "#8A6D3B", lineHeight: 1.5, margin: "0 0 10px" }}>
        <span style={{ fontFamily: KO }}>{card.ch}</span> ไม่มีเสียงก้องของตัวเอง
        จึงยืมจากเสียงข้างเคียง — แตะฟังแล้วเทียบกัน
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {rows.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => void speakKo(p.word, "word")}
            aria-label={`ฟังคำว่า ${p.word} (${p.gloss})`}
            style={{
              cursor: "pointer",
              background: C.surface,
              border: "2px solid #F3DEC0",
              borderRadius: 14,
              padding: "9px 11px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              textAlign: "left",
            }}
          >
            <span style={{ color: "#C79A4A", flex: "0 0 auto", display: "grid" }}>
              <SpeakerIcon size={17} />
            </span>
            <span style={{ flex: "0 0 auto", display: "grid", gap: 1, minWidth: 72 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: "#B0873F", letterSpacing: "0.5px" }}>
                {p.label}
              </span>
              <span style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>{p.thai}</span>
            </span>
            <span style={{ minWidth: 0, display: "grid", gap: 1 }}>
              <span style={{ fontSize: 15, color: C.ink }}>
                <span style={{ fontFamily: KO }}>{p.word}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.inkFaint, marginLeft: 6 }}>
                  {p.rom} · {p.gloss}
                </span>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "#8A6D3B", lineHeight: 1.4 }}>
                {p.explain}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AudioChip({
  onClick,
  caption,
  value,
  note,
  tint,
  border,
  fg,
}: {
  onClick: () => void;
  caption: string;
  value: string;
  note?: string;
  tint: string;
  border: string;
  fg: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        cursor: "pointer",
        background: tint,
        border: `2px solid ${border}`,
        borderRadius: 18,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        textAlign: "left",
      }}
    >
      <span style={{ color: fg, display: "grid", placeItems: "center", flex: "0 0 auto" }}>
        <SpeakerIcon size={18} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: "0.9px",
            color: fg,
          }}
        >
          {caption}
        </span>
        <span style={{ display: "block", fontFamily: KO, fontSize: 18, color: C.ink }}>
          {value}
          {note ? (
            <span style={{ fontSize: 12, color: C.inkFaint, marginLeft: 6 }}>= {note}</span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

function InfoBox({
  label,
  text,
  bg,
  border,
  labelColor,
  textColor,
}: {
  label: string;
  text: string;
  bg: string;
  border: string;
  labelColor: string;
  textColor: string;
}) {
  return (
    <div
      style={{ background: bg, border: `2px solid ${border}`, borderRadius: 18, padding: "13px 15px" }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "1.1px",
          color: labelColor,
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: textColor, lineHeight: 1.55 }}>
        {text}
      </div>
    </div>
  );
}
