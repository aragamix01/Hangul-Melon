import pronunciations from "./pronunciations.json";

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
  strokeCount: number;
  strokes: string[];
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
 *     assimilate and become voiced [ɡ d b dʑ]. Thai has no voiced stops, so the
 *     nearest match flips to the unaspirated ก ต ป จ.
 *   - Syllable-finally they are unreleased, and ㅈ neutralises to [t].
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
    { label: "พยางค์ที่ 2+", thai: "ก", explain: "อยู่ระหว่างเสียงก้อง จึงกลายเป็นเสียงก้อง ฟังเป็น ก", word: "아기", rom: "agi", gloss: "เด็กทารก" },
    { label: "ตัวสะกด", thai: "ก", explain: "ตัวสะกดไม่ปล่อยลม ค้างไว้ที่คอ", word: "한국", rom: "hanguk", gloss: "ประเทศเกาหลี" },
  ],
  "ㄷ": [
    { label: "พยางค์แรก", thai: "ท", explain: "ต้นคำไม่มีเสียงก้อง ออกมาเป็น ท เบา ๆ", word: "다리", rom: "tari", gloss: "ขา / สะพาน" },
    { label: "พยางค์ที่ 2+", thai: "ต", explain: "อยู่ระหว่างเสียงก้อง จึงกลายเป็นเสียงก้อง ฟังเป็น ต", word: "어디", rom: "eodi", gloss: "ที่ไหน" },
    { label: "ตัวสะกด", thai: "ท", explain: "ตัวสะกดไม่ปล่อยลม ค้างไว้ที่ปลายลิ้น", word: "듣다", rom: "teutta", gloss: "ฟัง" },
  ],
  "ㅂ": [
    { label: "พยางค์แรก", thai: "พ", explain: "ต้นคำไม่มีเสียงก้อง ออกมาเป็น พ เบา ๆ", word: "바다", rom: "pada", gloss: "ทะเล" },
    { label: "พยางค์ที่ 2+", thai: "ป", explain: "อยู่ระหว่างเสียงก้อง จึงกลายเป็นเสียงก้อง ฟังเป็น ป", word: "아버지", rom: "abeoji", gloss: "คุณพ่อ" },
    { label: "ตัวสะกด", thai: "พ", explain: "ตัวสะกดไม่ปล่อยลม ปิดปากค้างไว้", word: "밥", rom: "pap", gloss: "ข้าว" },
  ],
  "ㅈ": [
    { label: "พยางค์แรก", thai: "ช", explain: "ต้นคำไม่มีเสียงก้อง ออกมาเป็น ช เบา ๆ", word: "자다", rom: "chada", gloss: "นอน" },
    { label: "พยางค์ที่ 2+", thai: "จ", explain: "อยู่ระหว่างเสียงก้อง จึงกลายเป็นเสียงก้อง ฟังเป็น จ", word: "아저씨", rom: "ajeossi", gloss: "คุณลุง" },
    { label: "ตัวสะกด", thai: "ท", explain: "ตัวสะกดยุบเป็นเสียง ท เหมือน ㄷ ㅅ ㅌ", word: "낮", rom: "nat", gloss: "ตอนกลางวัน" },
  ],
};

type Row = [
  ch: string,
  rom: string,
  name: string,
  thai: string,
  strokeCount: number,
  strokes: string[],
  position: string,
  hint: string,
];

