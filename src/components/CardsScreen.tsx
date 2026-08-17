"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  TOTAL_CARDS,
  cardsOf,
  demoParts,
  spokenForm,
  type Card,
  type Curriculum,
  type Jamo,
} from "@/data/hangul";
import { LIAISON, type Cluster, type FinalGroup } from "@/data/finals";
import type { Progress } from "@/lib/progress";
import { speakKo } from "@/lib/audio";
import { SpeakerButton, SpeakerIcon } from "./SpeakerButton";
import { StrokeAnimation } from "./StrokeAnimation";
import { C, KO } from "./theme";

/** The 받침 stages borrow the amber palette the SOUND SHIFTS panel already uses. */
const AMBER = { tint: "#FFF6E9", border: "#F3DEC0", text: "#B0873F", ink: "#8A6D3B" };

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
  const deck: Card[] = useMemo(() => cardsOf(curriculum, stage), [curriculum, stage]);

  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [stage, curriculum]);

  const idx = Math.min(index, deck.length - 1);
  const card = deck[idx];
  const cardStage = curriculum.stageOf(card.key);
  const stageInfo = curriculum.stages.find((s) => s.n === cardStage)!;

  const next = () => {
    onLearned(card.key);
    setIndex((i) => (i + 1) % deck.length);
  };
  const prev = () => setIndex((i) => (i - 1 + deck.length) % deck.length);

  /**
   * Whenever the card changes — next, previous, or a tap in the letter grid —
   * put the flashcard back at the top of the viewport.
   *
   * Without this the browser keeps the old scroll offset, so on a phone you
   * finish a card near the bottom of the page, tap จำได้แล้ว, and end up staring
   * at the letter grid with the new letter off-screen above you.
   */
  const cardRef = useRef<HTMLElement | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    // Don't yank the page on first paint — only on an actual card change.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const el = cardRef.current;
    if (!el) return;
    // Instant, not smooth: cards differ in height, and the page resizing under a
    // smooth scroll aborts the animation partway, leaving the card stranded
    // half off-screen. An instant jump lands on the card every time.
    el.scrollIntoView({ block: "start", behavior: "auto" });
  }, [card.key]);

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
          ref={cardRef}
          style={{
            background: C.surface,
            border: `2px solid ${C.border}`,
            borderRadius: 30,
            padding: "clamp(20px, 4vw, 28px)",
            position: "relative",
            // Breathing room above the card once scrollIntoView lands it at the top.
            scrollMarginTop: 16,
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
              {BADGE[card.kind]} · ด่าน {cardStage}
            </span>
          </div>

          {card.kind === "letter" ? <LetterBody card={card.jamo} /> : null}
          {card.kind === "final" ? <FinalBody group={card.group} /> : null}
          {card.kind === "cluster" ? <ClusterBody cluster={card.cluster} /> : null}

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
                ? `ทั้งหมด ${TOTAL_CARDS} ใบ · ALL CARDS`
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
                    key={d.key}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={tileLabel(d)}
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
                        : progress.learned[d.key]
                          ? C.blueTint
                          : C.surface,
                      border: `2px solid ${on ? C.pink : C.border}`,
                      color: C.ink,
                    }}
                  >
                    {d.glyph}
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
        ทั้งหมด {TOTAL_CARDS}
      </button>
    </div>
  );
}

const BADGE: Record<Card["kind"], string> = {
  letter: "อักษร LETTER",
  final: "ตัวสะกด FINAL",
  cluster: "ตัวสะกดประสม CLUSTER",
};

function tileLabel(card: Card): string {
  if (card.kind === "letter") return card.jamo.name;
  if (card.kind === "final") return `${card.group.mae} — ${card.group.finals.join(" ")}`;
  return `${card.cluster.ch} อ่านเป็น ${card.cluster.reads}`;
}

