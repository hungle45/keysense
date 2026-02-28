# Project Research Summary

**Project:** O(1) Piano / KeySense
**Domain:** Real-time pitch detection web app for piano practice
**Researched:** 2026-02-28
**Confidence:** HIGH

## Executive Summary

This is a real-time pitch detection web app designed for piano practice. The core value proposition is microphone-based pitch detection with immediate visual feedback (like a tuner) combined with a practice game loop. Users play notes, see whether they're sharp/flat/in-tune, and can track progress over time.

**Key recommendation:** Build with React 18 + TypeScript + Vite, use pitchy (v4.x) for pitch detection with the McLeod method, and abcjs for notation rendering. The architecture must use AudioWorklet for off-main-thread processing to achieve <30ms latency — critical for real-time feedback. Mobile (especially iOS Safari) is the primary target platform, which introduces significant constraints around AudioContext lifecycle and microphone permissions.

**Primary risks:**
1. **Wrong algorithm** — Autocorrelation fails on piano harmonics; must use YIN or McLeod
2. **iOS Safari** — AudioContext auto-suspends after 30s; requires careful lifecycle handling
3. **Mobile mic quality** — Low-end devices need noise gating and calibration

---

## Key Findings

### Recommended Stack

**Core technologies:**
- **React 18.x** — UI framework, industry standard for interactive audio apps
- **TypeScript 5.x** — Required for audio processing where bugs ruin UX
- **Vite 6.x** — Native ESM support (pitchy v4 requires ESM), fast HMR
- **shadcn/ui** — Mobile-first accessible components (PROJECT.md requirement)
- **pitchy 4.x** — Pure JS pitch detection using McLeod method; ESM-native, TypeScript included. Preferred over aubiojs (WASM overhead) for piano use case
- **abcjs 6.x** — ABC notation rendering, 2.1k stars, actively maintained

**Audio pipeline:**
- Web Audio API (native) — AudioContext, AnalyserNode, getUserMedia
- AudioWorklet recommended for off-main-thread processing

### Expected Features

**Must have (table stakes):**
- Real-time pitch detection — core value, requires <30ms latency
- Visual tuner display — color-coded sharp/flat/in-tune feedback
- Note identification — Hz to musical note conversion (C4, G3, etc.)
- Microphone permission handling — graceful UX for browser security
- Noise floor calibration — essential for real-world environments
- Mobile-friendly UI — target users practice on phones

**Should have (competitive):**
- Practice game loop — timed sessions with random note generation
- Progress tracking — session history, accuracy stats
- ABC notation viewer — practice from sheet music

**Defer (v2+):**
- Rhythm/timing detection — requires complex DSP
- Intonation quality scoring — algorithm development needed
- Sustained pitch history visualization — nice-to-have polish

### Architecture Approach

Four-layer architecture:
1. **Platform Layer** — getUserMedia (microphone), Web Audio API
2. **Audio Engine Layer** — AudioContext → AnalyserNode → PitchDetector
3. **State Layer** — React hooks/Context for audio, pitch, session state
4. **UI Layer** — TunerView, GameView, NotationViewer

**Critical pattern:** AudioContext singleton via useRef (NOT in state). AudioWorklet recommended for processing to avoid blocking UI thread.

### Critical Pitfalls

1. **Wrong pitch algorithm** — Autocorrelation fails on piano harmonics. Use YIN or McLeod (pitchy uses McLeod). Must test on real piano, not sine waves.

2. **iOS Safari AudioContext** — Auto-suspends after 30s, requires user gesture to resume. Initialize on button tap, call resume() on any interaction.

3. **Mobile microphone quality** — Low-end Android has poor frequency response and AGC. Implement noise gating, calibration, and signal quality indicators.

4. **Excessive latency** — Large buffers (4096 samples = 93ms). Use 256-512 samples, AudioWorklet, pre-allocate objects to avoid GC pauses.

5. **No calibration** — Works in quiet rooms, fails in homes with HVAC/traffic. Include pre-session noise floor measurement.

