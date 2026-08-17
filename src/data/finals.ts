/**
 * ตัวสะกด — the final consonant slot, straight from the course PDF's
 * "ตัวสะกด" chapter (the part that comes after จบพยัญชนะ สระ).
 *
 * The PDF splits finals three ways:
 *
 *   1. ตัวสะกดเดี่ยว          받침    e.g. 만화
 *   2. ตัวสะกดคู่ (ตัวเดียวกัน)  쌍받침   e.g. 있다
 *   3. ตัวสะกดคู่ (ต่างกัน)     겹받침   e.g. 없다
 *
 * 1 and 2 are ด่าน 5 here (FINAL_GROUPS), 3 is ด่าน 6 (CLUSTERS).
 *
 * This module is deliberately standalone — it imports nothing, so hangul.ts can
 * import NEUTRALIZE from it without a cycle.
 */

/** One of the seven sounds a Korean syllable can actually end in. */
export interface FinalGroup {
  /** Progress key. Namespaced: a bare "ㄱ" is already a key from the letter stages. */
  key: string;
  /** Thai name for the final sound, as the PDF names it */
  mae: string;
  /** The one letter that represents this sound in the seven-way system */
  sound: string;
  /** Every letter that lands on this sound when written as a 받침 */
  finals: string[];
  /** The PDF's own example syllables — one per letter, in the same order */
  examples: string[];
  /**
   * Thai reading of each example, same order.
   *
   * The point of แม่กด is that all seven of its examples read พัด — a Thai
   * learner sees one word repeated seven times and the lesson lands before
   * they have played a single clip.
   *
   * Spelled closed, never open: a syllable that ends in a ตัวสะกด has a short
   * vowel, so 곰 is คม and not โคม, 옹 is อง and not โอง. Same convention the
   * letter names already use (기역 = คีย็อก, 시옷 = ชีอด).
   */
  examplesThai: string[];
  /** Thai reading of the sound in isolation */
  thai: string;
  /** Why these letters collapse together */
  note: string;
}

/**
 * Seven sounds, sixteen letters.
 *
 * A final consonant in Korean is *unreleased* — the mouth moves into position
 * and stops there, so everything that differs only in what happens after the
 * closure (aspiration, tensing, frication) becomes inaudible. ㄱ ㄲ ㅋ are three
 * different letters and one single ending.
 */
export const FINAL_GROUPS: FinalGroup[] = [
  {
    key: "final:ㄱ",
    mae: "แม่กก",
    sound: "ㄱ",
    finals: ["ㄱ", "ㄲ", "ㅋ"],
    examples: ["복", "볶", "봌"],
    examplesThai: ["พก", "พก", "พก"],
    thai: "ก",
    note: "สามตัวนี้ต่างกันตอนเป็นพยัญชนะต้น แต่พอเป็นตัวสะกดจะค้างลมไว้ที่โคนลิ้นเหมือนกันหมด 복 볶 봌 อ่านเหมือนกันเป๊ะ",
  },
  {
    key: "final:ㄴ",
    mae: "แม่กน",
    sound: "ㄴ",
    finals: ["ㄴ"],
    examples: ["만"],
    examplesThai: ["มัน"],
    thai: "น",
    note: "ตัวเดียวไม่มีคู่แข่ง — ㄴ เป็นตัวสะกด แม่กน เสมอ ปลายลิ้นแตะเพดานแล้วปล่อยลมออกจมูก",
  },
  {
    key: "final:ㄷ",
    mae: "แม่กด",
    sound: "ㄷ",
    finals: ["ㄷ", "ㅅ", "ㅆ", "ㅈ", "ㅊ", "ㅌ", "ㅎ"],
    examples: ["받", "밧", "밨", "밪", "밫", "밭", "밯"],
    examplesThai: ["พัด", "พัด", "พัด", "พัด", "พัด", "พัด", "พัด"],
    thai: "ด (ไม่ปล่อยลม)",
    note: "กลุ่มใหญ่ที่สุด เจ็ดตัวเหลือเสียงเดียว เสียง ส ช ท ฮ เกิดตอนปล่อยลม แต่ตัวสะกดไม่ปล่อยลม จึงเหลือแค่ปลายลิ้นแตะเพดาน",
  },
  {
    key: "final:ㄹ",
    mae: "แม่กล",
    sound: "ㄹ",
    finals: ["ㄹ"],
    examples: ["열"],
    examplesThai: ["ย็อล"],
    thai: "ล",
    note: "ㄹ ต้นคำเป็น ร (ลิ้นสะบัด) แต่ตัวสะกดเป็น ล (ลิ้นค้าง) ตัวเดียวกันคนละเสียง",
  },
  {
    key: "final:ㅁ",
    mae: "แม่กม",
    sound: "ㅁ",
    finals: ["ㅁ"],
    examples: ["곰"],
    examplesThai: ["คม"],
    thai: "ม",
    note: "ปิดปากค้างไว้แล้วปล่อยลมออกจมูก เหมือน ม สะกดของไทย",
  },
  {
    key: "final:ㅂ",
    mae: "แม่กบ",
    sound: "ㅂ",
    finals: ["ㅂ", "ㅍ"],
    examples: ["뽑", "깊"],
    examplesThai: ["ปบ", "คิบ"],
    thai: "บ (ไม่ปล่อยลม)",
    note: "ㅍ พ่นลมแรงตอนเป็นพยัญชนะต้น แต่ตัวสะกดปิดปากค้างไม่ปล่อยลม จึงเหลือเสียงเดียวกับ ㅂ",
  },
  {
    key: "final:ㅇ",
    mae: "แม่กง",
    sound: "ㅇ",
    finals: ["ㅇ"],
    examples: ["옹"],
    examplesThai: ["อง"],
    thai: "ง",
    note: "ㅇ เป็นพยัญชนะต้นไม่มีเสียง แต่เป็นตัวสะกดมีเสียง ง ชัดเจน — ตำแหน่งเปลี่ยน เสียงเปลี่ยน",
  },
];

