"use client";

/**
 * Two-tier audio.
 *
 * Tier 1 — pre-generated MP3s in /public/audio, made once by
 * `npm run audio` with a Korean neural TTS voice. Same voice every time,
 * works offline, no runtime API cost. This is what students should hear.
 *
 * Tier 2 — the browser's own speechSynthesis, used only when a clip is
 * missing (e.g. audio was never generated, or a syllable with a final
 * consonant that wasn't pre-rendered). Quality varies a lot by device and
 * some Windows installs have no Korean voice at all, so it is a safety net,
 * never the plan.
 */

export type AudioBucket = "name" | "sound" | "syl" | "word";

const hex = (s: string) =>
  Array.from(s)
    .map((c) => c.codePointAt(0)!.toString(16))
    .join("-");

export const audioKey = (bucket: AudioBucket, text: string) => `${bucket}/${hex(text)}`;

/**
 * Alternate recordings of the same text, if `npm run audio` was run with more
 * than one voice: `name/d55c-v2`, `-v3`, and so on beside the plain key.
 *
 * Training a sound against a single recording teaches the recording. The
 * classic demonstration is Logan, Lively and Pisoni on /r/ and /l/: learners
 * trained on many speakers came to hear the contrast and carried it to words
 * they had never been drilled on, while single-speaker training did not
 * transfer. ㅎ against ㅋ is the same problem, so the questions that ask which
 * letter this is pick a voice at random from whatever exists.
 */
const VARIANTS = 4;
const audioUrl = (key: string) => `/audio/${key}.mp3`;

let manifest: Set<string> | null = null;
let manifestPromise: Promise<Set<string>> | null = null;

function loadManifest(): Promise<Set<string>> {
  if (manifestPromise) return manifestPromise;
  // `no-store` bypasses the HTTP cache entirely. Necessary because a client
  // that loaded the site before the clips existed may hold a long-lived cached
  // copy of an empty manifest, which would silently strand it on the
  // speechSynthesis fallback forever.
  manifestPromise = fetch("/audio/manifest.json", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : { keys: [] }))
    .then((j: { keys?: string[] }) => new Set(j.keys ?? []))
    .catch(() => new Set<string>())
    .then((s) => {
      manifest = s;
      return s;
    });
  return manifestPromise;
}

/** Warm the manifest so the very first tap doesn't wait on a round-trip. */
export function prefetchManifest() {
  void loadManifest();
}

const cache = new Map<string, HTMLAudioElement>();
let current: HTMLAudioElement | null = null;

function playFile(key: string): Promise<void> {
  let el = cache.get(key);
  if (!el) {
    el = new Audio(audioUrl(key));
    el.preload = "auto";
    cache.set(key, el);
  }
  if (current && current !== el) {
    current.pause();
    current.currentTime = 0;
  }
  current = el;
  el.currentTime = 0;
  return el.play();
}

let koVoice: SpeechSynthesisVoice | null = null;

function pickKoreanVoice(): SpeechSynthesisVoice | null {
  if (koVoice) return koVoice;
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  koVoice = voices.find((v) => (v.lang || "").toLowerCase().startsWith("ko")) ?? null;
  return koVoice;
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  // Chrome populates the voice list asynchronously.
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    koVoice = null;
    pickKoreanVoice();
  });
}

function speakFallback(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 0.8;
    const v = pickKoreanVoice();
    if (v) u.voice = v;
    synth.speak(u);
  } catch {
    /* no speech support — stay silent rather than throw */
  }
}

/**
 * Speak Korean text. `bucket` selects which pre-generated folder to look in.
 *
 * Note the text passed here is always a *pronounceable* string — a letter name
 * (기역) or a syllable (가) — never a bare jamo like "ㄱ". TTS engines read bare
 * jamo inconsistently or skip them entirely.
 */
export async function speakKo(
  text: string,
  bucket: AudioBucket,
  options: { vary?: boolean } = {},
): Promise<void> {
  if (!text) return;
  const base = audioKey(bucket, text);
  const have = manifest ?? (await loadManifest());

  let key = base;
  if (options.vary) {
    const choices = [base];
    for (let n = 2; n <= VARIANTS; n++) {
      const alt = `${base}-v${n}`;
      if (have.has(alt)) choices.push(alt);
    }
    key = choices[Math.floor(Math.random() * choices.length)];
  }

  if (have.has(key)) {
    try {
      await playFile(key);
      return;
    } catch {
      /* autoplay blocked or decode failed — drop through */
    }
  }
  speakFallback(text);
}

export function stopAudio() {
  if (current) {
    current.pause();
    current.currentTime = 0;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
