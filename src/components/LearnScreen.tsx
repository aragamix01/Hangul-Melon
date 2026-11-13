"use client";

/**
 * เรียนรู้ — the path.
 *
 * One set a day for fourteen days, which is the whole alphabet. The student
 * never picks what to study: `data/path` fixes which letters arrive when,
 * `lib/srs` decides what comes back, and `lib/similarity` decides what each
 * letter is drilled against.
 */

import { useMemo, useState } from "react";
import { PATH_DAYS, type PathDay } from "@/data/path";
import type { Progress } from "@/lib/progress";
import { useSrs } from "@/lib/srs";
import { buildSession, DayFlow, type DaySession } from "./DayFlow";
import { card, eyebrow, primary, quiet } from "./learnUi";
import { C, KO } from "./theme";

/** A numbered stop on the path, with the line that joins it to its neighbours. */
function Stop({
  children,
  tone,
  first,
  last,
}: {
  children: React.ReactNode;
  tone: "done" | "today" | "later";
  first?: boolean;
  last?: boolean;
}) {
  const bg = tone === "done" ? C.blue : tone === "today" ? C.pink : C.pinkTrack;
  const fg = tone === "later" ? C.inkFaintest : C.surface;
  const line = tone === "done" ? C.blueBorder : tone === "today" ? C.borderStrong : C.border;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", alignSelf: "stretch" }}>
      {!first && <div style={{ width: 3, height: 10, background: line }} />}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          background: bg,
          color: fg,
          display: "grid",
          placeItems: "center",
          fontSize: tone === "done" ? 15 : 13,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {children}
      </div>
      {!last && <div style={{ width: 3, flexGrow: 1, minHeight: 10, background: line }} />}
    </div>
  );
}

