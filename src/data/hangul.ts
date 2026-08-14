import pronunciations from "./pronunciations.json";
import { STROKES, type Stroke } from "./strokes";

const PRON = pronunciations.letters as Record<string, { nameKo: string; demo: string }>;

export type JamoKind = "consonant" | "vowel";

export interface Jamo {
  /** The jamo character itself, e.g. "ㄱ" */
  ch: string;
  kind: JamoKind;
  /** Revised-Romanization reading, e.g. "g / k" */
  rom: string;
  /** Display name: Korean + romanized, e.g. "기역 giyeok" */
  name: string;
  /** Korean letter name alone — this is what TTS speaks, never the bare jamo. */
  nameKo: string;
  /** A real syllable demonstrating the sound, e.g. "가". Also a TTS target. */
  demo: string;
  /** Approximate Thai sound */
  thai: string;
  /** Stroke count per the course PDF — derived from strokes, never hand-typed */
  strokeCount: number;
  /** Ordered strokes: SVG geometry plus a Thai description each */
  strokes: Stroke[];
  /** Where it sits in a syllable block / how the sound shifts by position */
  position: string;
  /** Mnemonic */
  hint: string;
  /**
   * Present only for the four plain (lenis) obstruents ㄱ ㄷ ㅂ ㅈ, whose sound
   * genuinely changes with position. See VOICING.
   */
  positions?: PositionSound[];
}

export interface PositionSound {
  /** Thai label for the slot */
  label: string;
  /** Nearest Thai letter in this slot */
  thai: string;
  /** Why it shifts */
  explain: string;
  /** Example word — has its own pre-rendered clip */
  word: string;
  rom: string;
  gloss: string;
}

/**
 * The single biggest source of "why doesn't it sound like the romanization?"
 *
 * ㄱ ㄷ ㅂ ㅈ are *lenis* — they carry no voicing of their own, so they take it
 * from their surroundings:
 *
 *   - Word-initially there is nothing before them, so they come out voiceless
 *     and (in modern Seoul speech) lightly aspirated. A Thai ear hears ค ท พ ช.
 *   - Between two voiced sounds — i.e. from the second syllable onward — they
 *     assimilate and become voiced [ɡ d b dʑ].
 *   - Syllable-finally they are unreleased, and ㅈ neutralises to [t].
 *
 * The medial values matter for the Thai mapping, because Thai has a three-way
 * stop contrast of its own and two of these land on it exactly:
 *
 *     ㄷ ท [tʰ] · ด [d] · ต [t] ㄸ      ㅂ พ [pʰ] · บ [b] · ป [p] ㅃ
 *
 * So voiced ㄷ is ด and voiced ㅂ is บ — not ต and ป, which are the *tense*
 * ㄸ ㅃ. Thai has no voiced velar or voiced affricate, so ㄱ and ㅈ collapse
 * instead: their medial value falls back to ก and จ, the same letters used for
 * tense ㄲ ㅉ, and the student has to add the voicing by ear.
 *
 * Revised Romanization writes the medial value ("g", "d", "b", "j"), which is
 * exactly why 가방 looks like "gabang" but sounds closer to "kabang".
 *
 * The other consonants do not do this: aspirated ㅋ ㅌ ㅍ ㅊ and tense ㄲ ㄸ ㅃ ㅆ ㅉ
 * never voice, and ㅅ stays voiceless too.
 */
