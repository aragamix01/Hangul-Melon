#!/usr/bin/env node
/**
 * Pre-render every Korean clip the app needs into public/audio as MP3.
 *
 *   npm run audio            # 40 letter names + 40 demo syllables + 399 CV syllables
 *   npm run audio -- --finals   # ...plus every CV+final syllable (2,793 more)
 *   npm run audio -- --dry      # list what would be generated, call nothing
 *
 * Run this once, commit public/audio, and the deployed site needs no API key
 * and makes no runtime TTS calls. Existing files are skipped, so re-running
 * after adding letters only generates the new ones.
 *
 * Providers: google (default) | azure | elevenlabs — see .env.example.
 */

import { mkdir, readFile, readdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "audio");

const args = process.argv.slice(2);
const WITH_FINALS = args.includes("--finals");
const DRY = args.includes("--dry");

// --- .env loading (no dependency; Node 20.6+ also supports --env-file) -------
async function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    try {
      const text = await readFile(join(ROOT, name), "utf8");
      for (const line of text.split(/\r?\n/)) {
        const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
        if (!m) continue;
        const value = m[2].replace(/^["']|["']$/g, "");
        if (!(m[1] in process.env)) process.env[m[1]] = value;
      }
    } catch {
      /* file absent — fine */
    }
  }
}

// --- Hangul composition, mirrored from src/data/hangul.ts --------------------
const INITIAL_ORDER = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const MEDIAL_ORDER = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
const FINAL_INDEX = { "": 0, "ㄱ": 1, "ㄴ": 4, "ㄷ": 7, "ㄹ": 8, "ㅁ": 16, "ㅂ": 17, "ㅇ": 21 };

const compose = (i, m, f = "") =>
  String.fromCharCode(
    0xac00 + (INITIAL_ORDER.indexOf(i) * 21 + MEDIAL_ORDER.indexOf(m)) * 28 + (FINAL_INDEX[f] ?? 0),
  );

const hex = (s) => Array.from(s).map((c) => c.codePointAt(0).toString(16)).join("-");

/** Must match AudioBucket in src/lib/audio.ts. */
const BUCKETS = ["name", "sound", "syl", "word"];

// --- Build the job list -----------------------------------------------------
async function buildJobs() {
  const raw = await readFile(join(ROOT, "src", "data", "pronunciations.json"), "utf8");
  const { letters, words = [] } = JSON.parse(raw);

  /** @type {Map<string, {bucket: string, text: string}>} */
  const jobs = new Map();
  const add = (bucket, text) => {
    if (!text) return;
    jobs.set(`${bucket}/${hex(text)}`, { bucket, text });
  };

  for (const [, p] of Object.entries(letters)) {
    add("name", p.nameKo);
    add("sound", p.demo);
  }

  for (const w of words) add("word", w);

  const finals = WITH_FINALS ? Object.keys(FINAL_INDEX) : [""];
  for (const i of INITIAL_ORDER) {
    for (const m of MEDIAL_ORDER) {
      for (const f of finals) add("syl", compose(i, m, f));
    }
  }

  return jobs;
}

// --- Providers --------------------------------------------------------------
// Every provider returns a Buffer of MP3 bytes. Rate is slowed to ~0.85 —
// a beginner needs to hear the whole syllable, not a native-speed blur.
const RATE = 0.85;

const providers = {
  async google(text) {
    const key = requireEnv("GOOGLE_TTS_API_KEY");
    const voice = process.env.GOOGLE_TTS_VOICE || "ko-KR-Neural2-A";
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: "ko-KR", name: voice },
          audioConfig: { audioEncoding: "MP3", speakingRate: RATE, sampleRateHertz: 24000 },
        }),
      },
    );
    if (!res.ok) throw await httpError(res);
    const { audioContent } = await res.json();
    return Buffer.from(audioContent, "base64");
  },

  async azure(text) {
    const key = requireEnv("AZURE_SPEECH_KEY");
    const region = requireEnv("AZURE_SPEECH_REGION");
    const voice = process.env.AZURE_TTS_VOICE || "ko-KR-SunHiNeural";
    const ssml =
      `<speak version="1.0" xml:lang="ko-KR">` +
      `<voice name="${voice}"><prosody rate="${Math.round((RATE - 1) * 100)}%">` +
      escapeXml(text) +
      `</prosody></voice></speak>`;
    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "hangul-melon",
      },
      body: ssml,
    });
    if (!res.ok) throw await httpError(res);
    return Buffer.from(await res.arrayBuffer());
  },

  async elevenlabs(text) {
    const key = requireEnv("ELEVENLABS_API_KEY");
    const voiceId = requireEnv("ELEVENLABS_VOICE_ID");
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.6, similarity_boost: 0.8 },
      }),
    });
    if (!res.ok) throw await httpError(res);
    return Buffer.from(await res.arrayBuffer());
  },
};

