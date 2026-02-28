# Feature Research

**Domain:** Pitch Detection Music Practice Apps
**Researched:** 2026-02-28
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Real-time pitch detection | Core value proposition - users open app expecting to see their pitch detected | HIGH | Requires Web Audio API, pitch detection algorithm (YIN/autocorrelation), 30-50ms latency target |
| Visual tuner display | Immediate feedback on whether pitch is sharp/flat/in-tune | MEDIUM | Need cents deviation (-50 to +50), color coding (red=sharp, green=in-tune, blue=flat) |
| Note identification | Users need to know which note they're playing (C4, G3, etc.) | LOW | Map Hz to note names using equal temperament |
| Microphone permission handling | Browser security requires explicit permission | LOW | Graceful degradation when denied, clear user messaging |
| Sensitivity calibration | Ambient noise affects accuracy | MEDIUM | Measure noise floor, allow user to set detection threshold |
| Mobile-friendly UI | Target users practice on phones | MEDIUM | Touch-friendly, responsive, works in portrait |
| Reference pitch (A4) setting | Tuners vary (440 vs 442 Hz) | LOW | Default 440Hz, allow adjustment |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Practice game loop | Transforms practice into engaging sessions, not just passive monitoring | MEDIUM | Timed sessions (1min, 5min), random note generation, scoring |
| Progress tracking | Motivation through visible improvement, practice streaks | MEDIUM | Session history, accuracy stats, daily streaks |
| Rhythm/timing detection | Extends value beyond pitch to overall musicianship | HIGH | Requires onset detection, BPM tracking |
| ABC notation rendering | Allows practice from sheet music | MEDIUM | Use abcjs library, parse and display music notation |
| Sustained pitch history | Visualizes pitch stability over time (like Tunable's "white line") | MEDIUM | Graph showing pitch variance during note sustain |
| Adaptive difficulty | Keeps challenge appropriate to skill level | MEDIUM | Track accuracy, adjust note complexity |
| Session goals | Provides structure to practice (scales, arpeggios, pieces) | MEDIUM | Predefined or custom practice routines |
| Intonation quality scoring | Go beyond sharp/flat to rate overall musicianship | HIGH | Consider pitch stability, vibrato detection |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| MIDI input support | Professional musicians have MIDI keyboards | Adds hardware dependency, contradicts "microphone-only" core value | Focus on improving microphone detection accuracy |
| Real-time multiplayer | Social practice, duets | High latency, complexity, sync issues | Keep single-player focused |
| Audio playback/synthesis | Users want to hear correct notes | Patent/licensing issues, audio output latency | Display visual reference only |
| Complex social features | Leaderboards, sharing, comments | Distracts from core practice value, privacy concerns | Simple progress tracking only |
| Autoscroll sheet music | Seamless page turning | Technically complex, distracts from pitch detection | ABC notation viewer with manual navigation |
| Recording/playback | Users want to review their practice | Storage, privacy, feature bloat | Keep focused on real-time feedback |

## Feature Dependencies

```
Pitch Detection Engine
    └──requires──> Noise Floor Calibration
    └──requires──> Microphone Access

Game Loop
    └──requires──> Pitch Detection Engine
    └──requires──> Note Display
    └──enhances──> Progress Tracking

Rhythm Module
    └──requires──> Pitch Detection Engine
    └──conflicts──> Pitch Detection Engine (at high BPM due to processing limits)

Notation Viewer
    └──independent──> Can be added without pitch detection

Progress Tracking
    └──enhances──> Game Loop
```

### Dependency Notes

- **Pitch Detection requires Noise Floor Calibration:** Ambient room noise causes false positives; must measure before detecting
- **Game Loop enhances Progress Tracking:** Sessions generate data that progress tracking visualizes
- **Rhythm conflicts with Pitch Detection:** Both use audio processing; running simultaneously at high BPM may cause latency issues. Consider sequential modes.
- **Notation Viewer is independent:** Can function without pitch detection - useful for sight-reading practice

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Real-time pitch detection — core value, must work reliably
- [ ] Visual tuner display — instant feedback on pitch accuracy
- [ ] Note identification — show musical note name + octave
- [ ] Microphone permission handling — graceful UX for browser security
- [ ] Noise floor calibration — ensure detection works in user's environment
- [ ] Basic game loop (1-min session) — validate practice concept

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Progress tracking — trigger: users complete 3+ sessions
- [ ] 5-minute session mode — trigger: 1-min sessions show engagement
- [ ] ABC notation viewer — trigger: users request sheet music support
- [ ] Adaptive difficulty — trigger: enough data to analyze skill levels

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Rhythm/timing detection — requires significant DSP research
- [ ] Sustained pitch history visualization — nice-to-have polish
- [ ] Intonation quality scoring — complex algorithm development

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Real-time pitch detection | HIGH | HIGH | P1 |
| Visual tuner display | HIGH | MEDIUM | P1 |
| Note identification | HIGH | LOW | P1 |
| Noise floor calibration | HIGH | MEDIUM | P1 |
| Microphone permission handling | HIGH | LOW | P1 |
| Mobile-friendly UI | HIGH | MEDIUM | P1 |
| Basic game loop (1-min) | HIGH | MEDIUM | P1 |
| Progress tracking | MEDIUM | MEDIUM | P2 |
| 5-minute session mode | MEDIUM | LOW | P2 |
| ABC notation viewer | MEDIUM | MEDIUM | P2 |
| Adaptive difficulty | MEDIUM | MEDIUM | P3 |
| Rhythm/timing detection | MEDIUM | HIGH | P3 |
| Sustained pitch history | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Tunable | PianoMeter | Perfect Ear | Our Approach |
|---------|---------|------------|-------------|--------------|
| Real-time pitch detection | Yes | Yes | Yes | Yes - core |
| Visual feedback | Yes ( Sustained Pitch History) | Yes | Yes | Yes - simpler display |
| Practice game mode | No | No | Yes (exercises) | Yes - timed sessions |
| Progress tracking | Yes (practice habits) | No | Yes | Yes - session stats |
| Metronome | Yes | No | Yes | Out of scope |
| Sheet music | No | No | Yes | ABC notation viewer |
| Noise calibration | Yes (Concert A) | Yes | No | Yes - noise floor |
| Rhythm detection | Yes | No | Yes | Future |

**Key insight:** Most competitors are either:
1. Tuners (Tunable, PianoMeter) - focused on tuning, not practice
2. Ear training apps (Perfect Ear) - exercises but no microphone practice
3. Full piano learning apps (Skoove, Playground) - require MIDI or are full courses

**Our opportunity:** No direct competitor combines microphone-only pitch detection + practice game loop + progress tracking for piano students.

## Sources

- Tunable app features (tunableapp.com/features)
- PianoMeter app (pianometer.com)
- Perfect Ear app (Play Store/App Store listings)
- Pitch detector troubleshooting (pitchdetector.com)
- Ear training app comparisons (cooperpiano.com, 2025)
- Piano learning app reviews (hackernoon.com, Feb 2026)

---
*Feature research for: Pitch Detection Music Practice Apps*
*Researched: 2026-02-28*