export const VOICING: Record<string, PositionSound[]> = {
  "ㄱ": [
    { label: "พยางค์แรก", thai: "ค", explain: "ต้นคำไม่มีเสียงก้อง ออกมาเป็น ค เบา ๆ", word: "가방", rom: "kabang", gloss: "กระเป๋า" },
    { label: "พยางค์ที่ 2+", thai: "ก", explain: "กลายเป็นเสียงก้อง [g] ซึ่งไทยไม่มี — ใกล้ที่สุดคือ ก แต่ให้ลำคอสั่น", word: "아기", rom: "agi", gloss: "เด็กทารก" },
    { label: "ตัวสะกด", thai: "ก", explain: "ตัวสะกดไม่ปล่อยลม ค้างไว้ที่คอ", word: "한국", rom: "hanguk", gloss: "ประเทศเกาหลี" },
  ],
  "ㄷ": [
    { label: "พยางค์แรก", thai: "ท", explain: "ต้นคำไม่มีเสียงก้อง ออกมาเป็น ท เบา ๆ", word: "다리", rom: "tari", gloss: "ขา / สะพาน" },
    { label: "พยางค์ที่ 2+", thai: "ด", explain: "อยู่ระหว่างเสียงก้อง จึงกลายเป็นเสียงก้อง = ด ของไทยพอดีเป๊ะ", word: "어디", rom: "eodi", gloss: "ที่ไหน" },
    { label: "ตัวสะกด", thai: "ท", explain: "ตัวสะกดไม่ปล่อยลม ค้างไว้ที่ปลายลิ้น", word: "듣다", rom: "teutta", gloss: "ฟัง" },
  ],
  "ㅂ": [
    { label: "พยางค์แรก", thai: "พ", explain: "ต้นคำไม่มีเสียงก้อง ออกมาเป็น พ เบา ๆ", word: "바다", rom: "pada", gloss: "ทะเล" },
    { label: "พยางค์ที่ 2+", thai: "บ", explain: "อยู่ระหว่างเสียงก้อง จึงกลายเป็นเสียงก้อง = บ ของไทยพอดีเป๊ะ", word: "아버지", rom: "abeoji", gloss: "คุณพ่อ" },
    { label: "ตัวสะกด", thai: "พ", explain: "ตัวสะกดไม่ปล่อยลม ปิดปากค้างไว้", word: "밥", rom: "pap", gloss: "ข้าว" },
  ],
  "ㅈ": [
    { label: "พยางค์แรก", thai: "ช", explain: "ต้นคำไม่มีเสียงก้อง ออกมาเป็น ช เบา ๆ", word: "자다", rom: "chada", gloss: "นอน" },
    { label: "พยางค์ที่ 2+", thai: "จ", explain: "กลายเป็นเสียงก้อง [dʑ] ซึ่งไทยไม่มี — ใกล้ที่สุดคือ จ แต่ให้ลำคอสั่น", word: "아저씨", rom: "ajeossi", gloss: "คุณลุง" },
    { label: "ตัวสะกด", thai: "ท", explain: "ตัวสะกดยุบเป็นเสียง ท เหมือน ㄷ ㅅ ㅌ", word: "낮", rom: "nat", gloss: "ตอนกลางวัน" },
  ],
};

// Stroke geometry, counts and labels live in strokes.ts and are looked up by
// character — keeping them out of these rows means the count on the card can
// never disagree with the animation.
type Row = [
  ch: string,
  rom: string,
  name: string,
  thai: string,
  position: string,
  hint: string,
];