class HttpError extends Error {
  constructor(status, body, retryAfter) {
    super(`HTTP ${status}: ${body.slice(0, 300)}`);
    this.status = status;
    /** Seconds, from the Retry-After header when the server sends one. */
    this.retryAfter = retryAfter;
  }
}

/** Build an HttpError from a failed response, preserving Retry-After. */
async function httpError(res) {
  const raw = res.headers.get("retry-after");
  const secs = raw && /^\d+$/.test(raw) ? Number(raw) : undefined;
  return new HttpError(res.status, await res.text(), secs);
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`${name} is not set. Copy .env.example to .env and fill it in.`);
  }
  return v;
}

const escapeXml = (s) =>
  s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

const exists = (p) => access(p, constants.F_OK).then(() => true, () => false);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MAX_ATTEMPTS = 8;

async function withRetry(fn, label) {
  let delay = 1000;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const rateLimited = err instanceof HttpError && err.status === 429;
      const retryable = err instanceof HttpError ? rateLimited || err.status >= 500 : true;
      if (!retryable || attempt === MAX_ATTEMPTS) throw new Error(`${label}: ${err.message}`);

      // A 429 here is usually a *per-minute* quota. Exponential backoff from
      // one second tops out around 15s of waiting, which expires well before
      // the window resets — so rate limits get their own floor.
      const wait = rateLimited
        ? Math.max((err.retryAfter ?? 0) * 1000, 20_000 + Math.random() * 10_000)
        : delay;
      await sleep(wait);
      delay *= 2;
    }
  }
}

// --- Main -------------------------------------------------------------------
async function main() {
  await loadEnv();

  const providerName = (process.env.TTS_PROVIDER || "google").toLowerCase();
  const synth = providers[providerName];
  if (!synth) {
    throw new Error(
      `Unknown TTS_PROVIDER "${providerName}". Use one of: ${Object.keys(providers).join(", ")}`,
    );
  }

  const jobs = await buildJobs();

  const todo = [];
  for (const [key, job] of jobs) {
    if (await exists(join(OUT, `${key}.mp3`))) continue;
    todo.push([key, job]);
  }

  console.log(
    `provider=${providerName}  total=${jobs.size}  already-present=${jobs.size - todo.length}  to-generate=${todo.length}`,
  );

  if (DRY) {
    for (const [key, job] of todo.slice(0, 20)) console.log(`  ${key}  ← "${job.text}"`);
    if (todo.length > 20) console.log(`  … and ${todo.length - 20} more`);
    return;
  }

  for (const bucket of BUCKETS) {
    await mkdir(join(OUT, bucket), { recursive: true });
  }

  // Modest concurrency: enough to finish 400 clips in ~a minute, low enough
  // that free-tier quotas don't start returning 429.
  const CONCURRENCY = 4;
  let done = 0;
  let failed = 0;

  const queue = todo.slice();
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    for (;;) {
      const item = queue.shift();
      if (!item) return;
      const [key, job] = item;
      try {
        const buf = await withRetry(() => synth(job.text), key);
        await writeFile(join(OUT, `${key}.mp3`), buf);
      } catch (err) {
        failed++;
        console.error(`  ✗ ${key} ("${job.text}") — ${err.message}`);
        continue;
      }
      done++;
      if (done % 25 === 0) console.log(`  … ${done}/${todo.length}`);
    }
  });
  await Promise.all(workers);

  // The manifest tells the client which clips exist, so a missing one falls
  // back to speechSynthesis instead of firing a 404 on every tap.
  //
  // Built from what is actually on disk, not from this run's job list: a run
  // without --finals asks for a small fraction of the library, and listing only
  // those would silently un-publish every clip the flag generates — the files
  // stay put, the app just stops believing in them.
  const present = [];
  for (const bucket of BUCKETS) {
    let names = [];
    try {
      names = await readdir(join(OUT, bucket));
    } catch {
      continue; // bucket never generated
    }
    for (const name of names) {
      if (name.endsWith(".mp3")) present.push(`${bucket}/${name.slice(0, -4)}`);
    }
  }
  present.sort();
  await writeFile(
    join(OUT, "manifest.json"),
    JSON.stringify({ generated: new Date().toISOString(), keys: present }),
  );

  console.log(`generated=${done}  failed=${failed}  manifest=${present.length} clips`);
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