const consonantRows: Row[] = [
  // ---- Stage 1: the five original shapes, drawn from the speech organs ----
  ["ㄱ", "g / k", "기역 giyeok", "ค → ก", 2, ["เส้นลงขวา", "หักลงล่าง"], "พยางค์แรก = ค · พยางค์ที่ 2+ = ก · ตัวสะกด = ก", "รูปโคนลิ้นยกชิดเพดานอ่อน เหมือนขวานหักมุม"],
  ["ㄴ", "n", "니은 nieun", "น", 2, ["เส้นลงล่าง", "เส้นไปขวา"], "ต้นคำ = น, ตัวสะกด = น", "รูปปลายลิ้นแตะเหงือกหลังฟันบน"],
  ["ㅁ", "m", "미음 mieum", "ม", 3, ["เส้นซ้ายลง", "เส้นบนไปขวาแล้วลง", "เส้นล่าง"], "ต้นคำ = ม, ตัวสะกด = ม", "สี่เหลี่ยม = ปากที่ปิดสนิท"],
  ["ㅅ", "s", "시옷 siot", "ซ", 2, ["เส้นเฉียงซ้าย", "เส้นเฉียงขวา"], "ต้นคำ = ซ, ตัวสะกด = ท", "รูปฟันสองซี่ ลมเสียดสีผ่านฟัน"],
  ["ㅇ", "– / ng", "이응 ieung", "อ / ง", 1, ["วงกลมทวนเข็ม"], "ต้นคำ = ไม่มีเสียง (เป็นที่วางเฉย ๆ), ตัวสะกด = ง", "วงกลม = ลำคอที่เปิดโล่ง"],

  // ---- Stage 3: plain consonants derived by adding one stroke ----
  ["ㄷ", "d / t", "디귿 digeut", "ท → ต", 3, ["เส้นบน", "เส้นซ้ายลง", "เส้นล่าง"], "พยางค์แรก = ท · พยางค์ที่ 2+ = ต · ตัวสะกด = ท", "ㄴ + หลังคา = ปิดลมแล้วปล่อย"],
  ["ㄹ", "r / l", "리을 rieul", "ร / ล", 5, ["เส้นบนขวา", "หักลง", "เส้นกลาง", "หักลง", "เส้นล่าง"], "ต้นคำ = ร, ตัวสะกด = ล", "ㄴ ซ้อนซิกแซก = ลิ้นสะบัดม้วน"],
  ["ㅂ", "b / p", "비읍 bieup", "พ → ป", 4, ["เส้นซ้าย", "เส้นขวา", "เส้นกลาง", "เส้นล่าง"], "พยางค์แรก = พ · พยางค์ที่ 2+ = ป · ตัวสะกด = พ", "ㅁ ที่เปิดฝาบน = ถ้วยเปิดปาก"],
  ["ㅈ", "j", "지읒 jieut", "ช → จ", 3, ["เส้นบน", "เฉียงซ้าย", "เฉียงขวา"], "พยางค์แรก = ช · พยางค์ที่ 2+ = จ · ตัวสะกด = ท", "ㅅ + หมวก = ลมถูกกักก่อนเสียดสี"],

  // ---- Stage 5: aspirated — one extra stroke = one puff of air ----
  ["ㅋ", "k", "키읔 kieuk", "ค", 3, ["เส้นบน", "หักลง", "ขีดกลาง"], "ต้นคำ = ค, ตัวสะกด = ก", "ㄱ + ขีด = พ่นลมออกแรง"],
  ["ㅌ", "t", "티읕 tieut", "ท", 4, ["เส้นบน", "เส้นซ้าย", "ขีดกลาง", "เส้นล่าง"], "ต้นคำ = ท, ตัวสะกด = ท", "ㄷ + ขีด = พ่นลมออกแรง"],
  ["ㅍ", "p", "피읖 pieup", "พ", 4, ["เส้นบน", "ขาซ้าย", "ขาขวา", "เส้นล่าง"], "ต้นคำ = พ, ตัวสะกด = พ", "ㅂ ที่ล้มลง = พ่นลมออกแรง"],
  ["ㅊ", "ch", "치읓 chieut", "ช", 4, ["ขีดบน", "เส้นขวาง", "เฉียงซ้าย", "เฉียงขวา"], "ต้นคำ = ช, ตัวสะกด = ท", "ㅈ + ขีด = พ่นลมออกแรง"],
  ["ㅎ", "h", "히읗 hieut", "ฮ", 3, ["ขีดบน", "เส้นขวาง", "วงกลม"], "ต้นคำ = ฮ, ตัวสะกด = ท", "ㅇ + หมวก = ลมหายใจออกจากคอ"],

  // ---- Stage 7: tense / doubled ----
  ["ㄲ", "kk", "쌍기역 ssanggiyeok", "ก (เกร็งคอ)", 4, ["ㄱ ตัวแรก", "ㄱ ตัวที่สอง"], "เป็นได้ทั้งต้นคำและตัวสะกด", "ㄱ สองตัว = เกร็งคอแล้วดีดออก ไม่มีลม"],
  ["ㄸ", "tt", "쌍디귿 ssangdigeut", "ต (เกร็งคอ)", 6, ["ㄷ ตัวแรก", "ㄷ ตัวที่สอง"], "ต้นคำเท่านั้น (เป็นตัวสะกดไม่ได้)", "ㄷ สองตัว = เกร็งคอแล้วดีดออก"],
  ["ㅃ", "pp", "쌍비읍 ssangbieup", "ป (เกร็งคอ)", 8, ["ㅂ ตัวแรก", "ㅂ ตัวที่สอง"], "ต้นคำเท่านั้น (เป็นตัวสะกดไม่ได้)", "ㅂ สองตัว = เกร็งคอแล้วดีดออก"],
  ["ㅆ", "ss", "쌍시옷 ssangsiot", "ซ (เกร็งคอ)", 4, ["ㅅ ตัวแรก", "ㅅ ตัวที่สอง"], "เป็นได้ทั้งต้นคำและตัวสะกด", "ㅅ สองตัว = เสียดสีแรงและสั้น"],
  ["ㅉ", "jj", "쌍지읒 ssangjieut", "จ (เกร็งคอ)", 6, ["ㅈ ตัวแรก", "ㅈ ตัวที่สอง"], "ต้นคำเท่านั้น (เป็นตัวสะกดไม่ได้)", "ㅈ สองตัว = เกร็งคอแล้วดีดออก"],
];