// Letter names, position rules and Thai readings follow the course PDF
// (ภาษาเกาหลีพื้นฐาน), including its แม่ก* naming for the seven final sounds.
const consonantRows: Row[] = [
  // ---- พยัญชนะเดี่ยว 14 ตัว, in 가나다 order ----
  ["ㄱ", "g / k", "기역 คีย็อก", "ค → ก", "พยางค์แรก = ค · พยางค์ที่ 2+ = ก · ตัวสะกด = แม่กก", "รูปโคนลิ้นยกชิดเพดานอ่อน เหมือนขวานหักมุม"],
  ["ㄴ", "n", "니은 นีอึน", "น", "ต้นคำ = น · ตัวสะกด = แม่กน", "รูปปลายลิ้นแตะเหงือกหลังฟันบน"],
  ["ㄷ", "d / t", "디귿 ทีกึด", "ท → ด", "พยางค์แรก = ท · พยางค์ที่ 2+ = ด · ตัวสะกด = แม่กด", "ㄴ + หลังคา = ปิดลมแล้วปล่อย"],
  ["ㄹ", "r / l", "리을 รีอึล", "ร / ล", "ต้นคำ = ร · ตัวสะกด = แม่กล", "ㄴ ซ้อนซิกแซก = ลิ้นสะบัดม้วน"],
  ["ㅁ", "m", "미음 มีอึม", "ม", "ต้นคำ = ม · ตัวสะกด = แม่กม", "สี่เหลี่ยม = ปากที่ปิดสนิท"],
  ["ㅂ", "b / p", "비읍 พีอึบ", "พ → บ", "พยางค์แรก = พ · พยางค์ที่ 2+ = บ · ตัวสะกด = แม่กบ", "ㅁ ที่เปิดฝาบน = ถ้วยเปิดปาก"],
  ["ㅅ", "s", "시옷 ชีอด", "ซ · แต่เจอ ㅣ ㅟ , และสระ ย. ออกเสียง ช", "ต้นคำ = ซ · เจอสระ ㅣ ㅟ และสระเสียง ย = ช · ตัวสะกด = แม่กด", "รูปฟันสองซี่ · ชื่อตัวอักษรเองก็อ่าน ชีอด ไม่ใช่ ซีอด"],
  ["ㅇ", "– / ng", "이응 อีอึง", "ออกเสียงตามสระที่เจอ", "ต้นคำ = ออกเสียงตามสระที่เจอ · ตัวสะกด = แม่กง", "วงกลม = ลำคอที่เปิดโล่ง"],
  ["ㅈ", "j", "지읒 ชีอึด", "ช → จ", "พยางค์แรก = ช · พยางค์ที่ 2+ = จ · ตัวสะกด = แม่กด", "ㅅ + หมวก = ลมถูกกักก่อนเสียดสี"],
  ["ㅊ", "ch", "치읓 ชี่อึด", "ช (เสียงหนัก)", "ต้นคำ = ช (เสียงหนัก) · ตัวสะกด = แม่กด", "ㅈ + ขีด = พ่นลมออกแรง"],
  ["ㅋ", "k", "키읔 คี่อึก", "ค (เสียงหนัก)", "ต้นคำ = ค (เสียงหนัก) · ตัวสะกด = แม่กก", "ㄱ + ขีด = พ่นลมออกแรง"],
  ["ㅌ", "t", "티읕 ที่อึด", "ท (เสียงหนัก)", "ต้นคำ = ท (เสียงหนัก) · ตัวสะกด = แม่กด", "ㄷ + ขีด = พ่นลมออกแรง"],
  ["ㅍ", "p", "피읖 พี่อึบ", "พ (เสียงหนัก)", "ต้นคำ = พ (เสียงหนัก) · ตัวสะกด = แม่กบ", "ㅂ ที่ล้มลง = พ่นลมออกแรง"],
  ["ㅎ", "h", "히읗 ฮีอึด", "ฮ", "ต้นคำ = ฮ · ตัวสะกด = แม่กด", "ㅇ + หมวก = ลมหายใจออกจากคอ"],

  // ---- พยัญชนะคู่ 5 ตัว (쌍 = คู่) ----
  ["ㄲ", "kk", "쌍기역 ซังกีย็อก", "ก (เกร็งคอ)", "เป็นได้ทั้งต้นคำและตัวสะกด · ตัวสะกด = แม่กก", "ㄱ สองตัว = เกร็งคอแล้วดีดออก ไม่มีลม"],
  ["ㄸ", "tt", "쌍디귿 ซังดีกึด", "ต (เกร็งคอ)", "ต้นคำเท่านั้น (เป็นตัวสะกดไม่ได้)", "ㄷ สองตัว = เกร็งคอแล้วดีดออก"],
  ["ㅃ", "pp", "쌍비읍 ซังบีอึบ", "ป (เกร็งคอ)", "ต้นคำเท่านั้น (เป็นตัวสะกดไม่ได้)", "ㅂ สองตัว = เกร็งคอแล้วดีดออก"],
  ["ㅆ", "ss", "쌍시옷 ซังชีอด", "ซ (เกร็งคอ) · แต่เจอ ㅣ ㅟ , และสระ ย. ออกเสียง ช", "เป็นได้ทั้งต้นคำและตัวสะกด · เจอสระ ㅣ ㅟ และสระเสียง ย = ช · ตัวสะกด = แม่กด", "ㅅ สองตัว = เสียดสีแรงและสั้น"],
  ["ㅉ", "jj", "쌍지읒 ซังจีอึด", "จ (เกร็งคอ)", "ต้นคำเท่านั้น (เป็นตัวสะกดไม่ได้)", "ㅈ สองตัว = เกร็งคอแล้วดีดออก"],
];