/** The original flashcard, unchanged — one of the 40 letters. */
function LetterBody({ card }: { card: Jamo }) {
  return (
    <>
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
        <SpeakerButton text={card.nameKo} bucket="name" label={`ฟังชื่อตัวอักษร ${card.name}`} />
      </div>

      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.3px" }}>{card.rom}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.inkFaint, marginTop: 2 }}>
          <span style={{ fontFamily: KO }}>{card.name}</span> · เสียงไทย {card.thai}
        </div>
      </div>

      {/* Two clips, two different jobs: the letter's NAME vs the sound it
          actually makes inside a word. Beginners confuse these constantly. */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
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
          <div style={{ display: "grid", placeItems: "center" }}>
            <StrokeAnimation key={card.ch} strokes={card.strokes} size={200} />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * One of the seven sounds a syllable can end in.
 *
 * The card is built around the collapse rather than around a letter: the
 * example syllables all play the *same* clip, because they are the same sound.
 * Hearing 복 볶 봌 come back identical is the entire lesson, and it only works
 * if they really are one recording.
 */
function FinalBody({ group }: { group: FinalGroup }) {
  const [demo] = group.examples;
  return (
    <>
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
            fontSize: "clamp(76px, 17vw, 118px)",
            lineHeight: 1.05,
            color: C.ink,
          }}
        >
          {demo}
        </div>
        <SpeakerButton text={spokenForm(demo)} bucket="syl" label={`ฟังเสียง ${group.mae}`} />
      </div>

      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.3px" }}>{group.mae}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.inkFaint, marginTop: 2 }}>
          <span style={{ fontFamily: KO }}>{group.finals.join(" ")}</span> · เสียงไทย {group.thai}
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div
          style={{
            background: AMBER.tint,
            border: `2px solid ${AMBER.border}`,
            borderRadius: 18,
            padding: "13px 15px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "1.1px",
              color: AMBER.text,
              marginBottom: 8,
            }}
          >
            {group.finals.length} ตัวอักษร · 1 เสียง
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {group.finals.map((f, i) => (
              <button
                key={f}
                type="button"
                onClick={() => void speakKo(spokenForm(group.examples[i]), "syl")}
                aria-label={`ฟัง ${group.examples[i]} — ${f} เป็นตัวสะกด`}
                style={{
                  cursor: "pointer",
                  background: C.surface,
                  border: `2px solid ${AMBER.border}`,
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
                <span style={{ fontFamily: KO, fontSize: 20, fontWeight: 800, minWidth: 34 }}>
                  {f}
                </span>
                <span style={{ fontFamily: KO, fontSize: 22, color: C.ink }}>
                  {group.examples[i]}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: AMBER.ink,
                  }}
                >
                  = {group.thai}
                </span>
              </button>
            ))}
          </div>
        </div>

        <InfoBox
          label="ทำไมถึงยุบ · WHY"
          text={group.note}
          bg={C.pinkTint2}
          border="#F6DCE6"
          labelColor={C.pinkText}
          textColor="#6E5763"
        />

        {/* The PDF prints the liaison rule right after แม่กง, because ㅇ is the
            one final that also appears as a silent initial. */}
        {group.sound === "ㅇ" ? <LiaisonBox /> : null}
      </div>
    </>
  );
}

function LiaisonBox() {
  return (
    <div
      style={{
        background: C.blueTint,
        border: `2px solid ${C.blueBorder}`,
        borderRadius: 18,
        padding: "13px 15px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "1.1px",
          color: C.blueText,
          marginBottom: 7,
        }}
      >
        ตัวสะกดย้ายที่ · 연음
      </div>
      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: C.blueInk,
          lineHeight: 1.6,
          margin: "0 0 10px",
        }}
      >
        {LIAISON.rule}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <AudioChip
          onClick={() => void speakKo(LIAISON.written, "word")}
          caption="เขียน"
          value={LIAISON.written}
          tint={C.surface}
          border={C.blueBorder}
          fg={C.blueText}
        />
        <AudioChip
          onClick={() => void speakKo(LIAISON.said, "word")}
          caption={`อ่าน · ${LIAISON.thai}`}
          value={LIAISON.said}
          tint={C.surface}
          border={C.blueBorder}
          fg={C.blueText}
        />
      </div>
    </div>
  );
}