/**
 * The liaison rule (연음), which the PDF prints immediately after แม่กง because
 * it is the one place a silent ㅇ stops being silent.
 *
 * When ㅇ opens a syllable and the syllable before it has a 받침, that 받침 slides
 * across into the empty slot. Nothing is spelled differently; only the reading
 * moves. This is why a student who can name all 40 letters still can't read
 * 날을 out loud.
 */
export const LIAISON = {
  rule: "ถ้า ㅇ อยู่ในตำแหน่งพยัญชนะต้น และพยางค์ข้างหน้ามีตัวสะกด จะออกเสียงตัวสะกดนั้นแทน ㅇ",
  written: "날을",
  said: "나를",
  thai: "นารึล",
  gloss: "วัน (+ คำชี้กรรม)",
} as const;

/** A 겹받침 — two different consonants sharing one final slot. */
export interface Cluster {
  /** Progress key */
  key: string;
  /** The cluster as a single Unicode jamo, e.g. "ㄳ" */
  ch: string;
  /** The two letters it is built from */
  parts: [string, string];
  /** Which of the two survives */
  reads: string;
  /** "หน้า" or "หลัง" — the PDF's two-group split */
  side: "หน้า" | "หลัง";
  /** Thai sound of the surviving letter */
  thai: string;
  /** The PDF's example word */
  word: string;
  /** How that word is actually said */
  said: string;
  /** Thai reading of `said` — what the clip will actually sound like */
  saidThai: string;
  gloss: string;
  /**
   * Set where the Thai reading is surprising on its own — currently only ㄺ,
   * whose 닭 opens with a lenis ㄷ and so comes out ท, not ด.
   */
  earNote?: string;
  /** The PDF calls out one exception, on ㄼ */
  exception?: {
    word: string;
    said: string;
    saidThai: string;
    gloss: string;
    note: string;
  };
}

/**
 * Eleven clusters, in the PDF's table order.
 *
 * Only one of the two letters is pronounced, and which one is not guessable
 * from the shape — it has to be memorised. The PDF groups them as
 * ออกเสียงตัวหน้า (8) and ออกเสียงตัวหลัง (3).
 *
 * Note the words here are *not* plain neutralisation: 앉다 → [안따] tenses the
 * ㄷ, and 많다 → [만타] fuses ㅎ into it. That's why each card plays a real
 * recording of both spellings rather than composing the sound itself.
 */
