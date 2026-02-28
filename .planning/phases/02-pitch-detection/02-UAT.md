---
status: complete
phase: 02-pitch-detection
source: 02-01-SUMMARY.md
started: 2026-02-28T12:00:00Z
updated: 2026-03-01T10:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Real-time Pitch Detection
expected: With microphone enabled, play a note on a piano (or hum/whistle). The tuner detects and displays the note in real-time. Note should be stable (not flickering).
result: pass

### 2. Note Name Display
expected: When you play a note, the tuner shows the note name with octave (e.g., C4, G#3, A5). The note should match what you're playing.
result: pass

### 3. Cents Deviation Display
expected: The tuner shows cents deviation from perfect pitch. Sharp shows positive cents (toward red). Flat shows negative cents (toward blue). In-tune (within ±5 cents) shows green.
result: pass

### 4. Note Stability
expected: Hold a sustained note. The displayed note should remain stable without flickering between adjacent notes (e.g., shouldn't jump C4 → B3 → C4).
result: pass

### 5. High Note Detection
expected: Play notes above C5 on the piano. The tuner should correctly identify the fundamental note, not get confused by harmonics.
result: pass

### 6. Noise Filtering
expected: In a quiet room, the tuner should show "Play a note" or similar placeholder. It should not display random notes from background noise.
result: pass
note: Fixed by lifting useCalibration to App level, adding localStorage persistence, and increasing FFT size to 4096

### 7. Silence Recovery
expected: Play a note, then stop. After a brief moment (~0.5s), display should return to "Play a note" instead of showing stale note data.
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