const vowelRows: Row[] = [
  // ---- Stage 2: the six that unlock reading immediately ----
  ["ㅏ", "a", "아 a", "อา", 2, ["เส้นตั้ง", "ขีดขวา"], "เขียนไว้ขวาพยัญชนะ", "ขีดชี้ออกขวา = สว่าง (สระแนวตั้ง)"],
  ["ㅓ", "eo", "어 eo", "ออ", 2, ["ขีดซ้าย", "เส้นตั้ง"], "เขียนไว้ขวาพยัญชนะ", "ขีดชี้เข้าใน = มืด (สระแนวตั้ง)"],
  ["ㅗ", "o", "오 o", "โอ", 2, ["ขีดตั้ง", "เส้นนอน"], "เขียนไว้ใต้พยัญชนะ", "ขีดชี้ขึ้น = สว่าง (สระแนวนอน)"],
  ["ㅜ", "u", "우 u", "อู", 2, ["เส้นนอน", "ขีดลง"], "เขียนไว้ใต้พยัญชนะ", "ขีดชี้ลง = มืด (สระแนวนอน)"],
  ["ㅡ", "eu", "으 eu", "อือ", 1, ["เส้นนอน"], "เขียนไว้ใต้พยัญชนะ", "เส้นนอน = พื้นดิน ปากแบนกว้าง"],
  ["ㅣ", "i", "이 i", "อี", 1, ["เส้นตั้ง"], "เขียนไว้ขวาพยัญชนะ", "เส้นตั้ง = คนยืนตรง"],

  // ---- Stage 4: iotized (+ one stroke = add a "y") ----
  ["ㅑ", "ya", "야 ya", "ยา", 3, ["เส้นตั้ง", "ขีดบน", "ขีดล่าง"], "เขียนไว้ขวาพยัญชนะ", "ㅏ สองขีด = เติมเสียง ย ข้างหน้า"],
  ["ㅕ", "yeo", "여 yeo", "ยอ", 3, ["ขีดบน", "ขีดล่าง", "เส้นตั้ง"], "เขียนไว้ขวาพยัญชนะ", "ㅓ สองขีด = เติมเสียง ย ข้างหน้า"],
  ["ㅛ", "yo", "요 yo", "โย", 3, ["ขีดซ้าย", "ขีดขวา", "เส้นนอน"], "เขียนไว้ใต้พยัญชนะ", "ㅗ สองขีด = เติมเสียง ย ข้างหน้า"],
  ["ㅠ", "yu", "유 yu", "ยู", 3, ["เส้นนอน", "ขีดซ้าย", "ขีดขวา"], "เขียนไว้ใต้พยัญชนะ", "ㅜ สองขีด = เติมเสียง ย ข้างหน้า"],

  // ---- Stage 6: + ㅣ ----
  ["ㅐ", "ae", "애 ae", "แอ", 3, ["เส้นตั้ง", "ขีดขวา", "เส้นตั้งขวา"], "เขียนไว้ขวาพยัญชนะ", "ㅏ + ㅣ (คนเกาหลีรุ่นใหม่ออกเสียงเกือบเท่า ㅔ)"],
  ["ㅔ", "e", "에 e", "เอ", 3, ["ขีดซ้าย", "เส้นตั้ง", "เส้นตั้งขวา"], "เขียนไว้ขวาพยัญชนะ", "ㅓ + ㅣ (ฟังแทบไม่ต่างจาก ㅐ)"],
  ["ㅒ", "yae", "얘 yae", "แย", 4, ["ㅑ", "เส้นตั้งขวา"], "เขียนไว้ขวาพยัญชนะ", "ㅑ + ㅣ = ㅐ ที่มีเสียง ย"],
  ["ㅖ", "ye", "예 ye", "เย", 4, ["ㅕ", "เส้นตั้งขวา"], "เขียนไว้ขวาพยัญชนะ", "ㅕ + ㅣ = ㅔ ที่มีเสียง ย"],

  // ---- Stage 8: w-compounds and ㅢ ----
  ["ㅘ", "wa", "와 wa", "วา", 4, ["ㅗ", "ㅏ"], "เขียนไว้ใต้และขวา", "ㅗ + ㅏ = ว + อา"],
  ["ㅙ", "wae", "왜 wae", "แว", 5, ["ㅗ", "ㅐ"], "เขียนไว้ใต้และขวา", "ㅗ + ㅐ = ว + แอ"],
  ["ㅚ", "oe", "외 oe", "เว", 3, ["ㅗ", "ㅣ"], "เขียนไว้ใต้และขวา", "ㅗ + ㅣ — ปัจจุบันออกเสียงเหมือน ㅞ"],
  ["ㅝ", "wo", "워 wo", "วอ", 4, ["ㅜ", "ㅓ"], "เขียนไว้ใต้และขวา", "ㅜ + ㅓ = ว + ออ"],
  ["ㅞ", "we", "웨 we", "เว", 5, ["ㅜ", "ㅔ"], "เขียนไว้ใต้และขวา", "ㅜ + ㅔ — ㅙ ㅚ ㅞ เสียงเดียวกันหมด"],
  ["ㅟ", "wi", "위 wi", "วี", 3, ["ㅜ", "ㅣ"], "เขียนไว้ใต้และขวา", "ㅜ + ㅣ = ว + อี"],
  ["ㅢ", "ui", "의 ui", "อึย", 2, ["ㅡ", "ㅣ"], "เขียนไว้ใต้และขวา", "ㅡ + ㅣ ออกเร็ว ๆ ติดกัน"],
];