export const CLUSTERS: Cluster[] = [
  // ---- ออกเสียงตัวหน้า (8) ----
  {
    key: "cluster:ㄳ", ch: "ㄳ", parts: ["ㄱ", "ㅅ"], reads: "ㄱ", side: "หน้า", thai: "ก",
    word: "몫", said: "목", saidThai: "มก", gloss: "ส่วนแบ่ง",
  },
  {
    key: "cluster:ㄵ", ch: "ㄵ", parts: ["ㄴ", "ㅈ"], reads: "ㄴ", side: "หน้า", thai: "น",
    word: "앉다", said: "안따", saidThai: "อันตา", gloss: "นั่ง",
  },
  {
    key: "cluster:ㄶ", ch: "ㄶ", parts: ["ㄴ", "ㅎ"], reads: "ㄴ", side: "หน้า", thai: "น",
    word: "많다", said: "만타", saidThai: "มันทา", gloss: "มีมาก",
  },
  {
    key: "cluster:ㄼ", ch: "ㄼ", parts: ["ㄹ", "ㅂ"], reads: "ㄹ", side: "หน้า", thai: "ล",
    word: "여덟", said: "여덜", saidThai: "ยอด็อล", gloss: "แปด",
    exception: {
      word: "밟다", said: "밥따", saidThai: "พับตา", gloss: "เหยียบ",
      note: "ㄼ อ่านตัวหน้า (ㄹ) เกือบทุกคำ ยกเว้น 밟다 ที่อ่านตัวหลัง (ㅂ) — จำเป็นคำ ๆ ไป",
    },
  },
  {
    key: "cluster:ㄽ", ch: "ㄽ", parts: ["ㄹ", "ㅅ"], reads: "ㄹ", side: "หน้า", thai: "ล",
    // เว-กล written solid would read as the Thai cluster กล-, so the syllable
    // break is kept visible. Every other reading here closes cleanly.
    word: "외곬", said: "외골", saidThai: "เว·กล", gloss: "ทางเดียว",
  },
  {
    key: "cluster:ㄾ", ch: "ㄾ", parts: ["ㄹ", "ㅌ"], reads: "ㄹ", side: "หน้า", thai: "ล",
    word: "핥다", said: "할따", saidThai: "ฮัลตา", gloss: "เลีย",
  },
  {
    key: "cluster:ㅀ", ch: "ㅀ", parts: ["ㄹ", "ㅎ"], reads: "ㄹ", side: "หน้า", thai: "ล",
    word: "잃다", said: "일타", saidThai: "อิลทา", gloss: "ทำหาย",
  },
  {
    key: "cluster:ㅄ", ch: "ㅄ", parts: ["ㅂ", "ㅅ"], reads: "ㅂ", side: "หน้า", thai: "บ",
    word: "없다", said: "업따", saidThai: "อ็อบตา", gloss: "ไม่มี",
  },

  // ---- ออกเสียงตัวหลัง (3) ----
  {
    key: "cluster:ㄺ", ch: "ㄺ", parts: ["ㄹ", "ㄱ"], reads: "ㄱ", side: "หลัง", thai: "ก",
    word: "닭", said: "닥", saidThai: "ทัก", gloss: "ไก่",
    // The clip is right and the spelling looks wrong: 닭 starts with a lenis ㄷ,
    // which at the front of a word carries no voicing and reaches a Thai ear as
    // ท. Written 닥, heard ทัก. Without saying so the recording sounds broken.
    earNote: "ㄷ ต้นคำไม่มีเสียงก้อง จึงได้ยินเป็น ท ไม่ใช่ ด — 닭 เขียนว่า ดัก แต่ฟังได้ยินเป็น ทัก (กฎเดียวกับ ㄷ ในด่านพยัญชนะ)",
  },
  {
    key: "cluster:ㄻ", ch: "ㄻ", parts: ["ㄹ", "ㅁ"], reads: "ㅁ", side: "หลัง", thai: "ม",
    word: "삶", said: "삼", saidThai: "ซัม", gloss: "ชีวิต",
  },
  {
    key: "cluster:ㄿ", ch: "ㄿ", parts: ["ㄹ", "ㅍ"], reads: "ㅂ", side: "หลัง", thai: "บ",
    word: "읊다", said: "읍따", saidThai: "อึบตา", gloss: "ท่อง (บทกวี)",
  },
];

/**
 * Every one of the 27 possible finals, mapped to the sound it actually makes.
 *
 * This is the whole of ด่าน 5 and ด่าน 6 as one lookup table, and it is what lets
 * the app play 볶 by reusing 복's recording: they are the same sound, so a
 * separate clip would be a separate file holding identical audio.
 */
export const NEUTRALIZE: Record<string, string> = (() => {
  const map: Record<string, string> = { "": "" };
  for (const g of FINAL_GROUPS) {
    for (const f of g.finals) map[f] = g.sound;
  }
  for (const c of CLUSTERS) map[c.ch] = c.reads;
  return map;
})();

/** Every final the syllable builder can offer, grouped for the picker. */
export const SINGLE_FINALS = FINAL_GROUPS.flatMap((g) => g.finals);
export const CLUSTER_FINALS = CLUSTERS.map((c) => c.ch);
