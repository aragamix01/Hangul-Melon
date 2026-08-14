/**
 * Stroke-by-stroke geometry for all 40 jamo, drawn in a 100×100 box.
 *
 * Counts follow the course PDF (ภาษาเกาหลีพื้นฐาน), which uses the standard
 * Korean stroke order. The important cases are the ones where a corner does
 * *not* mean a new stroke: ㄱ ㄴ are one stroke each, ㄷ is two, ㄹ is three —
 * the pen turns without lifting.
 *
 * Paths use only M / L / A with absolute coordinates so a path's own
 * getPointAtLength() is directly usable for placing the stroke-number badge —
 * no group transforms to compensate for.
 *
 * This file is the single source of truth for stroke count, order and labels;
 * hangul.ts reads it rather than keeping its own copy.
 */

export interface Stroke {
  /** SVG path data in the 100×100 box */
  d: string;
  /** Thai description shown next to the stroke number */
  label: string;
}

/** A closed circle, as two arcs — used for ㅇ and the bowl of ㅎ. */
const circle = (cx: number, cy: number, r: number) =>
  `M ${cx} ${cy - r} A ${r} ${r} 0 1 0 ${cx} ${cy + r} A ${r} ${r} 0 1 0 ${cx} ${cy - r}`;

export const STROKES: Record<string, Stroke[]> = {
  // ---------------- พยัญชนะเดี่ยว 14 ----------------
  "ㄱ": [{ d: "M 22 26 L 78 26 L 66 80", label: "ลากไปขวา แล้วหักลงล่าง ไม่ยกปากกา" }],
  "ㄴ": [{ d: "M 28 20 L 28 74 L 82 74", label: "ลากลงล่าง แล้วหักไปขวา ไม่ยกปากกา" }],
  "ㄷ": [
    { d: "M 24 24 L 78 24", label: "เส้นบน" },
    { d: "M 24 24 L 24 76 L 78 76", label: "ลงซ้าย แล้วหักไปขวา" },
  ],
  "ㄹ": [
    { d: "M 24 22 L 74 22 L 74 48", label: "เส้นบน แล้วหักลง" },
    { d: "M 74 48 L 26 48 L 26 74", label: "เส้นกลางไปซ้าย แล้วหักลง" },
    { d: "M 26 74 L 78 74", label: "เส้นล่าง" },
  ],
  "ㅁ": [
    { d: "M 26 24 L 26 76", label: "เส้นซ้ายลง" },
    { d: "M 26 24 L 76 24 L 76 76", label: "เส้นบน แล้วหักลงขวา" },
    { d: "M 26 76 L 76 76", label: "เส้นล่าง" },
  ],
  "ㅂ": [
    { d: "M 26 20 L 26 78", label: "เส้นซ้าย" },
    { d: "M 74 20 L 74 78", label: "เส้นขวา" },
    { d: "M 26 50 L 74 50", label: "เส้นกลาง" },
    { d: "M 26 78 L 74 78", label: "เส้นล่าง" },
  ],
  "ㅅ": [
    { d: "M 52 22 L 22 80", label: "เส้นเฉียงซ้าย" },
    { d: "M 44 44 L 78 80", label: "เส้นเฉียงขวา" },
  ],
  "ㅇ": [{ d: circle(50, 50, 28), label: "วงกลมทวนเข็มนาฬิกา" }],
  "ㅈ": [
    { d: "M 22 28 L 78 28", label: "เส้นบน" },
    { d: "M 22 80 L 50 30 L 78 80", label: "เฉียงซ้ายขึ้นไปยอด แล้วลงเฉียงขวา" },
  ],
  "ㅊ": [
    { d: "M 50 12 L 50 26", label: "ขีดบน" },
    { d: "M 22 36 L 78 36", label: "เส้นขวาง" },
    { d: "M 22 84 L 50 38 L 78 84", label: "เฉียงซ้ายขึ้นไปยอด แล้วลงเฉียงขวา" },
  ],
  "ㅋ": [
    { d: "M 22 24 L 78 24 L 68 80", label: "ㄱ ในเส้นเดียว" },
    { d: "M 26 52 L 73 52", label: "ขีดกลาง (ลมที่เพิ่มเข้ามา)" },
  ],
  "ㅌ": [
    { d: "M 24 22 L 78 22", label: "เส้นบน" },
    { d: "M 24 22 L 24 78 L 78 78", label: "ลงซ้าย แล้วหักไปขวา" },
    { d: "M 26 50 L 76 50", label: "ขีดกลาง (ลมที่เพิ่มเข้ามา)" },
  ],
  "ㅍ": [
    { d: "M 18 30 L 82 30", label: "เส้นบน" },
    { d: "M 36 30 L 36 72", label: "ขาซ้าย" },
    { d: "M 64 30 L 64 72", label: "ขาขวา" },
    { d: "M 18 72 L 82 72", label: "เส้นล่าง" },
  ],
  "ㅎ": [
    { d: "M 50 10 L 50 24", label: "ขีดบน" },
    { d: "M 24 34 L 76 34", label: "เส้นขวาง" },
    { d: circle(50, 64, 20), label: "วงกลม" },
  ],

  // ---------------- พยัญชนะคู่ 5 ----------------
  // The two halves of a doubled consonant need a gap wider than the round caps
  // themselves, or the top bars run together into one line.
  "ㄲ": [
    { d: "M 10 28 L 42 28 L 36 78", label: "ㄱ ตัวแรก" },
    { d: "M 58 28 L 90 28 L 84 78", label: "ㄱ ตัวที่สอง" },
  ],
  "ㄸ": [
    { d: "M 10 26 L 42 26", label: "ㄷ ตัวแรก — เส้นบน" },
    { d: "M 10 26 L 10 76 L 42 76", label: "ㄷ ตัวแรก — ลงซ้ายแล้วหักขวา" },
    { d: "M 58 26 L 90 26", label: "ㄷ ตัวที่สอง — เส้นบน" },
    { d: "M 58 26 L 58 76 L 90 76", label: "ㄷ ตัวที่สอง — ลงซ้ายแล้วหักขวา" },
  ],
  "ㅃ": [
    { d: "M 12 22 L 12 78", label: "ㅂ ตัวแรก — เส้นซ้าย" },
    { d: "M 42 22 L 42 78", label: "ㅂ ตัวแรก — เส้นขวา" },
    { d: "M 12 50 L 42 50", label: "ㅂ ตัวแรก — เส้นกลาง" },
    { d: "M 12 78 L 42 78", label: "ㅂ ตัวแรก — เส้นล่าง" },
    { d: "M 58 22 L 58 78", label: "ㅂ ตัวที่สอง — เส้นซ้าย" },
    { d: "M 88 22 L 88 78", label: "ㅂ ตัวที่สอง — เส้นขวา" },
    { d: "M 58 50 L 88 50", label: "ㅂ ตัวที่สอง — เส้นกลาง" },
    { d: "M 58 78 L 88 78", label: "ㅂ ตัวที่สอง — เส้นล่าง" },
  ],
  "ㅆ": [
    { d: "M 26 24 L 6 80", label: "ㅅ ตัวแรก — เฉียงซ้าย" },
    { d: "M 20 44 L 42 80", label: "ㅅ ตัวแรก — เฉียงขวา" },
    { d: "M 74 24 L 54 80", label: "ㅅ ตัวที่สอง — เฉียงซ้าย" },
    { d: "M 68 44 L 90 80", label: "ㅅ ตัวที่สอง — เฉียงขวา" },
  ],
  "ㅉ": [
    { d: "M 6 28 L 42 28", label: "ㅈ ตัวแรก — เส้นบน" },
    { d: "M 8 80 L 24 32 L 40 80", label: "ㅈ ตัวแรก — เฉียงสองข้าง" },
    { d: "M 58 28 L 92 28", label: "ㅈ ตัวที่สอง — เส้นบน" },
    { d: "M 60 80 L 75 32 L 90 80", label: "ㅈ ตัวที่สอง — เฉียงสองข้าง" },
  ],

  // ---------------- สระเดี่ยว 10 ----------------
  "ㅏ": [
    { d: "M 54 12 L 54 88", label: "เส้นตั้ง" },
    { d: "M 54 50 L 86 50", label: "ขีดขวา" },
  ],
  "ㅑ": [
    { d: "M 54 12 L 54 88", label: "เส้นตั้ง" },
    { d: "M 54 36 L 86 36", label: "ขีดบน" },
    { d: "M 54 64 L 86 64", label: "ขีดล่าง" },
  ],
  "ㅓ": [
    { d: "M 22 50 L 54 50", label: "ขีดซ้าย" },
    { d: "M 54 12 L 54 88", label: "เส้นตั้ง" },
  ],
  "ㅕ": [
    { d: "M 22 36 L 54 36", label: "ขีดบน" },
    { d: "M 22 64 L 54 64", label: "ขีดล่าง" },
    { d: "M 54 12 L 54 88", label: "เส้นตั้ง" },
  ],
  "ㅗ": [
    { d: "M 50 20 L 50 56", label: "ขีดตั้ง" },
    { d: "M 14 56 L 86 56", label: "เส้นนอน" },
  ],
  "ㅛ": [
    { d: "M 34 20 L 34 56", label: "ขีดซ้าย" },
    { d: "M 66 20 L 66 56", label: "ขีดขวา" },
    { d: "M 14 56 L 86 56", label: "เส้นนอน" },
  ],
  "ㅜ": [
    { d: "M 14 44 L 86 44", label: "เส้นนอน" },
    { d: "M 50 44 L 50 80", label: "ขีดลง" },
  ],
  "ㅠ": [
    { d: "M 14 44 L 86 44", label: "เส้นนอน" },
    { d: "M 34 44 L 34 80", label: "ขีดซ้าย" },
    { d: "M 66 44 L 66 80", label: "ขีดขวา" },
  ],
  "ㅡ": [{ d: "M 12 50 L 88 50", label: "เส้นนอนเส้นเดียว" }],
  "ㅣ": [{ d: "M 50 12 L 50 88", label: "เส้นตั้งเส้นเดียว" }],

  // ---------------- สระประสม 11 ----------------
  // The two verticals in ㅔ ㅖ ㅐ ㅒ sit 24 apart — far enough to read as two
  // strokes, close enough to look like one letter rather than two.
  "ㅔ": [
    { d: "M 28 50 L 48 50", label: "ขีดซ้าย" },
    { d: "M 48 12 L 48 88", label: "เส้นตั้ง" },
    { d: "M 72 12 L 72 88", label: "เส้นตั้งขวา (ㅣ)" },
  ],
  "ㅖ": [
    { d: "M 28 36 L 48 36", label: "ขีดบน" },
    { d: "M 28 64 L 48 64", label: "ขีดล่าง" },
    { d: "M 48 12 L 48 88", label: "เส้นตั้ง" },
    { d: "M 72 12 L 72 88", label: "เส้นตั้งขวา (ㅣ)" },
  ],
  "ㅐ": [
    { d: "M 38 12 L 38 88", label: "เส้นตั้ง" },
    { d: "M 38 50 L 54 50", label: "ขีดขวา" },
    { d: "M 62 12 L 62 88", label: "เส้นตั้งขวา (ㅣ)" },
  ],
  "ㅒ": [
    { d: "M 38 12 L 38 88", label: "เส้นตั้ง" },
    { d: "M 38 36 L 54 36", label: "ขีดบน" },
    { d: "M 38 64 L 54 64", label: "ขีดล่าง" },
    { d: "M 62 12 L 62 88", label: "เส้นตั้งขวา (ㅣ)" },
  ],
  // ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ are one letter, not two sitting side by side: the ㅗ/ㅜ/ㅡ
  // crossbar runs right until it meets the vertical. Drawing the two halves as
  // separate floating shapes doesn't match the printed glyph.
  //
  // A left-pointing ㅓ/ㅔ tick therefore shares the vertical with that crossbar,
  // and has to sit well above it — around y 38 against y 58 — or the two
  // horizontals fuse into a single bar at 9 units wide.
  // Coordinates measured off the rendered Gowun Dodum glyph rather than
  // guessed. Three things that are easy to get backwards:
  //
  //   - a ㅓ/ㅔ tick sits BELOW the ㅜ crossbar, not above it
  //   - the crossbar stops short of the vertical; they do not join
  //   - ㅗ-compounds carry the bar low (y 64) while ㅜ-compounds carry it at
  //     mid-height (y 50), because the ㅗ stem rises above its bar and the ㅜ
  //     stem hangs below its own
  "ㅘ": [
    { d: "M 34 48 L 34 67", label: "ㅗ — ขีดตั้ง" },
    { d: "M 6 67 L 58 67", label: "ㅗ — เส้นนอน" },
    { d: "M 74 10 L 74 90", label: "ㅏ — เส้นตั้ง" },
    { d: "M 74 49 L 94 49", label: "ㅏ — ขีดขวา" },
  ],
  "ㅙ": [
    { d: "M 32 44 L 32 64", label: "ㅗ — ขีดตั้ง" },
    { d: "M 6 64 L 54 64", label: "ㅗ — เส้นนอน" },
    { d: "M 69 10 L 69 90", label: "ㅐ — เส้นตั้ง" },
    { d: "M 69 44 L 90 44", label: "ㅐ — ขีดขวาเชื่อมสองเส้น" },
    { d: "M 90 10 L 90 90", label: "ㅐ — เส้นตั้งขวา" },
  ],
  "ㅚ": [
    { d: "M 39 46 L 39 64", label: "ㅗ — ขีดตั้ง" },
    { d: "M 6 64 L 74 64", label: "ㅗ — เส้นนอน" },
    { d: "M 89 10 L 89 90", label: "ㅣ — เส้นตั้ง" },
  ],
  "ㅝ": [
    { d: "M 6 53 L 74 53", label: "ㅜ — เส้นนอน" },
    { d: "M 35 53 L 35 90", label: "ㅜ — ขีดลง" },
    { d: "M 58 67 L 90 67", label: "ㅓ — ขีดซ้าย (อยู่ใต้เส้นนอนของ ㅜ)" },
    { d: "M 90 10 L 90 90", label: "ㅓ — เส้นตั้ง" },
  ],
  "ㅞ": [
    { d: "M 6 50 L 55 50", label: "ㅜ — เส้นนอน" },
    { d: "M 29 50 L 29 90", label: "ㅜ — ขีดลง" },
    { d: "M 47 64 L 70 64", label: "ㅔ — ขีดซ้าย (อยู่ใต้เส้นนอนของ ㅜ)" },
    { d: "M 70 10 L 70 90", label: "ㅔ — เส้นตั้ง" },
    { d: "M 90 10 L 90 90", label: "ㅔ — เส้นตั้งขวา" },
  ],
  "ㅟ": [
    { d: "M 6 52 L 75 52", label: "ㅜ — เส้นนอน" },
    { d: "M 39 52 L 39 90", label: "ㅜ — ขีดลง" },
    { d: "M 90 10 L 90 90", label: "ㅣ — เส้นตั้ง" },
  ],
  "ㅢ": [
    { d: "M 6 64 L 74 64", label: "ㅡ — เส้นนอน" },
    { d: "M 89 10 L 89 90", label: "ㅣ — เส้นตั้ง" },
  ],
};