const vowelRows: Row[] = [
  // ---- สระเดี่ยว (단모음) 10 ตัว, in the PDF's order ----
  ["ㅏ", "a", "아 อา", "อา", "เขียนไว้ขวาพยัญชนะ", "ขีดชี้ออกขวา = สว่าง (สระแนวตั้ง)"],
  ["ㅑ", "ya", "야 ยา", "ยา", "เขียนไว้ขวาพยัญชนะ", "ㅏ สองขีด = เติมเสียง ย ข้างหน้า"],
  ["ㅓ", "eo", "어 ออ", "ออ", "เขียนไว้ขวาพยัญชนะ", "ขีดชี้เข้าใน = มืด · อย่าห่อปาก ถ้าห่อจะกลายเป็น ㅗ ทันที"],
  ["ㅕ", "yeo", "여 ยอ", "ยอ", "เขียนไว้ขวาพยัญชนะ", "ㅓ สองขีด = เติมเสียง ย ข้างหน้า · อย่าห่อปาก ไม่งั้นจะเป็น ㅛ"],
  ["ㅗ", "o", "오 โอ", "โอ", "เขียนไว้ใต้พยัญชนะ", "ขีดชี้ขึ้น = สว่าง (สระแนวนอน)"],
  ["ㅛ", "yo", "요 โย", "โย", "เขียนไว้ใต้พยัญชนะ", "ㅗ สองขีด = เติมเสียง ย ข้างหน้า"],
  ["ㅜ", "u", "우 อู", "อู", "เขียนไว้ใต้พยัญชนะ", "ขีดชี้ลง = มืด (สระแนวนอน)"],
  ["ㅠ", "yu", "유 ยู", "ยู", "เขียนไว้ใต้พยัญชนะ", "ㅜ สองขีด = เติมเสียง ย ข้างหน้า"],
  ["ㅡ", "eu", "으 อือ", "อือ", "เขียนไว้ใต้พยัญชนะ", "เส้นนอน = พื้นดิน ปากแบนกว้าง · ตรงกับ อือ ของไทยพอดี"],
  ["ㅣ", "i", "이 อี", "อี", "เขียนไว้ขวาพยัญชนะ", "เส้นตั้ง = คนยืนตรง"],

  // ---- สระประสม (이중모음) 11 ตัว, in the PDF's order ----
  ["ㅔ", "e", "에 เอ", "เอ", "เขียนไว้ขวาพยัญชนะ", "ㅓ + ㅣ (ฟังแทบไม่ต่างจาก ㅐ)"],
  ["ㅖ", "ye", "예 เย", "เย", "เขียนไว้ขวาพยัญชนะ", "ㅕ + ㅣ = ㅔ ที่มีเสียง ย"],
  ["ㅐ", "ae", "애 แอ", "แอ", "เขียนไว้ขวาพยัญชนะ", "ㅏ + ㅣ (คนเกาหลีรุ่นใหม่ออกเสียงเกือบเท่า ㅔ)"],
  ["ㅒ", "yae", "얘 แย", "แย", "เขียนไว้ขวาพยัญชนะ", "ㅑ + ㅣ = ㅐ ที่มีเสียง ย"],
  ["ㅘ", "wa", "와 วา", "วา", "เขียนไว้ใต้และขวา", "ㅗ + ㅏ = ว + อา"],
  ["ㅙ", "wae", "왜 แว", "แว", "เขียนไว้ใต้และขวา", "ㅗ + ㅐ = ว + แอ"],
  ["ㅚ", "oe", "외 เว", "เว", "เขียนไว้ใต้และขวา", "ㅗ + ㅣ = ว + เอ"],
  ["ㅝ", "wo", "워 วอ", "วอ", "เขียนไว้ใต้และขวา", "ㅜ + ㅓ = ว + ออ · ตัว ออ ไม่ห่อปาก เหมือน ㅓ"],
  ["ㅞ", "we", "웨 อุเว", "อุเว", "เขียนไว้ใต้และขวา", "ㅜ + ㅔ = อุ + เว"],
  ["ㅟ", "wi", "위 วี", "วี", "เขียนไว้ใต้และขวา", "ㅜ + ㅣ = ว + อี"],
  ["ㅢ", "ui", "의 อึย", "อึย", "ไม่มีพยัญชนะต้น + พยางค์แรก = อึย · มีพยัญชนะต้น = อี · ไม่ใช่พยางค์แรกและไม่มีพยัญชนะต้น = อี หรือ อึย · เป็นไวยากรณ์แสดงความเป็นเจ้าของ = เอ", "의사 = อึยซา (หมอ) · 흰색 = ฮีนแซ็ก (สีขาว) · 회의 = ฮเวอึย หรือ ฮเวอี (การประชุม)"],
];