function toJamo(rows: Row[], kind: JamoKind): Jamo[] {
  return rows.map((r) => {
    const p = PRON[r[0]];
    if (!p) throw new Error(`pronunciations.json is missing an entry for ${r[0]}`);
    return {
      ch: r[0],
      kind,
      rom: r[1],
      name: r[2],
      nameKo: p.nameKo,
      demo: p.demo,
      thai: r[3],
      strokeCount: r[4],
      strokes: r[5],
      position: r[6],
      hint: r[7],
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
    n: 1, kind: "consonant", glyph: "ㄱ",
    chars: ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"],
    title: "พยัญชนะพื้นฐาน 14 ตัว",
    sub: "기본자음 · ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ",
    rule: "นี่คือลำดับ 가나다 ที่ใช้จริงทุกที่ — พจนานุกรม สารบัญหนังสือ รายชื่อนักเรียน ท่องให้ขึ้นใจตามลำดับนี้",
    tint: "#FDE8F0", border: "#F3DDE6",
  },
  {
    n: 2, kind: "vowel", glyph: "ㅏ",
    chars: ["ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ"],
    title: "สระพื้นฐาน 10 ตัว",
    sub: "기본모음 · ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ",
    rule: "มาเป็นคู่: ㅏ/ㅑ · ㅓ/ㅕ · ㅗ/ㅛ · ㅜ/ㅠ ตัวที่มีสองขีดคือตัวเดิมที่เติมเสียง ย ข้างหน้า",
    tint: "#EAF2F6", border: "#D5E7EF",
  },
  {
    n: 3, kind: "consonant", glyph: "ㄲ",
    chars: ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"],
    title: "พยัญชนะคู่ 5 ตัว",
    sub: "쌍자음 · ㄲ ㄸ ㅃ ㅆ ㅉ",
    rule: "เขียนซ้ำสองตัว = เกร็งคอแล้วดีดออก ไม่พ่นลม ㄸ ㅃ ㅉ ใช้เป็นตัวสะกดไม่ได้",
    tint: "#FDE8F0", border: "#F3DDE6",
  },
  {
    n: 4, kind: "vowel", glyph: "ㅘ",
    chars: ["ㅐ", "ㅒ", "ㅔ", "ㅖ", "ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ"],
    title: "สระประสม 11 ตัว",
    sub: "복합모음 · ㅐ ㅒ ㅔ ㅖ ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ",
    rule: "สระพื้นฐาน + ㅣ (ㅐ ㅒ ㅔ ㅖ) หรือ ㅗ/ㅜ นำหน้าเป็นเสียง ว (ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ) และ ㅢ = ㅡ + ㅣ",
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
