# Stack Research

**Domain:** Real-time pitch detection web app (O(1) Piano / KeySense)
**Researched:** 2026-02-28
**Confidence:** HIGH

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|----------------|
| React | 18.x | UI framework | Industry standard for interactive web apps; excellent ecosystem for audio visualization |
| TypeScript | 5.x | Type safety | Critical for audio processing where bugs cause poor user experience |
| Vite | 6.x | Build tool | Fast HMR, native ESM support (required for pitchy v4), optimized production builds |
| shadcn/ui | latest | UI components | Mobile-first, accessible, composable - matches PROJECT.md requirement |

### Pitch Detection

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|----------------|
| pitchy | 4.x | Pitch detection algorithm | Pure JS, McLeod Pitch Method (accurate for monophonic instruments like piano), ESM-native, TypeScript included, 100+ GitHub stars. Active maintenance (v4.1.0 Jan 2024). |
| Web Audio API | native | Microphone input & audio analysis | Browser-native, no dependencies, required for real-time audio capture |

**Why pitchy over alternatives:**
- **vs aubiojs**: aubio uses WASM (larger bundle, more complex), pitchy is pure JS (smaller, simpler for piano use case)
- **vs @milcktoast/pitch-detector**: pitchy has clearer API, TypeScript support, and active maintenance
- **vs pitch-analyser**: pitch-analyser is older (2020), less maintained, wraps Web Audio less transparently

### Music Notation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|----------------|
| abcjs | 6.x | ABC notation rendering | Industry standard (2.1k stars), actively maintained (v6.6.0 Jan 2026), full TypeScript support. Matches PROJECT.md requirement for ABC notation |

**Why NOT use react-abc or react-abcjs wrappers:**
- Both are unmaintained (last update 2018 and 2021)
- abcjs is self-contained; wrappers add unnecessary dependency
- Use direct import: `import { renderAbc } from 'abcjs'`

### Audio Processing Architecture

| Technology | Purpose | Implementation |
|------------|---------|----------------|
| getUserMedia | Microphone access | `navigator.mediaDevices.getUserMedia({ audio: true })` |
| AudioContext | Audio processing pipeline | Create once, resume on user interaction |
| AnalyserNode | FFT data for visualization | Get time-domain data for pitch detection |
| MediaStreamAudioSourceNode | Connect mic to pipeline | `audioContext.createMediaStreamSource(stream)` |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @chordbook/tuner | latest | Reference implementation | Useful for pattern reference; not required but good for learning |
| tone | 15.x | Audio timing/scheduling | For rhythm module (BPM tracking) if needed |
| usehooks-ts | latest | React hooks | For microphone permission handling |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint + TypeScript | Linting | Essential for catching audio API misuse |
| Prettier | Formatting | Standard config |
| Vitest | Testing | Vite-native, fast |

## Installation

```bash
# Core
npm install react react-dom
npm install -D vite @vitejs/plugin-react typescript

# Pitch detection
npm install pitchy

# Music notation
npm install abcjs

# UI components (shadcn/ui)
npx shadcn@latest init

# Utilities
npm install usehooks-ts
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| pitchy 4.x | aubiojs | Need tempo detection, or need most accurate pitch for polyphonic audio |
| abcjs 6.x | VexFlow | Need traditional staff notation (not ABC), willing to accept higher complexity |
| React 18 | Preact | Extreme bundle size constraints (rare for this use case) |
| Vite 6 | Webpack 5 | Need legacy plugin ecosystem (uncommon for new projects) |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| ScriptProcessorNode | Deprecated, being removed from browsers | AudioWorklet (or use libraries like pitchy that abstract this) |
| react-abcjs wrapper | Unmaintained (v0.1.3), adds no value over direct abcjs import | Direct `abcjs` import |
| react-abc wrapper | Unmaintained (v0.4.0 from 2018) | Direct `abcjs` import |
| pitch-analyser | Older, less maintained, wraps too much | pitchy + custom Web Audio setup |
| Canvas API (raw) | Complex for waveforms | Use AnalyserNode with requestAnimationFrame |

## Stack Patterns by Variant

**If targeting React Native (future):**
- Use `@rnheroes/react-native-pitchy` (native C++ pitch detection via TurboModules)
- Use Expo for native module development

**If needing audio playback:**
- Use Tone.js for scheduling and synthesis
- abcjs has built-in MIDI playback support

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| pitchy@4 | Vite 5+, React 18+, ESM projects | ESM-only; requires build tool with ESM support |
| abcjs@6 | React 16.8+, all modern browsers | CommonJS and ESM builds available |
| Vite 6 | Node 18+, all modern browsers | Required for HMR with ESM libraries |

## Sources

- [pitchy GitHub](https://github.com/ianprime0509/pitchy) — ESM-only, McLeod Pitch Method
- [abcjs GitHub](https://github.com/paulrosen/abcjs) — 2.1k stars, actively maintained
- [Web Audio API Best Practices (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — Official documentation
- [@chordbook/tuner](https://github.com/chordbook/tuner) — Reference implementation using pitchy
- [Tuneo - Real-time pitch detection with React Native](https://github.com/DonBraul/tuneo) — Native module architecture reference

**Confidence:**
- Pitch detection libraries: HIGH (multiple sources, active maintenance)
- Web Audio API: HIGH (browser standard)
- abcjs: HIGH (2.1k stars, latest version Jan 2026)
- shadcn/ui: HIGH (PROJECT.md requirement)

---
*Stack research for: Real-time pitch detection web app*
*Researched: 2026-02-28*
