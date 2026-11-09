"use client";

/**
 * One day of the path: a brief, four steps, a summary.
 *
 * The steps climb from recognition to recall — see first, then pick the letter
 * out of its nearest neighbour, then produce it with no options on screen, then
 * read it inside a real syllable. Nothing here is written per letter: every
 * exercise is generated from the fields in src/data plus the student's own
 * record in lib/srs.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JAMO_BY_CHAR, VOICING, type Jamo } from "@/data/hangul";
import { compose, thaiSyllable, READABLE_VOWELS, type PathDay } from "@/data/path";
import { speakKo, stopAudio } from "@/lib/audio";
import { ALL_JAMO, distractorsFor, traceScore, type Point } from "@/lib/similarity";
import { dueKeys, type SrsState } from "@/lib/srs";
import { C, KO } from "./theme";
import { card, eyebrow, Glyph, primary, quiet, SoundButton, SpeakerGlyph, StepHeader } from "./learnUi";

const shuffle = <T,>(a: T[]): T[] =>
  a
    .map((x) => [Math.random(), x] as const)
    .sort((p, q) => p[0] - q[0])
    .map(([, x]) => x);

const head = (thai: string) => thai.split("·")[0].trim();

/**
 * A chip-sized reading. Most letters give one or two Thai letters; ㅇ's entry is
 * a sentence ("ออกเสียงตามสระที่เจอ"), so those fall back to the romanization.
 */
const shortThai = (j: Jamo) => {
  const t = head(j.thai);
  return Array.from(t).length <= 8 ? t : j.rom;
};

/** The 두벌식 layout, the one a Korean phone keyboard actually uses. */
const KEY_ROWS = [
  ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
  ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
  ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ"],
];

interface PairQuestion {
  answer: Jamo;
  other: Jamo;
}

interface WordQuestion {
  syllable: string;
  lead: Jamo;
  medial: Jamo;
  right: string;
  options: string[];
}

export interface DaySession {
  fresh: Jamo[];
  review: Jamo[];
  contrast: [Jamo, Jamo] | null;
  pairs: PairQuestion[];
  trace: Jamo[];
  type: Jamo[];
  words: WordQuestion[];
  /** Everything that will be asked, for the "N ข้อ" counts */
  total: number;
}

/** The medial (voiced) Thai value, which is what a second syllable takes. */
function medialThai(j: Jamo): string {
  return VOICING[j.ch]?.[1]?.thai ?? head(j.thai);
}

