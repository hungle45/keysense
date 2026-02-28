---
status: awaiting_human_verify
trigger: "Ghost notes appearing when room is quiet. Noise floor showing as negative dB value confusing the logic. User requests complete rewrite of detection/calibration."
created: 2026-02-28T10:00:00Z
updated: 2026-03-01T10:15:00Z
---

## Current Focus

hypothesis: CONFIRMED - dB-based noise floor logic was fundamentally flawed; implemented pure linear RMS with strict gate
test: User needs to verify no ghost notes appear in quiet room
expecting: "Play a note" displays steadily in silence, real notes detected when played
next_action: Human verification of fix

## Symptoms

expected: In a quiet room, tuner should show "Play a note" without detecting random ghost notes
actual: Random ghost notes appear when room is quiet. Noise floor is negative dB which confuses gate logic.
errors: No errors, just incorrect behavior - ghost notes trigger on silence
reproduction: Enable microphone, calibrate, sit in quiet room - random notes appear
started: Ongoing issue despite previous fixes (2x RMS threshold, 0.9 clarity)

## Eliminated

- hypothesis: Clarity threshold too strict
  evidence: User confirms ghost notes appear even with strict clarity - issue is volume gate not detector
  timestamp: 2026-02-28T10:10:00Z

- hypothesis: dB-based threshold logic works with proper offset
  evidence: Negative dB values create confusing comparisons; user explicitly requires linear RMS
  timestamp: 2026-03-01T10:00:00Z

## Evidence

- timestamp: 2026-02-28T10:05:00Z
  checked: src/lib/pitch/detector.ts lines 15-23
  found: Clarity threshold is hardcoded to > 0.9 (line 18). Returns null if clarity drops below.
  implication: Clarity filter is working but ghost notes still appear - issue is before detector runs

- timestamp: 2026-02-28T10:05:00Z
  checked: src/hooks/usePitchDetection.ts lines 106-110
  found: Volume gate uses effectiveNoiseFloorRMS * 2 as threshold
  implication: 2x multiplier may be insufficient; user requests 2.5x AND gate BEFORE pitch detector

- timestamp: 2026-03-01T10:00:00Z
  checked: src/hooks/useCalibration.ts lines 79-86
  found: Uses 90th percentile of readings - may capture noise spikes rather than true average
  implication: User specifically requests AVERAGE of RMS readings, not percentile

- timestamp: 2026-03-01T10:00:00Z
  checked: src/hooks/usePitchDetection.ts line 117
  found: Pitch detector runs even on borderline signals, then gets filtered
  implication: User requires gate to PREVENT detector from running at all on silence

- timestamp: 2026-03-01T10:00:00Z
  checked: src/lib/pitch/detector.ts line 25
  found: Frequency bounds are 20-5000Hz, not piano range 27-4200Hz
  implication: May detect infrasound or ultrasound artifacts outside piano range

- timestamp: 2026-03-01T10:10:00Z
  checked: src/hooks/useAudioEngine.ts lines 36-42
  found: Media constraints already correctly set: echoCancellation=false, noiseSuppression=false, autoGainControl=false
  implication: Requirement #3 already satisfied

## Resolution

root_cause: Multiple issues compounding: (1) Calibration used 90th percentile instead of average RMS, (2) Volume gate multiplier too low (2x vs needed 2.5x), (3) Detector ran on silence instead of being gated first, (4) Frequency bounds too wide (20-5000Hz vs 27-4200Hz piano range), (5) No consecutive frame consistency check
fix: |
  Complete rewrite implementing all 5 user requirements:
  
  1. **useCalibration.ts** - Line 79-86: Changed from 90th percentile to AVERAGE linear RMS
     - Now calculates: avgRMS = sum(rmsReadings) / length
     - Provides stable baseline for noise gate
  
  2. **usePitchDetection.ts** - Complete rewrite:
     - Noise gate multiplier: 2.5x (was 2x)
     - Gate checks BEFORE pitch detector runs (was after)
     - Pure linear RMS comparison (no dB conversion)
     - 3-frame consecutive consistency check before UI update
     - Clean separation of concerns with ConsistencyState tracking
  
  3. **detector.ts** - Lines 14-15, 33-37:
     - Frequency bounds tightened: 27Hz-4200Hz (was 20-5000Hz)
     - Matches piano range to reject infrasound/ultrasound artifacts
  
  4. **useAudioEngine.ts** - Already correct (no changes needed):
     - autoGainControl: false
     - echoCancellation: false
     - noiseSuppression: false
verification: |
  - TypeScript compilation: PASSED
  - Production build: PASSED
  - Awaiting human verification in real environment
files_changed:
  - src/hooks/usePitchDetection.ts (complete rewrite)
  - src/hooks/useCalibration.ts (percentile -> average)
  - src/lib/pitch/detector.ts (frequency bounds tightened)