function toJamo(rows: Row[], kind: JamoKind): Jamo[] {
  return rows.map((r) => {
    const p = PRON[r[0]];
    if (!p) throw new Error(`pronunciations.json is missing an entry for ${r[0]}`);
    const strokes = STROKES[r[0]];
    if (!strokes?.length) throw new Error(`strokes.ts is missing an entry for ${r[0]}`);
    return {
      ch: r[0],
      kind,
      rom: r[1],
      name: r[2],
      nameKo: p.nameKo,
      demo: p.demo,
      thai: r[3],
      strokeCount: strokes.length,
      strokes,
      position: r[4],
      hint: r[5],
      positions: VOICING[r[0]],
    };
  });
}

export interface Stage {
  n: number;
  /** Characters taught in this stage, in teaching order */
  chars: string[];
  kind: JamoKind;
  glyph: string;
  title: string;
  sub: string;
  /** The one rule this stage adds */
  rule: string;
  tint: string;
  border: string;
}

/**
 * Teaching order, not dictionary order.
 *
 * Hangul was designed as a derivation system: five consonant shapes copied from
 * the speech organs, three vowel strokes, and two transformations (add a stroke
 * = add a puff of air; double a letter = tense it). Dictionary order
 * (ㄱㄲㄴㄷㄸ…) interleaves those transformations with the base shapes, so a
 * beginner meets ㄲ before ever seeing why ㄱ looks the way it does.
 *
 * This order follows the derivation instead, and alternates consonant and vowel
 * stages so the student can read real syllables from stage 2 onward.
 */