/**
 * A 겹받침 — written with two consonants, read with one.
 *
 * Both spellings get their own clip rather than a composed sound, because the
 * PDF's words don't merely neutralise: 앉다 tenses to [안따] and 많다 fuses its
 * ㅎ into [만타]. Playing the two back to back is the only way to show that the
 * word on the page and the sound in the ear really are the same thing.
 */
function ClusterBody({ cluster }: { cluster: Cluster }) {
  const front = cluster.side === "หน้า";
  return (
    <>
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
            fontSize: "clamp(86px, 20vw, 132px)",
            lineHeight: 1.05,
            color: C.ink,
          }}
        >
          {cluster.ch}
        </div>
        <SpeakerButton
          text={cluster.word}
          bucket="word"
          label={`ฟังคำว่า ${cluster.word} (${cluster.gloss})`}
        />
      </div>

      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.3px" }}>
          อ่านตัว{cluster.side}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.inkFaint, marginTop: 2 }}>
          <span style={{ fontFamily: KO }}>
            {cluster.parts[0]} + {cluster.parts[1]} → {cluster.reads}
          </span>{" "}
          · เสียงไทย {cluster.thai}
        </div>
      </div>

      {/* The half that is read, and the half that is silent, shown as the
          shapes themselves — this is a memorisation task, not a rule. */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {cluster.parts.map((p, i) => {
          const spoken = front ? i === 0 : i === 1;
          return (
            <div
              key={p}
              style={{
                width: 78,
                borderRadius: 18,
                padding: "10px 0",
                display: "grid",
                justifyItems: "center",
                gap: 2,
                background: spoken ? C.blueTint : C.pinkTrack,
                border: `2px solid ${spoken ? C.blueBorderStrong : C.border}`,
                opacity: spoken ? 1 : 0.55,
              }}
            >
              <span style={{ fontFamily: KO, fontSize: 30, fontWeight: 800 }}>{p}</span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: "0.6px",
                  color: spoken ? C.blueText : C.inkFaintest,
                }}
              >
                {spoken ? "ออกเสียง" : "เงียบ"}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <AudioChip
            onClick={() => void speakKo(cluster.word, "word")}
            caption="เขียน"
            value={cluster.word}
            note={cluster.gloss}
            tint={C.pinkTint2}
            border="#F6DCE6"
            fg={C.pinkText}
          />
          <AudioChip
            onClick={() => void speakKo(cluster.said, "word")}
            caption="อ่านจริง"
            value={cluster.said}
            tint={C.blueTint}
            border={C.blueBorder}
            fg={C.blueText}
          />
        </div>

        {cluster.exception ? (
          <div
            style={{
              background: AMBER.tint,
              border: `2px solid ${AMBER.border}`,
              borderRadius: 18,
              padding: "13px 15px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "1.1px",
                color: AMBER.text,
                marginBottom: 7,
              }}
            >
              ข้อยกเว้น · EXCEPTION
            </div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: AMBER.ink,
                lineHeight: 1.6,
                margin: "0 0 10px",
              }}
            >
              {cluster.exception.note}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <AudioChip
                onClick={() => void speakKo(cluster.exception!.word, "word")}
                caption="เขียน"
                value={cluster.exception.word}
                note={cluster.exception.gloss}
                tint={C.surface}
                border={AMBER.border}
                fg={AMBER.text}
              />
              <AudioChip
                onClick={() => void speakKo(cluster.exception!.said, "word")}
                caption="อ่านจริง"
                value={cluster.exception.said}
                tint={C.surface}
                border={AMBER.border}
                fg={AMBER.text}
              />
            </div>
          </div>
        ) : null}
      </div>
    </>
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
          marginBottom: 8,
        }}
      >
        เสียงเปลี่ยนตามตำแหน่ง · SOUND SHIFTS
      </div>
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