function buildWords(lead: Jamo[], medial: Jamo[], limit: number): WordQuestion[] {
  const out: WordQuestion[] = [];
  for (const v of medial) {
    for (const c of lead) {
      const syllable = compose(c.ch, v.ch);
      const right = thaiSyllable(head(c.thai), c.ch, v.ch);
      if (!syllable || !right) continue;

      // The wrong readings a Thai ear actually produces, in the order they are
      // worth testing: the voiced value used word-initially (가방 looks like
      // "gabang" but opens with ค), then the nearest-sounding consonant, then
      // the nearest vowel. The consonant decoys come from the whole alphabet —
      // they are Thai syllables on a button, not letters being taught.
      const wrong = new Set<string>();
      const add = (s: string | null) => {
        if (s && s !== right && wrong.size < 2) wrong.add(s);
      };
      add(thaiSyllable(medialThai(c), c.ch, v.ch));
      for (const d of distractorsFor(c, ALL_JAMO, 3)) add(thaiSyllable(head(d.thai), d.ch, v.ch));
      for (const w of medial) if (w.ch !== v.ch) add(thaiSyllable(head(c.thai), c.ch, w.ch));
      if (wrong.size < 2) continue;

      out.push({
        syllable,
        lead: c,
        medial: v,
        right,
        options: shuffle([right, ...Array.from(wrong).slice(0, 2)]),
      });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export function buildSession(day: PathDay, srs: SrsState): DaySession {
  const fresh = day.chars.map((ch) => JAMO_BY_CHAR[ch]).filter(Boolean);
  const freshSet = new Set(day.chars);

  const due = dueKeys(srs)
    .filter((ch) => JAMO_BY_CHAR[ch] && !freshSet.has(ch))
    .slice(0, 5)
    .map((ch) => JAMO_BY_CHAR[ch]);

  const known = Object.keys(srs.cards)
    .filter((ch) => JAMO_BY_CHAR[ch])
    .map((ch) => JAMO_BY_CHAR[ch]);
  const pool = [...known, ...fresh];

  const contrast: [Jamo, Jamo] | null = day.contrast
    ? [JAMO_BY_CHAR[day.contrast[0]], JAMO_BY_CHAR[day.contrast[1]]]
    : null;

  // Every letter in play, each asked against the one it is most confusable
  // with — a two-way choice where elimination tells the student nothing.
  const asked = [...fresh, ...due].slice(0, 8);
  const pairs: PairQuestion[] = asked
    .map((answer) => {
      // Early days hold too few letters of one kind to supply a decoy, so fall
      // back to the whole alphabet rather than dropping the question.
      const other =
        distractorsFor(answer, pool, 1, srs.confusions)[0] ??
        distractorsFor(answer, ALL_JAMO, 1, srs.confusions)[0];
      return other ? { answer, other } : null;
    })
    .filter((q): q is PairQuestion => q !== null);

  const type = pool.filter((j) => (srs.cards[j.ch]?.box ?? 0) >= 3).slice(0, 4);

  const leads = pool.filter((j) => j.kind === "consonant");
  const medials = pool.filter((j) => j.kind === "vowel" && READABLE_VOWELS.includes(j.ch));
  const words = buildWords(shuffle(leads), shuffle(medials), 3);

  return {
    fresh,
    review: due,
    contrast,
    pairs,
    trace: fresh.slice(0, 3),
    type,
    words,
    total: pairs.length + fresh.slice(0, 3).length + type.length + words.length,
  };
}

type Phase = "brief" | "meet" | "pairs" | "trace" | "type" | "words" | "done";

export function DayFlow({
  day,
  session,
  onAnswer,
  onFinish,
  onExit,
}: {
  day: PathDay;
  session: DaySession;
  onAnswer: (ch: string, ok: boolean, picked?: string) => void;
  onFinish: (right: number, total: number) => void;
  onExit: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("brief");
  const [right, setRight] = useState(0);
  const [asked, setAsked] = useState(0);

  useEffect(() => stopAudio(), [phase]);

  const score = useCallback(
    (ch: string, ok: boolean, picked?: string) => {
      setAsked((n) => n + 1);
      if (ok) setRight((n) => n + 1);
      onAnswer(ch, ok, picked);
    },
    [onAnswer],
  );

  const after = useCallback(
    (p: Phase) => {
      const order: Phase[] = ["trace", "type", "words", "done"];
      const rest = order.slice(order.indexOf(p) + 1);
      for (const next of rest) {
        if (next === "trace" && !session.trace.length) continue;
        if (next === "type" && !session.type.length) continue;
        if (next === "words" && !session.words.length) continue;
        return next;
      }
      return "done";
    },
    [session],
  );

  if (phase === "brief") {
    return <Brief day={day} session={session} onStart={() => setPhase("meet")} onExit={onExit} />;
  }
  if (phase === "meet") {
    return (
      <MeetStep
        items={session.fresh}
        onBack={() => setPhase("brief")}
        onDone={() => setPhase(session.pairs.length ? "pairs" : after("trace"))}
      />
    );
  }
  if (phase === "pairs") {
    return (
      <PairStep
        questions={session.pairs}
        onBack={() => setPhase("meet")}
        onScore={score}
        onDone={() => setPhase(session.trace.length ? "trace" : after("trace"))}
      />
    );
  }
  if (phase === "trace") {
    return (
      <TraceStep
        items={session.trace}
        hasType={session.type.length > 0}
        onBack={() => setPhase("pairs")}
        onScore={score}
        onDone={() => setPhase(after("trace"))}
      />
    );
  }
  if (phase === "type") {
    return (
      <TypeStep
        items={session.type}
        onBack={() => setPhase(session.trace.length ? "trace" : "pairs")}
        onScore={score}
        onDone={() => setPhase(after("type"))}
      />
    );
  }
  if (phase === "words") {
    return (
      <WordStep
        questions={session.words}
        onBack={() => setPhase(session.type.length ? "type" : "trace")}
        onScore={score}
        onDone={() => setPhase("done")}
      />
    );
  }

  return (
    <DoneStep
      day={day}
      session={session}
      right={right}
      asked={asked}
      onClose={() => {
        onFinish(right, asked);
        onExit();
      }}
    />
  );
}

/* ---------------------------------------------------------------- brief -- */

function Brief({
  day,
  session,
  onStart,
  onExit,
}: {
  day: PathDay;
  session: DaySession;
  onStart: () => void;
  onExit: () => void;
}) {
  return (
    <div style={{ animation: "pop 0.35s ease both", display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          onClick={onExit}
          aria-label="กลับไปหน้าเส้นทาง"
          style={{
            width: 36,
            height: 36,
            borderRadius: 14,
            border: `2px solid ${C.border}`,
            background: C.surface,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={C.inkSoft} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 3 L5 8 L10 13" />
          </svg>
        </button>
        <div>
          <div style={eyebrow}>SET {day.day} · {day.title}</div>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.4px" }}>เซ็ตของวันนี้</div>
        </div>
      </div>

      <section style={card}>
        <div style={{ fontSize: 13.5, fontWeight: 800 }}>ตัวใหม่ {session.fresh.length} ตัว</div>
        <div style={{ display: "flex", gap: 8, marginTop: 11 }}>
          {session.fresh.map((j) => (
            <div
              key={j.ch}
              style={{
                flex: 1,
                background: C.pinkTint,
                border: `2px solid ${C.border}`,
                borderRadius: 16,
                padding: "10px 6px",
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: KO, fontSize: 30, lineHeight: 1.05 }}>{j.ch}</div>
              <div style={{ fontSize: 11, fontWeight: 800, marginTop: 5 }}>{shortThai(j)}</div>
            </div>
          ))}
        </div>
      </section>

      {session.review.length > 0 && (
        <section style={card}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div style={{ fontSize: 13.5, fontWeight: 800 }}>ทบทวน {session.review.length} ตัว</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft }}>ถึงคิววันนี้</div>
          </div>
          <div style={{ display: "flex", gap: 7, marginTop: 11, flexWrap: "wrap" }}>
            {session.review.map((j) => (
              <div
                key={j.ch}
                style={{
                  background: C.blueTint,
                  border: `2px solid ${C.blueBorder}`,
                  borderRadius: 14,
                  padding: "7px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <span style={{ fontFamily: KO, fontSize: 19 }}>{j.ch}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {session.contrast && (
        <section style={{ ...card, background: C.purpleTint, borderColor: C.purpleBorder }}>
          <div style={{ fontSize: 13.5, fontWeight: 800 }}>คู่ตัดกัน 1 คู่</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 11 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: KO, fontSize: 30 }}>{session.contrast[0].ch}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.purpleText }}>vs</span>
              <span style={{ fontFamily: KO, fontSize: 30 }}>{session.contrast[1].ch}</span>
            </div>
            <div style={{ flexGrow: 1, fontSize: 12, fontWeight: 700, color: "#6F5C8C" }}>
              คู่ที่ต้องแยกให้ออกวันนี้
            </div>
          </div>
        </section>
      )}

      <section style={card}>
        <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 10 }}>วันนี้ทำ 4 อย่าง</div>
        <div style={{ display: "grid", gap: 9 }}>
          {[
            "เห็นรูป ฟังเสียง ยังไม่ถูกถาม",
            "ฟังแล้วเลือก ตัวลวงคล้ายที่สุด",
            "ไม่มีตัวเลือก ต้องเขียนเอง",
            "อ่านพยางค์ที่ประกอบจากเซ็ต",
          ].map((text, i) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: C.pinkTint,
                  border: `2px solid ${C.border}`,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: "#B5658C",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div style={{ flexGrow: 1, fontSize: 12.5, fontWeight: 700 }}>{text}</div>
            </div>
          ))}
        </div>
      </section>

      <button type="button" className="btn-pink" style={primary} onClick={onStart}>
        เริ่มเลย
      </button>
    </div>
  );
}

/* ----------------------------------------------------------------- meet -- */

function MeetStep({
  items,
  onBack,
  onDone,
}: {
  items: Jamo[];
  onBack: () => void;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const j = items[i];

  useEffect(() => {
    const t = setTimeout(() => void speakKo(j.nameKo, "name"), 250);
    return () => clearTimeout(t);
  }, [j]);

  const positions = j.positions ?? [];

  return (
    <div style={{ animation: "pop 0.35s ease both" }}>
      <StepHeader step={1} sub={`ตัวใหม่ ${i + 1} จาก ${items.length}`} onBack={onBack} />

      <div style={{ display: "grid", gap: 12 }}>
        <section style={{ ...card, display: "grid", justifyItems: "center", gap: 12, borderRadius: 26 }}>
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: 28,
              background: C.pinkTint,
              border: `2px solid ${C.border}`,
              display: "grid",
              placeItems: "center",
              fontFamily: KO,
              fontSize: 96,
              lineHeight: 1,
            }}
          >
            {j.ch}
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: KO }}>{j.nameKo}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#7A6472", marginTop: 3 }}>
              {j.name.split(" ")[1] ?? head(j.thai)} · {j.strokeCount} ขีด
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => void speakKo(j.nameKo, "name")}
              style={{
                border: `2px solid ${C.borderStrong}`,
                background: C.pinkTint,
                color: C.pinkText,
                borderRadius: 18,
                padding: "12px 18px",
                fontSize: 13.5,
                fontWeight: 800,
                cursor: "pointer",
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <SpeakerGlyph size={18} />
              ชื่อตัวอักษร
            </button>
            <button
              type="button"
              onClick={() => void speakKo(j.demo, "sound")}
              style={{
                border: `2px solid ${C.blueBorderStrong}`,
                background: C.blueTint,
                color: C.blueInk,
                borderRadius: 18,
                padding: "12px 18px",
                fontSize: 13.5,
                fontWeight: 800,
                cursor: "pointer",
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <SpeakerGlyph size={18} />
              พยางค์ {j.demo}
            </button>
          </div>
        </section>

        <section style={{ ...card, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 14,
              background: C.purpleTint,
              border: `2px solid ${C.purpleBorder}`,
              display: "grid",
              placeItems: "center",
              fontFamily: KO,
              fontSize: 19,
              color: C.purpleText,
              flexShrink: 0,
            }}
          >
            {j.ch}
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800 }}>ตัวช่วยจำ</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#7A6472", lineHeight: 1.55, marginTop: 3 }}>
              {j.hint}
            </div>
          </div>
        </section>

        {positions.length > 0 && (
          <section style={card}>
            <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 9 }}>เสียงเปลี่ยนตามตำแหน่ง</div>
            <div style={{ display: "flex", gap: 8 }}>
              {positions.map((p) => (
                <div key={p.label} style={{ flex: 1, background: C.bg, borderRadius: 13, padding: "9px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: C.inkSoft }}>{p.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, marginTop: 3 }}>{p.thai}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            style={quiet}
            onClick={() => (i === 0 ? onBack() : setI(i - 1))}
          >
            ก่อนหน้า
          </button>
          <button
            type="button"
            className="btn-pink"
            style={primary}
            onClick={() => (i + 1 < items.length ? setI(i + 1) : onDone())}
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- pairs -- */

function PairStep({
  questions,
  onBack,
  onScore,
  onDone,
}: {
  questions: PairQuestion[];
  onBack: () => void;
  onScore: (ch: string, ok: boolean, picked?: string) => void;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [hits, setHits] = useState(0);
  const q = questions[i];

  const options = useMemo(() => shuffle([q.answer, q.other]), [q]);

  const play = useCallback(() => void speakKo(q.answer.nameKo, "name"), [q]);

  useEffect(() => {
    setPicked(null);
    const t = setTimeout(play, 250);
    return () => clearTimeout(t);
  }, [play]);

  const choose = (opt: Jamo) => {
    if (picked) return;
    const ok = opt.ch === q.answer.ch;
    setPicked(opt.ch);
    if (ok) setHits((n) => n + 1);
    onScore(q.answer.ch, ok, ok ? undefined : opt.ch);
  };

  return (
    <div style={{ animation: "pop 0.35s ease both" }}>
      <StepHeader step={2} sub={`ข้อ ${i + 1} จาก ${questions.length}`} onBack={onBack} />

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{
              background: C.surface,
              border: `2px solid ${C.border}`,
              borderRadius: 999,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {hits} ✓
          </div>
        </div>

        <section style={{ ...card, display: "grid", justifyItems: "center", gap: 14, borderRadius: 26 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#7A6472" }}>ฟังแล้วเลือกตัวที่ได้ยิน</div>
          <SoundButton onClick={play} />

          <div style={{ display: "flex", gap: 12, width: "100%" }}>
            {options.map((opt, idx) => {
              const isAnswer = opt.ch === q.answer.ch;
              const chosen = picked === opt.ch;
              const show = picked !== null;
              const bg = show && isAnswer ? C.blueTint : show && chosen ? C.badRed : C.surface;
              const bd = show && isAnswer ? C.blueBorderStrong : show && chosen ? C.badBorder : C.border;
              return (
                <button
                  key={opt.ch}
                  type="button"
                  onClick={() => choose(opt)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: `2px solid ${bd}`,
                    background: bg,
                    borderRadius: 22,
                    padding: "16px 10px",
                    cursor: picked ? "default" : "pointer",
                    display: "grid",
                    justifyItems: "center",
                    gap: 7,
                  }}
                >
                  <Glyph ch={opt.ch} size={44} tone={idx === 0 ? "pink" : "blue"} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{shortThai(opt)}</span>
                </button>
              );
            })}
          </div>
        </section>

        {picked && (
          <section style={{ ...card, borderColor: C.borderStrong }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 8 }}>จุดชี้ขาด</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#7A6472", lineHeight: 1.55 }}>
              {q.answer.ch} {q.answer.hint}
            </div>
          </section>
        )}

        <button
          type="button"
          className="btn-pink"
          style={{ ...primary, opacity: picked ? 1 : 0.45 }}
          disabled={!picked}
          onClick={() => (i + 1 < questions.length ? setI(i + 1) : onDone())}
        >
          {i + 1 < questions.length ? "ข้อถัดไป" : "ไปขั้นถัดไป"}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- trace -- */

function TraceStep({
  items,
  hasType,
  onBack,
  onScore,
  onDone,
}: {
  items: Jamo[];
  hasType: boolean;
  onBack: () => void;
  onScore: (ch: string, ok: boolean) => void;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [current, setCurrent] = useState<Point[] | null>(null);
  const [result, setResult] = useState<"ok" | "no" | null>(null);
  const [reveal, setReveal] = useState(false);
  const boxRef = useRef<SVGSVGElement | null>(null);
  const j = items[i];

  useEffect(() => {
    setStrokes([]);
    setCurrent(null);
    setResult(null);
    setReveal(false);
    const t = setTimeout(() => void speakKo(j.nameKo, "name"), 250);
    return () => clearTimeout(t);
  }, [j]);

  const at = (e: React.PointerEvent): Point => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box) return [0, 0];
    return [((e.clientX - box.left) / box.width) * 100, ((e.clientY - box.top) / box.height) * 100];
  };

  const clear = () => {
    setStrokes([]);
    setCurrent(null);
    setResult(null);
    setReveal(false);
  };

  const start = (e: React.PointerEvent) => {
    // A correct letter is finished. A wrong one is not: drawing on it again is
    // how a student retries, so the first touch wipes the failed attempt.
    if (result === "ok") return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* no capture for this pointer — the stroke still tracks fine */
    }
    if (result === "no") {
      setStrokes([]);
      setResult(null);
      setReveal(false);
    }
    setCurrent([at(e)]);
  };
  const move = (e: React.PointerEvent) => {
    if (!current) return;
    setCurrent([...current, at(e)]);
  };
  const end = () => {
    if (!current) return;
    if (current.length > 1) setStrokes((s) => [...s, current]);
    setCurrent(null);
  };

  const check = () => {
    if (result) {
      if (i + 1 < items.length) setI(i + 1);
      else onDone();
      return;
    }
    const r = traceScore(strokes, j);
    setResult(r.ok ? "ok" : "no");
    if (!r.ok) setReveal(true);
    onScore(j.ch, r.ok);
  };

  const path = (pts: Point[]) =>
    pts.map((p, n) => `${n ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

  return (
    <div style={{ animation: "pop 0.35s ease both" }}>
      <StepHeader step={3} sub={`ลากเส้น · ${i + 1} จาก ${items.length}`} onBack={onBack} />

      <div style={{ display: "grid", gap: 12 }}>
        <section style={{ ...card, display: "grid", justifyItems: "center", gap: 12, borderRadius: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%" }}>
            <SoundButton size={56} onClick={() => void speakKo(j.nameKo, "name")} />
            <div style={{ fontSize: 14, fontWeight: 800 }}>เขียนตัวที่ได้ยิน</div>
          </div>

          <div style={{ position: "relative", width: 196, height: 196 }}>
            <svg
              ref={boxRef}
            viewBox="0 0 100 100"
            width="196"
            height="196"
            role="img"
            aria-label="กล่องสำหรับลากเส้น"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            style={{
              borderRadius: 26,
              border: `2px dashed ${result === "ok" ? C.blueBorderStrong : C.borderStrong}`,
              background: result === "ok" ? C.blueTint : C.bgTop,
              touchAction: "none",
            }}
          >
            {reveal &&
              j.strokes.map((s) => (
                <path key={s.d} d={s.d} stroke={C.borderStrong} strokeWidth="6" strokeLinecap="round" fill="none" strokeDasharray="3 7" />
              ))}
            {strokes.map((s, n) => (
              <path key={n} d={path(s)} stroke={C.ink} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ))}
            {current && (
              <path d={path(current)} stroke={C.ink} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            )}
            </svg>

            <div
              style={{
                position: "absolute",
                left: 12,
                bottom: 10,
                background: C.surface,
                border: `1.5px solid ${C.border}`,
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 10.5,
                fontWeight: 800,
                color: C.inkSoft,
                pointerEvents: "none",
              }}
            >
              {result === "ok" ? "ถูกต้อง" : result === "no" ? "ยังไม่ตรง · ลากใหม่ได้เลย" : `ลากแล้ว ${strokes.length} เส้น`}
            </div>
          </div>

          <div style={{ display: "flex", gap: 9, width: "100%" }}>
            <button type="button" style={{ ...quiet, flex: 1 }} onClick={clear}>
              ลบแล้วเริ่มใหม่
            </button>
            <button type="button" style={{ ...quiet, flex: 1 }} onClick={() => setReveal(true)}>
              ขอดูเฉลย
            </button>
          </div>
        </section>

        <button
          type="button"
          className="btn-pink"
          style={primary}
          onClick={check}
        >
          {result ? (i + 1 < items.length ? "ตัวถัดไป" : hasType ? "ไปยกพิมพ์" : "ไปขั้นถัดไป") : "ตรวจคำตอบ"}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- type -- */

function TypeStep({
  items,
  onBack,
  onScore,
  onDone,
}: {
  items: Jamo[];
  onBack: () => void;
  onScore: (ch: string, ok: boolean, picked?: string) => void;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<"ok" | "no" | null>(null);
  const j = items[i];

  useEffect(() => {
    setTyped("");
    setResult(null);
    const t = setTimeout(() => void speakKo(j.nameKo, "name"), 250);
    return () => clearTimeout(t);
  }, [j]);

  const check = () => {
    if (result) {
      if (i + 1 < items.length) setI(i + 1);
      else onDone();
      return;
    }
    if (!typed) return;
    const ok = typed === j.ch;
    setResult(ok ? "ok" : "no");
    onScore(j.ch, ok, ok ? undefined : typed);
  };

  const slotBg = result === "ok" ? C.blueTint : result === "no" ? C.badRed : C.pinkTint;
  const slotBd = result === "ok" ? C.blueBorderStrong : result === "no" ? C.badBorder : C.border;

  return (
    <div style={{ animation: "pop 0.35s ease both" }}>
      <StepHeader step={3} sub={`พิมพ์ · ${i + 1} จาก ${items.length}`} onBack={onBack} />

      <div style={{ display: "grid", gap: 11 }}>
        <section style={{ ...card, display: "flex", alignItems: "center", gap: 14, borderRadius: 24 }}>
          <SoundButton size={60} onClick={() => void speakKo(j.nameKo, "name")} />
          <div style={{ fontSize: 14.5, fontWeight: 800 }}>พิมพ์ตัวที่ได้ยิน</div>
        </section>

        <section style={{ ...card, borderColor: C.borderStrong, display: "grid", justifyItems: "center", gap: 9, borderRadius: 24 }}>
          <label htmlFor="typed" style={{ fontSize: 11.5, fontWeight: 800, color: C.inkSoft }}>
            ช่องคำตอบ
          </label>
          <input
            id="typed"
            type="text"
            readOnly
            value={result === "no" ? `${typed} → ${j.ch}` : typed}
            style={{
              width: result === "no" ? 190 : 118,
              height: 92,
              boxSizing: "border-box",
              textAlign: "center",
              fontFamily: KO,
              fontSize: result === "no" ? 32 : 52,
              color: C.ink,
              background: slotBg,
              border: `2px solid ${slotBd}`,
              borderRadius: 22,
            }}
          />
        </section>

        <div style={{ display: "grid", gap: 5 }}>
          {KEY_ROWS.map((row, n) => (
            <div key={n} style={{ display: "flex", gap: 4, padding: n === 1 ? "0 16px" : n === 2 ? "0 40px" : 0 }}>
              {n === 2 && (
                <button
                  type="button"
                  onClick={() => setTyped("")}
                  style={{
                    flex: 1.4,
                    minHeight: 46,
                    border: `1.5px solid ${C.border}`,
                    background: C.pinkTrack,
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 800,
                    color: C.inkSoft,
                    cursor: "pointer",
                  }}
                >
                  ลบ
                </button>
              )}
              {row.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => !result && setTyped(k)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 46,
                    border: `1.5px solid ${typed === k ? C.borderStrong : C.border}`,
                    background: typed === k ? C.pinkTint : C.surface,
                    borderRadius: 10,
                    fontFamily: KO,
                    fontSize: 17,
                    color: C.ink,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn-pink"
          style={{ ...primary, opacity: typed || result ? 1 : 0.45 }}
          disabled={!typed && !result}
          onClick={check}
        >
          {result ? (i + 1 < items.length ? "ตัวถัดไป" : "ไปขั้นถัดไป") : "ตรวจคำตอบ"}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- words -- */

function WordStep({
  questions,
  onBack,
  onScore,
  onDone,
}: {
  questions: WordQuestion[];
  onBack: () => void;
  onScore: (ch: string, ok: boolean, picked?: string) => void;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const q = questions[i];

  const play = useCallback(() => void speakKo(q.syllable, "syl"), [q]);

  // The syllable plays itself once on arrival, the way the other steps do.
  useEffect(() => {
    setPicked(null);
    const t = setTimeout(play, 250);
    return () => clearTimeout(t);
  }, [play]);

  const choose = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    onScore(q.lead.ch, opt === q.right);
  };

  const why = VOICING[q.lead.ch]?.[0]?.explain ?? q.lead.position;

  return (
    <div style={{ animation: "pop 0.35s ease both" }}>
      <StepHeader step={4} sub={`พยางค์ ${i + 1} จาก ${questions.length}`} onBack={onBack} />

      <div style={{ display: "grid", gap: 12 }}>
        <section style={{ ...card, display: "grid", justifyItems: "center", gap: 13, borderRadius: 26 }}>
          <div style={{ fontFamily: KO, fontSize: 66, lineHeight: 1.1 }}>{q.syllable}</div>
          <div style={{ fontFamily: KO, fontSize: 15, color: C.inkSoft }}>
            {q.lead.ch} + {q.medial.ch}
          </div>
          <SoundButton size={72} onClick={play} label="ฟังพยางค์นี้อีกครั้ง" />
        </section>

        <div style={{ fontSize: 13.5, fontWeight: 800, paddingLeft: 4 }}>อ่านว่าอะไร</div>

        <div style={{ display: "grid", gap: 9 }}>
          {q.options.map((opt) => {
            const isAnswer = opt === q.right;
            const chosen = picked === opt;
            const show = picked !== null;
            const bg = show && isAnswer ? C.blueTint : show && chosen ? C.badRed : C.surface;
            const bd = show && isAnswer ? C.blueBorderStrong : show && chosen ? C.badBorder : C.border;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => choose(opt)}
                style={{
                  border: `2px solid ${bd}`,
                  background: bg,
                  borderRadius: 18,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: picked ? "default" : "pointer",
                  textAlign: "left",
                  minHeight: 44,
                }}
              >
                <span style={{ flexGrow: 1, fontSize: 17, fontWeight: 800, color: C.ink }}>{opt}</span>
                {show && isAnswer && (
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: C.blueInk }}>ถูกต้อง</span>
                )}
              </button>
            );
          })}
        </div>

        {picked && picked !== q.right && (
          <section style={{ ...card, borderColor: C.borderStrong }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 5 }}>ทำไมไม่ใช่ {picked}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#7A6472", lineHeight: 1.55 }}>{why}</div>
          </section>
        )}

        <button
          type="button"
          className="btn-pink"
          style={{ ...primary, opacity: picked ? 1 : 0.45 }}
          disabled={!picked}
          onClick={() => (i + 1 < questions.length ? setI(i + 1) : onDone())}
        >
          {i + 1 < questions.length ? "พยางค์ถัดไป" : "จบวันนี้"}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- done -- */

function DoneStep({
  day,
  session,
  right,
  asked,
  onClose,
}: {
  day: PathDay;
  session: DaySession;
  right: number;
  asked: number;
  onClose: () => void;
}) {
  const next = day.day + 1;
  return (
    <div style={{ animation: "pop 0.35s ease both", display: "grid", gap: 12 }}>
      <div style={{ textAlign: "center", padding: "18px 0 4px" }}>
        <div style={eyebrow}>เซ็ตที่ {day.day} · จบแล้ว</div>
        <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: "-0.5px", marginTop: 4 }}>
          ถูก {right} จาก {asked}
        </div>
      </div>

      <section style={card}>
        <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 11 }}>ตัวใหม่ของวันนี้</div>
        <div style={{ display: "grid", gap: 9 }}>
          {session.fresh.map((j) => (
            <div key={j.ch} style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ fontFamily: KO, fontSize: 25, width: 34, textAlign: "center" }}>{j.ch}</span>
              <div style={{ flexGrow: 1, fontSize: 12, fontWeight: 700, color: "#7A6472" }}>{shortThai(j)}</div>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: C.blueInk,
                  background: C.blueTint,
                  borderRadius: 999,
                  padding: "3px 9px",
                }}
              >
                กล่อง 2
              </span>
            </div>
          ))}
        </div>
      </section>

      {next <= 14 && (
        <section style={{ ...card, background: C.blueTint, borderColor: C.blueBorder }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.blueInk }}>พรุ่งนี้ · เซ็ตที่ {next}</div>
        </section>
      )}

      <button type="button" className="btn-pink" style={primary} onClick={onClose}>
        กลับไปเส้นทาง
      </button>
    </div>
  );
}
