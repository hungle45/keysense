# KeySense

## What This Is

A mobile-friendly web app (also known as "O(1) Piano") that helps users practice piano using their phone's microphone. No MIDI required — just open the app, grant microphone access, and start practicing.

## Core Value

Real-time pitch detection and practice feedback for piano students using only a smartphone microphone.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Calibration Module — measure room noise floor and piano frequency range
- [ ] Pitch Detection Engine — real-time microphone listener converting Hz to musical notes (C4, G3, etc.)
- [ ] The Game Loop — 1-minute and 5-minute practice sessions with random notes
- [ ] Rhythm Module — check if user hits any key at correct timing/BPM
- [ ] Notation Viewer — render ABC notation strings into visual music sheets

### Out of Scope

- MIDI input support — using microphone only
- Real-time multi-user features — single-player only
- Audio output/sound synthesis — microphone input only

## Context

- Tech stack: React with shadcn-ui, Web Audio API, pitchfinder library, TensorFlow.js (future), abcjs
- Target users: Piano students practicing at home without access to a teacher
- Platform: Mobile-first web app (PWA capable)

## Constraints

- **Platform**: Mobile web (no native app for v1)
- **Input Method**: Microphone only (no MIDI hardware)
- **Audio Processing**: Client-side only (Web Audio API)
- **Notation**: ABC notation (abcjs library)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Microphone over MIDI | Lower barrier to entry, works on any phone | — Pending |
| ABC notation for sheets | Lightweight, text-based, widely supported | — Pending |
| React + shadcn-ui | Modern stack, good mobile UI components | — Pending |

---
*Last updated: 2026-02-28 after initialization*
