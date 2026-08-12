# Hangul Melon · 한글 멜론

A Korean-alphabet trainer for Thai-speaking beginners. Next.js App Router, deployed on Vercel.

All 40 letters (19 consonants + 21 vowels), taught in **derivation order** rather than
dictionary order, with pre-rendered native-quality audio for every letter and syllable.

```bash
npm install
npm run dev          # http://localhost:3000
```

The app runs immediately without audio files — it falls back to the browser's speech
synthesis. See [Audio](#audio) to generate the real clips.

---

## Why the letters are in this order

Dictionary order is `ㄱ ㄲ ㄴ ㄷ ㄸ ㄹ ㅁ ㅂ ㅃ ㅅ ㅆ ㅇ ㅈ ㅉ ㅊ ㅋ ㅌ ㅍ ㅎ`. That order is
useless for a beginner: it puts the tense `ㄲ` second, before the student has any reason to
know what `ㄱ` is, and it separates `ㄱ` from `ㅋ` even though `ㅋ` is literally `ㄱ` with one
more stroke.

Hangul was designed in 1443 as a **derivation system**:

- Five consonant shapes copied from the speech organs — `ㄱ ㄴ ㅁ ㅅ ㅇ`
- Three vowel strokes — a dot (sky), a horizontal line (earth), a vertical line (person)
- Two transformations — **add a stroke = add a puff of air**, **double the letter = tense it**

This app teaches that structure directly, in 8 stages, alternating consonants and vowels so
the student can read real syllables from stage 2 onward:

| Stage | Letters | The one rule it adds |
|---|---|---|
| 1 | `ㄱ ㄴ ㅁ ㅅ ㅇ` | The five base shapes. Everything else grows from these. |
| 2 | `ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ` | Vertical vowels sit right of the consonant, horizontal ones below. **Student can now read 가 나 마 사 아.** |
| 3 | `ㄷ ㄹ ㅂ ㅈ` | One extra stroke on a stage-1 shape. Completes the 9 plain consonants. |
| 4 | `ㅑ ㅕ ㅛ ㅠ` | Two strokes instead of one = prepend a *y*. No exceptions. |
| 5 | `ㅋ ㅌ ㅍ ㅊ ㅎ` | Aspirated: `ㄱ→ㅋ`, `ㄷ→ㅌ`, `ㅂ→ㅍ`, `ㅈ→ㅊ`. Hold paper to your mouth; it should move. |
| 6 | `ㅐ ㅔ ㅒ ㅖ` | Base vowel + `ㅣ`. (Modern speakers barely distinguish `ㅐ`/`ㅔ` — spelling matters, pronunciation doesn't.) |
| 7 | `ㄲ ㄸ ㅃ ㅆ ㅉ` | Doubled = tense. Opposite of stage 5: throat tightens, **no** air. |
| 8 | `ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ` | `ㅗ`/`ㅜ` in front = a *w* glide. `ㅙ ㅚ ㅞ` are all the same sound in practice. |

Each stage counts consonants and vowels that a student can actually *combine*, so the
Syllable Builder is useful from day one instead of day thirty.

The order lives in `STAGES` in [`src/data/hangul.ts`](src/data/hangul.ts) — reorder that
array and the whole app (home path, flashcard deck, builder pickers, quiz pool) follows.

---

## Audio

### Where to get clear Korean audio for beginners

Ranked for a *teaching* product, where consistency matters more than variety:

**1. Neural TTS, rendered once at build time — what this project uses.**

| Service | Korean voices | Cost | Notes |
|---|---|---|---|
| **Google Cloud TTS** | `ko-KR-Neural2-A/C`, `Chirp3-HD-*`, `Wavenet-*` | 1M chars/month free, then ~$16/1M | API key only, no SDK. Default here. Our full run is ~1,500 characters — free forever in practice. |
| **Azure AI Speech** | `ko-KR-SunHiNeural`, `ko-KR-InJoonNeural`, ~10 more | 500k chars/month free | Best prosody control via SSML; can slow individual syllables. |
| **Amazon Polly** | `Seoyeon` (neural) | 1M chars/month free for 12 months | Fewer Korean voices. |
| **ElevenLabs** | `eleven_multilingual_v2` with any voice | Free tier ~10k chars/month | Most natural, but a non-Korean voice will carry an accent — pick a Korean one. |

Why this wins for beginners: **the same voice every single time**. A student learning `ㅅ` vs
`ㅆ` needs to hear the contrast in one voice, not one clip from a Seoul man and the next from
a Busan woman. Rendered files also work offline, cost nothing at runtime, and can't fail
mid-lesson.

**2. Free native-speaker recordings** — real humans, patchy coverage:

- **Wikimedia Commons** — search `Korean pronunciation` / `ko-가.ogg`. CC-licensed, attribution
  required, coverage is incomplete across all 40 letters.
- **Forvo** (forvo.com) — largest crowd-sourced pronunciation library; multiple speakers per
  word. Free to listen, but the API is paid and redistribution needs a licence.
- **National Institute of Korean Language (국립국어원)** — the official standard-pronunciation
  reference. Authoritative, but not packaged for direct app use.

Good as a *supplement* (e.g. an "hear a real person" toggle), risky as the primary source:
inconsistent volume, room noise, and speaking rate are exactly what a beginner can't filter out.

**3. Browser `speechSynthesis`** — free, zero setup, and the fallback in this app. Do not rely
on it: Windows Chrome frequently has **no Korean voice installed at all**, in which case a tap
produces silence with no error. macOS/iOS and Android are fine. This is a safety net, not a plan.

### The thing that actually breaks beginner audio

**Never send a bare jamo (`ㄱ`, `ㅏ`) to a TTS engine.** They're standalone Unicode symbols, not
words. Engines read them inconsistently, spell them out in the wrong language, or skip them
silently. Always send something pronounceable:

- the **letter name** — `기역`, `니은`, `쌍비읍`
- a **real syllable** — `가`, `나`, `빠`

Every card in this app has both, and shows them as two separate buttons — because "what is
this letter called" and "what sound does it make in a word" are two different facts that
beginners constantly conflate. `ㅇ` is the sharpest example: its name is `이응`, and at the
start of a syllable it makes *no sound at all*.

Clips are also rendered at **rate 0.85**, not native speed.

### Generating the clips

```bash
cp .env.example .env    # then fill in GOOGLE_TTS_API_KEY
npm run audio
```

That writes 478 MP3s (~7 MB) into `public/audio/`:

| Folder | Count | Contents |
|---|---|---|
| `name/` | 40 | Letter names — `기역`, `아`, … |
| `sound/` | 39 | Demo syllables — `가`, `나`, … |
| `syl/` | 399 | Every consonant + vowel pair, `가` through `히` |

Plus `manifest.json`, which tells the client which clips exist so a missing one falls back to
`speechSynthesis` instead of firing a 404 on every tap.

**Commit `public/audio/`.** The deployed site then needs no API key and makes no runtime TTS
calls — the key is a build-time-only secret that never reaches Vercel.

Other flags:

```bash
npm run audio -- --dry       # list what would be generated, call nothing
npm run audio -- --finals    # also render all 2,793 syllables with a final consonant (~45 MB)
```

Without `--finals`, builder syllables that have a final consonant (`감`, `밥`) fall back to
`speechSynthesis`. Re-running skips files that already exist, so adding a letter only
generates the new clips.

To switch provider, set `TTS_PROVIDER=azure` or `elevenlabs` in `.env` — see `.env.example`.

---

## Deploying to Vercel

1. Push the repo to GitHub (**including `public/audio/`**).
2. On [vercel.com/new](https://vercel.com/new), import it. Framework preset **Next.js** is
   detected automatically; no build settings to change.
3. **Set no environment variables.** The TTS keys are build-time only and live on your machine.

Or from the CLI:

```bash
npx vercel --prod
```

Every page is statically prerendered, so this runs on the Hobby tier with no serverless
invocations.

---

## Project structure

```
src/
  app/
    layout.tsx           fonts (next/font, self-hosted), metadata
    page.tsx             renders <App/>
    globals.css          keyframes, hover states, reduced-motion
  components/
    App.tsx              screen state
    Header.tsx           streak + letters-learned counters
    Nav.tsx              bottom tab bar
    HomeScreen.tsx       progress + the 8-stage path
    CardsScreen.tsx      flashcards, stage chips, stroke order, the two audio buttons
    BuilderScreen.tsx    initial + vowel + final → live syllable
    PlayScreen.tsx       match game, listen-and-choose game
    SpeakerButton.tsx
    theme.ts             design tokens from the source design
  data/
    hangul.ts            all 40 letters, STAGES, Unicode syllable composition
    pronunciations.json  what the TTS says — read by both the app and the audio script
  lib/
    audio.ts             MP3 first, speechSynthesis fallback
    progress.ts          localStorage: learned letters + daily streak
scripts/
  generate-audio.mjs     build-time TTS renderer (google | azure | elevenlabs)
```

`pronunciations.json` is deliberately the single source of truth for spoken text: the React app
and the Node generator both read it, so a clip can never drift from the letter it belongs to.

## Notes

- Progress is `localStorage` only — no accounts, no backend. Clearing site data resets it.
- Korean glyphs render in Gowun Dodum with Noto Sans KR as fallback; Thai in Noto Sans Thai;
  Latin in Nunito. All self-hosted via `next/font`, so no external font requests.
- Quiz games only draw from letters the student has already opened (until they've opened 5,
  the pool is the first ten of the teaching order) — a beginner never gets ambushed by `ㅢ`.
