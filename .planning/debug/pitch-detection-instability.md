---
status: awaiting_human_verify
trigger: "Pitch detection flashes too fast, is too sensitive, and returns to 'Play a note' immediately"
created: 2026-02-28T10:00:00Z
updated: 2026-02-28T10:22:00Z
---

## Current Focus

hypothesis: CONFIRMED - lack of note persistence/debounce causes rapid state clearing
test: User needs to verify fix by playing sustained notes
expecting: Notes should display steadily during sustained play without flashing
next_action: Request human verification

## Symptoms

expected: When playing a note (e.g., C3), tuner should show C3 steadily while note sustains
actual: Note flashes briefly, jumps between notes (C3 → B3 → C3), then immediately returns to "Play a note" even while still playing
errors: No console errors reported
reproduction: Enable microphone, play any sustained note on piano
started: Issue appeared after fixing the useAudioEngine hook lifting issue

## Eliminated

## Evidence

- timestamp: 2026-02-28T10:05:00Z
  checked: src/lib/pitch/detector.ts lines 15-23
  found: Clarity threshold is hardcoded to > 0.9 (line 18). Returns null if clarity drops below.
  implication: Piano notes with clarity 0.7-0.9 would be rejected, causing instant "Play a note" display

- timestamp: 2026-02-28T10:05:00Z
  checked: src/hooks/usePitchDetection.ts lines 42-62
  found: NO note persistence/hold logic. setPitch(null) called immediately when db < threshold OR when detector returns null
  implication: Single frame with low clarity causes immediate state change to null

- timestamp: 2026-02-28T10:05:00Z
  checked: src/hooks/usePitchDetection.ts line 42
  found: Noise floor threshold is effectiveNoiseFloor + 10 (e.g., if noiseFloor is -60, threshold is -50dB)
  implication: This seems reasonable but combined with 0.9 clarity creates double-filter that's too aggressive

- timestamp: 2026-02-28T10:06:00Z
  checked: smoothingTimeConstant on line 76
  found: Set to 0.8 which smooths the FFT data, but this doesn't help with clarity/note hold
  implication: Smoothing helps FFT stability but doesn't prevent rapid null states

- timestamp: 2026-02-28T10:10:00Z
  checked: pitchy playground (official demo)
  found: Default clarity threshold is 95% (0.95), but crucially the playground FILTERS display rather than dropping state. All readings are recorded, filter happens at display time.
  implication: CONFIRMED - our implementation drops state immediately on each frame, causing rapid flashing

- timestamp: 2026-02-28T10:10:00Z
  checked: pitchy README
  found: Clarity is 0-1 scale, "low values indicate noise rather than true pitch". No specific guidance on thresholds.
  implication: 0.9 threshold isn't unreasonable, but INSTANT state clearing is the real problem

## Resolution

root_cause: TWO issues: (1) No note-hold/debounce logic - pitch immediately clears to null when a single frame drops below threshold, (2) Clarity threshold of 0.9 is on the stricter side for piano notes which can have varying clarity during sustain/decay. The PRIMARY issue is lack of hysteresis - a single bad frame shouldn't reset the display.
fix: |
  1. Lowered clarity threshold from 0.9 to 0.8 in detector.ts (more forgiving for piano harmonics)
  2. Added note hold logic in usePitchDetection.ts:
     - NOTE_HOLD_TIME_MS = 150ms: Holds last valid note for this duration after detection drops
     - CONSECUTIVE_NULL_THRESHOLD = 3: Requires 3 consecutive null readings before clearing
     - Tracks lastValidPitch, lastValidTime, and consecutiveNullCount via refs
     - Only clears display when BOTH time AND count thresholds are exceeded
verification: Build passes (tsc && vite build). Awaiting human verification.
files_changed:
  - src/hooks/usePitchDetection.ts
  - src/lib/pitch/detector.ts