export function LearnScreen({ progress }: { progress: Progress }) {
  const { srs, ready, note, gradeDay, finishDay, reset } = useSrs();
  const [confirming, setConfirming] = useState(false);

  /**
   * The open day's exercises are frozen when it starts. Rebuilding them from
   * the live record would reshuffle the question under the student every time
   * an answer is recorded.
   */
  const [open, setOpen] = useState<{ day: PathDay; session: DaySession } | null>(null);

  const today = useMemo(
    () => PATH_DAYS.find((d) => !srs.days[String(d.day)]) ?? PATH_DAYS[PATH_DAYS.length - 1],
    [srs.days],
  );

  const session = useMemo(() => buildSession(today, srs), [today, srs]);

  const done = PATH_DAYS.filter((d) => srs.days[String(d.day)]);
  const tomorrow = PATH_DAYS.find((d) => d.day === today.day + 1);

  if (open) {
    return (
      <DayFlow
        day={open.day}
        session={open.session}
        replay={!!srs.days[String(open.day.day)]}
        onNote={note}
        onGradeDay={gradeDay}
        onFinish={(right, total) => finishDay(open.day.day, right, total)}
        onExit={() => setOpen(null)}
      />
    );
  }

  return (
    <div style={{ animation: "pop 0.35s ease both", display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={eyebrow}>LEARNING PATH</div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", marginTop: 2 }}>
            เส้นทางวันต่อวัน
          </div>
        </div>
        <div
          style={{
            background: C.surface,
            border: `2px solid ${C.border}`,
            borderRadius: 999,
            padding: "7px 13px",
            fontSize: 13,
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          {progress.streak || 1} วัน
        </div>
      </div>

      {done.map((d, n) => {
        const r = srs.days[String(d.day)];
        return (
          <div key={d.day} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Stop first={n === 0} tone="done">
              ✓
            </Stop>
            {/* A finished day stays open: its set can be run again any time,
                and a better score replaces the one on the row. */}
            <button
              type="button"
              onClick={() => setOpen({ day: d, session: buildSession(d, srs) })}
              style={{
                flexGrow: 1,
                background: C.surface,
                border: `2px solid ${C.border}`,
                borderRadius: 18,
                padding: "11px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                textAlign: "left",
                font: "inherit",
                color: C.ink,
              }}
            >
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800 }}>
                  วันที่ {d.day} · {d.title}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: C.inkSoft, marginTop: 2 }}>
                  ถูก {r.right} / {r.total} · แตะเพื่อเล่นซ้ำ
                </div>
              </div>
              <div style={{ fontFamily: KO, fontSize: 17, color: C.blueText, letterSpacing: 3 }}>
                {d.chars.join("")}
              </div>
            </button>
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 12 }}>
        <Stop first={done.length === 0} tone="today">
          {today.day}
        </Stop>

        <div
          style={{
            flexGrow: 1,
            ...card,
            borderColor: C.borderStrong,
            borderRadius: 22,
            boxShadow: "0 8px 22px rgba(220, 133, 168, 0.16)",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>วันนี้ · เซ็ตที่ {today.day}</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.pinkText }}>~8 นาที</div>
          </div>

          <div style={{ display: "flex", gap: 7, marginTop: 11 }}>
            {today.chars.length === 0 && (
              <div
                style={{
                  flex: 1,
                  background: C.purpleTint,
                  border: `2px solid ${C.purpleBorder}`,
                  borderRadius: 14,
                  padding: "9px 10px",
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: "#6F5C8C",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                ไม่มีตัวใหม่ · ทบทวนล้วน
              </div>
            )}
            {today.chars.map((ch) => (
              <div
                key={ch}
                style={{
                  flex: 1,
                  background: C.pinkTint,
                  border: `2px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "9px 6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontFamily: KO, fontSize: 25, lineHeight: 1.1 }}>{ch}</div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: C.inkSoft, marginTop: 3 }}>ใหม่</div>
              </div>
            ))}
            <div
              style={{
                flex: 1,
                background: C.blueTint,
                border: `2px solid ${C.blueBorder}`,
                borderRadius: 14,
                padding: "9px 6px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 20, lineHeight: 1.35, fontWeight: 800, color: C.blueInk }}>
                {ready ? session.review.length : 0}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: C.blueInk, marginTop: 3 }}>ทบทวน</div>
            </div>
          </div>

          {today.contrast && (
            <div
              style={{
                marginTop: 11,
                background: C.purpleTint,
                border: `2px solid ${C.purpleBorder}`,
                borderRadius: 14,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ fontFamily: KO, fontSize: 20, whiteSpace: "nowrap" }}>
                {today.contrast[0]} vs {today.contrast[1]}
              </div>
              <div style={{ flexGrow: 1, fontSize: 12, fontWeight: 700, color: "#6F5C8C" }}>
                คู่ที่ต้องแยกให้ออกวันนี้
              </div>
            </div>
          )}

          <div style={{ marginTop: 13, display: "flex", gap: 5 }}>
            {[0, 1, 2, 3].map((n) => (
              <div
                key={n}
                style={{ flex: 1, height: 7, borderRadius: 999, background: n === 0 ? C.pink : C.pinkTrack }}
              />
            ))}
          </div>

          <button
            type="button"
            className="btn-pink"
            style={{ ...primary, marginTop: 14 }}
            onClick={() => setOpen({ day: today, session: buildSession(today, srs) })}
          >
            เปิดเซ็ตวันนี้
          </button>
        </div>
      </div>

      {tomorrow && (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Stop last tone="later">
            {tomorrow.day}
          </Stop>
          <div
            style={{
              flexGrow: 1,
              background: C.surface,
              border: `2px dashed ${C.border}`,
              borderRadius: 18,
              padding: "11px 14px",
            }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.inkSoft }}>
              พรุ่งนี้ · {tomorrow.chars.join(" ")}
            </div>
          </div>
        </div>
      )}

      {/* Wiping fourteen days of record cannot be undone, so the button asks
          once before it does it. */}
      {confirming ? (
        <section style={{ ...card, borderColor: C.badBorder, background: C.badRed }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
            ลบความคืบหน้าทั้งหมดของเส้นทาง
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#7A6472", lineHeight: 1.55 }}>
            กลับไปเริ่มวันที่ 1 · ผลของทุกวัน กล่องความจำ และรายการคู่ที่สับสนจะหายไป
            กู้คืนไม่ได้ · บัตรคำกับเกมไม่ถูกแตะ
          </div>
          <div style={{ display: "flex", gap: 9, marginTop: 13 }}>
            <button
              type="button"
              style={{ ...quiet, flex: 1 }}
              onClick={() => setConfirming(false)}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                border: `2px solid ${C.badBorder}`,
                background: C.surface,
                color: "#9E5A5A",
                borderRadius: 16,
                padding: "12px 16px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                minHeight: 44,
              }}
              onClick={() => {
                reset();
                setConfirming(false);
              }}
            >
              ลบแล้วเริ่มใหม่
            </button>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          style={{
            border: "none",
            background: "transparent",
            color: C.inkFaintest,
            fontSize: 12,
            fontWeight: 700,
            padding: "6px 0 2px",
            cursor: "pointer",
          }}
        >
          เริ่มเส้นทางใหม่ตั้งแต่วันที่ 1
        </button>
      )}
    </div>
  );
}