export const STAGES_DERIVATION: Stage[] = [
  {
    n: 1, kind: "consonant", glyph: "ㄱ",
    chars: ["ㄱ", "ㄴ", "ㅁ", "ㅅ", "ㅇ"],
    title: "5 รูปพื้นฐาน",
    sub: "ㄱ ㄴ ㅁ ㅅ ㅇ · พยัญชนะต้นตำรับ",
    rule: "ทั้ง 19 ตัวงอกมาจาก 5 รูปนี้ แต่ละรูปวาดตามอวัยวะที่ใช้ออกเสียง จำ 5 ตัวนี้ได้ ที่เหลือคือการเติมขีด",
    tint: "#FDE8F0", border: "#F3DDE6",
  },
  {
    n: 2, kind: "vowel", glyph: "ㅏ",
    chars: ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"],
    title: "6 สระหลัก",
    sub: "ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ · อ่านคำได้ทันที",
    rule: "สระตั้ง (ㅏ ㅓ ㅣ) วางขวาพยัญชนะ สระนอน (ㅗ ㅜ ㅡ) วางใต้พยัญชนะ จบด่านนี้แล้วอ่าน 가 나 마 사 아 ได้เลย",
    tint: "#EAF2F6", border: "#D5E7EF",
  },
  {
    n: 3, kind: "consonant", glyph: "ㄷ",
    chars: ["ㄷ", "ㄹ", "ㅂ", "ㅈ"],
    title: "พยัญชนะเดี่ยวที่เหลือ",
    sub: "ㄷ ㄹ ㅂ ㅈ · เติมขีดจากด่าน 1",
    rule: "ㄴ+ขีด=ㄷ · ㄷ+ขีด=ㄹ · ㅁ+ขีด=ㅂ · ㅅ+ขีด=ㅈ ครบ 9 ตัวนี้ = พยัญชนะเดี่ยวทั้งหมด",
    tint: "#FDE8F0", border: "#F3DDE6",
  },
  {
    n: 4, kind: "vowel", glyph: "ㅑ",
    chars: ["ㅑ", "ㅕ", "ㅛ", "ㅠ"],
    title: "สระเสียง ย",
    sub: "ㅑ ㅕ ㅛ ㅠ · เติมขีดอีกอัน",
    rule: "ขีดสองอัน = เติมเสียง ย ข้างหน้า ㅏ→ㅑ, ㅓ→ㅕ, ㅗ→ㅛ, ㅜ→ㅠ ไม่มีข้อยกเว้น",
    tint: "#EAF2F6", border: "#D5E7EF",
  },
  {
    n: 5, kind: "consonant", glyph: "ㅋ",
    chars: ["ㅋ", "ㅌ", "ㅍ", "ㅊ", "ㅎ"],
    title: "พยัญชนะพ่นลม",
    sub: "ㅋ ㅌ ㅍ ㅊ ㅎ · ขีดเพิ่ม = ลมเพิ่ม",
    rule: "ㄱ→ㅋ, ㄷ→ㅌ, ㅂ→ㅍ, ㅈ→ㅊ ทดสอบด้วยกระดาษหน้าปาก ถ้ากระดาษไหว = ออกถูก",
    tint: "#FDE8F0", border: "#F3DDE6",
  },
  {
    n: 6, kind: "vowel", glyph: "ㅐ",
    chars: ["ㅐ", "ㅔ", "ㅒ", "ㅖ"],
    title: "สระ แอ / เอ",
    sub: "ㅐ ㅔ ㅒ ㅖ · เติม ㅣ ต่อท้าย",
    rule: "สระหลัก + ㅣ ข่าวดี: คนเกาหลีปัจจุบันออก ㅐ กับ ㅔ แทบเหมือนกัน ต้องแยกตอนเขียน ไม่ต้องแยกตอนพูด",
    tint: "#EAF2F6", border: "#D5E7EF",
  },
  {
    n: 7, kind: "consonant", glyph: "ㄲ",
    chars: ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"],
    title: "พยัญชนะคู่",
    sub: "ㄲ ㄸ ㅃ ㅆ ㅉ · เกร็งคอ ไม่พ่นลม",
    rule: "เขียนซ้ำสองตัว = เกร็งคอแล้วดีดออก สั้นและแข็ง ตรงข้ามกับด่าน 5 ที่พ่นลม ㄸ ㅃ ㅉ ใช้เป็นตัวสะกดไม่ได้",
    tint: "#FDE8F0", border: "#F3DDE6",
  },
  {
    n: 8, kind: "vowel", glyph: "ㅘ",
    chars: ["ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ"],
    title: "สระประสม ว",
    sub: "ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ · สระสองตัวชนกัน",
    rule: "ㅗ หรือ ㅜ นำหน้า = เสียง ว ㅙ ㅚ ㅞ ออกเสียงเหมือนกันหมดในภาษาพูดจริง",
    tint: "#EAF2F6", border: "#D5E7EF",
  },
];