---

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Audio Foundation
**Rationale:** All features depend on working audio capture. Must establish correct architecture before adding features.
**Delivers:** Working microphone input, AudioContext setup, Hz display
**Uses:** React 18, TypeScript, Vite, Web Audio API
**Implements:** useAudioEngine hook, MicrophoneButton component
**Avoids:** Anti-patterns — AudioContext NOT in state, NOT created on page load

### Phase 2: Pitch Detection Core
**Rationale:** The core value proposition. Algorithm selection here determines everything else.
**Delivers:** Real-time pitch detection with note identification, basic tuner display
**Uses:** pitchy 4.x, note-utils (Hz ↔ note conversion)
**Implements:** usePitchDetector hook, TunerView component
**Avoids:** Pitfall — wrong algorithm (must use McLeod/YIN, not autocorrelation); high note detection failures

### Phase 3: Mobile Optimization
**Rationale:** Primary target is mobile; must handle iOS Safari restrictions and low-end device performance.
**Delivers:** Works on iOS Safari, noise floor calibration, signal quality indicators
**Uses:** AudioWorklet (if needed), calibration hooks
**Implements:** useCalibration hook, iOS-specific handling
**Avoids:** Pitfalls — iOS AudioContext suspension, mobile mic quality, latency >30ms

### Phase 4: Game Loop
**Rationale:** Differentiator from simple tuners. Builds on working pitch detection.
**Delivers:** 1-minute practice sessions, random note targets, scoring
**Uses:** useSession hook, game state management
**Implements:** GameView, SessionTimer, ScoreDisplay
**Avoids:** Pitfall — unstable readings (add confidence thresholds, stability requirements)

### Phase 5: Progress & Notation
**Rationale:** These are v2 features; add after validating core engagement.
**Delivers:** Session history, progress stats, ABC notation viewer
**Uses:** abcjs, local storage or backend for persistence

### Phase Ordering Rationale

- Phase 1 → 2 → 3 → 4 → 5 follows architectural dependencies (audio → detection → mobile → game → polish)
- Mobile optimization (Phase 3) must happen before launch — primary platform
- Game loop (Phase 4) requires stable pitch detection — must follow Phase 2+3
- Progress tracking enhances game loop — follows naturally

### Research Flags

**Needs research during planning:**
- **Phase 3 (Mobile Optimization):** iOS Safari has undocumented behaviors; may need /gsd-research-phase for edge cases
- **Phase 5 (Progress):** Local storage vs backend tradeoffs for session history

**Standard patterns (skip research):**
- **Phase 1-2:** Well-documented Web Audio API patterns, pitchy has clear docs
- **Phase 4:** Game state patterns are standard React

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | pitchy, abcjs have clear documentation; Web Audio API is browser standard |
| Features | HIGH | Clear competitive analysis, well-understood domain from tuner apps |
| Architecture | HIGH | Standard patterns from Web Audio docs, pitch detector tutorials |
| Pitfalls | MEDIUM | Multiple sources agree on iOS/mobile issues; algorithm guidance clear |

**Overall confidence:** HIGH

### Gaps to Address

- **Algorithm benchmark:** pitchy uses McLeod; YIN may be more accurate for piano. Need side-by-side testing on real piano recordings during Phase 2.
- **Latency targets:** Research suggests <30ms target, but no concrete benchmarks for mobile. Measure during Phase 3.
- **AudioWorklet complexity:** May add significant overhead; evaluate if simple approach suffices before migrating.

---

## Sources

### Primary (HIGH confidence)
- [pitchy GitHub](https://github.com/ianprime0509/pitchy) — ESM-only, McLeod Pitch Method
- [abcjs GitHub](https://github.com/paulrosen/abcjs) — 2.1k stars, actively maintained
- [Web Audio API Best Practices (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — Official documentation

### Secondary (MEDIUM confidence)
- [PitchDetector.com](https://pitchdetector.com) — Algorithm comparisons, troubleshooting
- [Tunable, PianoMeter, Perfect Ear] — Competitor feature analysis
- [iOS Safari microphone Stack Overflow](https://stackoverflow.com/questions/77992521) — iOS-specific handling

### Tertiary (LOW confidence)
- [Tuneo - React Native pitch detection](https://github.com/DonBraul/tuneo) — Native module reference (future consideration)

---
*Research completed: 2026-02-28*
*Ready for roadmap: yes*
