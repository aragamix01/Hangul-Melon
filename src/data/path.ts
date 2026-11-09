/**
 * The 14-day path: all 40 letters, three a day, easy shapes first.
 *
 * Two constraints shape the order, and they pull against each other:
 *
 *   - A day must be *readable*. Every day from the first carries at least one
 *     vowel or one consonant that pairs with what came before, so the student
 *     can build a real syllable the same evening rather than collecting
 *     letters for a week.
 *   - Letters that look or sound alike must not arrive together. Meeting ㅏ and
 *     ㅑ for the first time on the same day is how they end up permanently
 *     swapped. Instead the second one lands a day or more later and is
 *     *deliberately* contrasted with the first, which by then is established.
 *
 * Hence `contrast`: the pair that day drills head to head, always an older
 * letter against the new one that threatens it. Day 1 has none — nothing is
 * established yet.
 *
 * The derivation groups (add a stroke = add a puff of air; double a letter =
 * tense it) are kept intact and simply arrive late: ㅋ ㅌ ㅍ ㅊ in days 8–10,
 * the five doubles in days 10–12, the compound vowels last.
 */

export interface PathDay {
  day: number;
  /** New letters introduced this day, in teaching order */
  chars: string[];
  /** [established, new] — the pair this day drills head to head */
  contrast?: [string, string];
  title: string;
}

export const PATH_DAYS: PathDay[] = [
  { day: 1, chars: ["ㅇ", "ㅏ", "ㅗ"], title: "เริ่มต้น · อ่านได้เลย" },
  { day: 2, chars: ["ㅁ", "ㅣ", "ㅜ"], contrast: ["ㅗ", "ㅜ"], title: "สระตั้งกับสระนอน" },
  { day: 3, chars: ["ㄴ", "ㅓ", "ㅡ"], contrast: ["ㅏ", "ㅓ"], title: "ขีดชี้ออก ขีดชี้เข้า" },
  { day: 4, chars: ["ㅅ", "ㅑ", "ㅛ"], contrast: ["ㅏ", "ㅑ"], title: "ขีดสองอัน = เสียง ย" },
  { day: 5, chars: ["ㄱ", "ㅕ", "ㅠ"], contrast: ["ㅓ", "ㅕ"], title: "เสียง ย ครบชุด" },
  { day: 6, chars: ["ㄷ", "ㅂ", "ㅐ"], contrast: ["ㅁ", "ㅂ"], title: "ปากปิดกับปากเปิด" },
  { day: 7, chars: ["ㄹ", "ㅈ", "ㅔ"], contrast: ["ㄷ", "ㄹ"], title: "ลิ้นแตะกับลิ้นสะบัด" },
  { day: 8, chars: ["ㅎ", "ㅋ", "ㅒ"], contrast: ["ㄱ", "ㅋ"], title: "เติมขีด = พ่นลม" },
  { day: 9, chars: ["ㅌ", "ㅊ", "ㅖ"], contrast: ["ㅈ", "ㅊ"], title: "พ่นลมครบชุด" },
  { day: 10, chars: ["ㅍ", "ㄲ", "ㅘ"], contrast: ["ㅂ", "ㅍ"], title: "ตัวคู่ตัวแรก" },
  { day: 11, chars: ["ㄸ", "ㅃ", "ㅝ"], contrast: ["ㄷ", "ㄸ"], title: "เกร็งคอแล้วดีด" },
  { day: 12, chars: ["ㅆ", "ㅉ", "ㅚ"], contrast: ["ㅅ", "ㅆ"], title: "ตัวคู่ครบ 5 ตัว" },
  { day: 13, chars: ["ㅟ", "ㅢ", "ㅙ"], contrast: ["ㅗ", "ㅚ"], title: "สระประสมเสียง ว" },
  { day: 14, chars: ["ㅞ"], contrast: ["ㅙ", "ㅞ"], title: "ปิดท้าย · ทบทวนรวม" },
];

/** Which day a letter is introduced on. */
export const DAY_OF: Record<string, number> = {};
for (const d of PATH_DAYS) for (const ch of d.chars) DAY_OF[ch] = d.day;

/**
 * Thai spelling of a consonant + vowel syllable.
 *
 * Only the eight vowels whose Thai shape is a clean template are listed. A Thai
 * syllable places its vowel around the consonant rather than after it, so each
 * one needs its own slot — ㅗ wraps โ in front, ㅐ wraps แ in front, ㅏ hangs า
 * behind. The ย-vowels (ㅑ ㅕ ㅛ ㅠ) and the compound vowels have no single
 * agreed Thai spelling, so the reading exercise simply does not use them.
 */
const THAI_SYLLABLE: Record<string, (c: string) => string> = {
  "ㅏ": (c) => `${c}า`,
  "ㅓ": (c) => `${c}อ`,
  "ㅗ": (c) => `โ${c}`,
  "ㅜ": (c) => `${c}ู`,
  "ㅡ": (c) => `${c}ือ`,
  "ㅣ": (c) => `${c}ี`,
  "ㅐ": (c) => `แ${c}`,
  "ㅔ": (c) => `เ${c}`,
};

export const READABLE_VOWELS = Object.keys(THAI_SYLLABLE);

/** ㅇ carries no sound of its own; in Thai that is the silent อ. */
const thaiOnset = (thai: string, ch: string) =>
  ch === "ㅇ" ? "อ" : (thai.split("·")[0].split("(")[0].split("→")[0].trim() || "อ");

/**
 * Thai reading of one syllable, or null when the vowel has no clean template.
 *
 * `onsetThai` is the consonant's *word-initial* Thai value — the lenis letters
 * ㄱ ㄷ ㅂ ㅈ read ค ท พ ช here, not their voiced medial values, which is
 * exactly the confusion the reading exercise exists to surface.
 */
export function thaiSyllable(onsetThai: string, onsetCh: string, vowel: string): string | null {
  const shape = THAI_SYLLABLE[vowel];
  return shape ? shape(thaiOnset(onsetThai, onsetCh)) : null;
}

const BASE = 0xac00;
const LEAD = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const MEDIAL = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];

/** Compose a syllable block, e.g. ㅂ + ㅏ -> 바. Null if either jamo can't sit there. */
export function compose(lead: string, medial: string): string | null {
  const l = LEAD.indexOf(lead);
  const v = MEDIAL.indexOf(medial);
  if (l < 0 || v < 0) return null;
  return String.fromCodePoint(BASE + (l * 21 + v) * 28);
}