/**
 * The order Korean itself uses: 가나다순, as fixed by 한글 맞춤법 제4항 and split
 * the way Korean textbooks and 한글학교 present it — 기본자음 14, 기본모음 10,
 * 쌍자음 5, 복합모음 11.
 *
 * This is the default. It is the order of every dictionary, index, class
 * register and textbook table of contents a student will ever meet, so a
 * learner trained on anything else cannot find their own name on a list.
 */
export const STAGES_CANONICAL: Stage[] = [
  {
    n: 1, kind: "vowel", glyph: "ㅏ",
    chars: ["ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ"],
    title: "สระเดี่ยว 10 ตัว",
    sub: "단모음 · ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ",
    rule: "มาเป็นคู่: ㅏ/ㅑ · ㅓ/ㅕ · ㅗ/ㅛ · ㅜ/ㅠ ตัวที่มีสองขีดคือตัวเดิมที่เติมเสียง ย ข้างหน้า",
    tint: "#EAF2F6", border: "#D5E7EF",
  },
  {
    n: 2, kind: "consonant", glyph: "ㄱ",
    chars: ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"],
    title: "พยัญชนะเดี่ยว 14 ตัว",
    sub: "자음 · ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ",
    rule: "นี่คือลำดับ 가나다 ที่ใช้จริงทุกที่ — พจนานุกรม สารบัญหนังสือ รายชื่อนักเรียน ท่องให้ขึ้นใจตามลำดับนี้",
    tint: "#FDE8F0", border: "#F3DDE6",
  },
  {
    n: 3, kind: "consonant", glyph: "ㄲ",
    chars: ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"],
    title: "พยัญชนะคู่ 5 ตัว",
    sub: "쌍자음 · ㄲ ㄸ ㅃ ㅆ ㅉ",
    rule: "쌍 แปลว่า คู่ · เขียนซ้ำสองตัว = เกร็งคอแล้วดีดออก ไม่พ่นลม ㄸ ㅃ ㅉ ใช้เป็นตัวสะกดไม่ได้",
    tint: "#FDE8F0", border: "#F3DDE6",
  },
  {
    n: 4, kind: "vowel", glyph: "ㅘ",
    chars: ["ㅔ", "ㅖ", "ㅐ", "ㅒ", "ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ"],
    title: "สระประสม 11 ตัว",
    sub: "이중모음 · ㅔ ㅖ ㅐ ㅒ ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ",
    rule: "สระเดี่ยว + ㅣ (ㅔ ㅖ ㅐ ㅒ) หรือ ㅗ/ㅜ นำหน้าเป็นเสียง ว (ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ) และ ㅢ = ㅡ + ㅣ",
    tint: "#EAF2F6", border: "#D5E7EF",
  },
];

export const CONSONANTS: Jamo[] = toJamo(consonantRows, "consonant");
export const VOWELS: Jamo[] = toJamo(vowelRows, "vowel");

/** Every jamo, keyed by character. */
export const JAMO_BY_CHAR: Record<string, Jamo> = {};
[...CONSONANTS, ...VOWELS].forEach((j) => (JAMO_BY_CHAR[j.ch] = j));

export const TOTAL_LETTERS = CONSONANTS.length + VOWELS.length; // 40

export type CurriculumId = "canonical" | "derivation";

export interface Curriculum {
  id: CurriculumId;
  /** Short label for the switcher */
  label: string;
  sublabel: string;
  /** One line on who this order is for */
  blurb: string;
  stages: Stage[];
  /** All 40 letters flattened in this curriculum's teaching order */
  order: Jamo[];
  /** Which stage a letter belongs to in this curriculum */
  stageOf: (ch: string) => number;
}

function buildCurriculum(
  id: CurriculumId,
  label: string,
  sublabel: string,
  blurb: string,
  stages: Stage[],
): Curriculum {
  const index = new Map<string, number>();
  stages.forEach((s) => s.chars.forEach((ch) => index.set(ch, s.n)));

  const order = stages.flatMap((s) => s.chars.map((ch) => JAMO_BY_CHAR[ch]));
  if (order.length !== TOTAL_LETTERS || order.some((j) => !j)) {
    throw new Error(`Curriculum "${id}" does not cover all ${TOTAL_LETTERS} letters exactly once`);
  }

  return { id, label, sublabel, blurb, stages, order, stageOf: (ch) => index.get(ch) ?? 0 };
}

export const CURRICULA: Record<CurriculumId, Curriculum> = {
  canonical: buildCurriculum(
    "canonical",
    "가나다",
    "ลำดับมาตรฐาน",
    "ลำดับที่โรงเรียนเกาหลีและพจนานุกรมใช้จริง — 14 + 10 + 5 + 11",
    STAGES_CANONICAL,
  ),
  derivation: buildCurriculum(
    "derivation",
    "จำง่าย",
    "เรียงตามรูป",
    "เรียงตามการงอกของรูปตัวอักษร จำง่ายกว่า แต่ไม่ใช่ลำดับที่ใช้ค้นพจนานุกรม",
    STAGES_DERIVATION,
  ),
};

/** Her order is the default. */
export const DEFAULT_CURRICULUM: CurriculumId = "canonical";

/**
 * A demo syllable is never the letter alone — a consonant is padded with ㅏ,
 * a vowel is carried by the silent ㅇ. Spell that out wherever a demo is
 * played, so the student knows which part of what they heard is the answer.
 *
 * 나 → ["ㄴ", "ㅏ"]   아 → ["ㅇ", "ㅏ"]
 */
export function demoParts(j: Jamo): [string, string] {
  return j.kind === "consonant" ? [j.ch, "ㅏ"] : ["ㅇ", j.ch];
}

// ---------------------------------------------------------------------------
// Syllable composition (Unicode NFC precomposed Hangul)
// ---------------------------------------------------------------------------

/** Initial-consonant slot order, fixed by Unicode — not a teaching order. */
export const INITIAL_ORDER = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

/** Medial-vowel slot order, fixed by Unicode. */
export const MEDIAL_ORDER = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ",
  "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ",
];

/** The seven final sounds a Korean syllable can actually end in, plus "none". */
export const FINAL_ORDER = ["", "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅇ"];

/** Index into the Unicode final-consonant table. */
const FINAL_INDEX: Record<string, number> = {
  "": 0, "ㄱ": 1, "ㄴ": 4, "ㄷ": 7, "ㄹ": 8, "ㅁ": 16, "ㅂ": 17, "ㅅ": 19, "ㅇ": 21,
};

export function composeSyllable(initial: string, medial: string, final = ""): string {
  const i = INITIAL_ORDER.indexOf(initial);
  const m = MEDIAL_ORDER.indexOf(medial);
  if (i < 0 || m < 0) return "";
  const f = FINAL_INDEX[final] ?? 0;
  return String.fromCharCode(0xac00 + (i * 21 + m) * 28 + f);
}

const ROM_INITIAL: Record<string, string> = {
  "ㄱ": "g", "ㄲ": "kk", "ㄴ": "n", "ㄷ": "d", "ㄸ": "tt", "ㄹ": "r", "ㅁ": "m",
  "ㅂ": "b", "ㅃ": "pp", "ㅅ": "s", "ㅆ": "ss", "ㅇ": "", "ㅈ": "j", "ㅉ": "jj",
  "ㅊ": "ch", "ㅋ": "k", "ㅌ": "t", "ㅍ": "p", "ㅎ": "h",
};

const ROM_MEDIAL: Record<string, string> = {};
VOWELS.forEach((v) => (ROM_MEDIAL[v.ch] = v.rom));

/** Finals neutralise: only 7 sounds survive at the end of a syllable. */
const ROM_FINAL: Record<string, string> = {
  "": "", "ㄱ": "k", "ㄴ": "n", "ㄷ": "t", "ㄹ": "l", "ㅁ": "m", "ㅂ": "p", "ㅅ": "t", "ㅇ": "ng",
};

export function romanizeSyllable(initial: string, medial: string, final = ""): string {
  return (
    (ROM_INITIAL[initial] ?? "") +
    (ROM_MEDIAL[medial] ?? "") +
    (ROM_FINAL[final] ?? "")
  );
}
