---
status: resolved
phase: 03-game-loop
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md]
started: 2026-03-01T05:35:00Z
updated: 2026-03-01T05:54:00Z
resolved_by: phase-03.1-polish
---

## Current Test

[testing complete]

## Tests

### 1. Navigate to Practice Screen
expected: App shows 3-tab navigation at bottom: Tuner | Practice | Settings. Tapping "Practice" navigates to the game configuration screen.
result: pass

### 2. Session Configuration Options
expected: Practice screen shows configuration card with: Duration (1 Minute / 5 Minutes), Hand Position (Middle C / G Position / F Position), Scroll Speed (Slow / Medium / Fast), and a "Start Practice" button. All buttons should be large touch targets (44px minimum).
result: pass

### 3. Countdown Splash
expected: After tapping "Start Practice", a full-screen overlay appears showing "3", then "2", then "1" with "Get ready..." text. Each number displays for about 1 second.
result: pass

### 4. Grand Staff Display
expected: After countdown, a grand staff appears with treble clef (top) and bass clef (bottom). Five horizontal lines for each staff. A vertical timing line visible on the left side of the staff.
result: issue
reported: "it display but the width of the grand staff is too short and the treble clef and bas cleft weren't placed at the correct place"
severity: major

### 5. Notes Scroll Right to Left
expected: Musical notes appear on the right side of the staff and scroll leftward toward the timing line. Note labels (like "C4", "D4") visible on each note. Notes spawn at regular intervals during the session.
result: issue
reported: "I see the notes move leftward but there is just only one note at a time. I think we should render some notes at a time. also I think notes should be circle but they're not"
severity: major

### 6. Timer Display
expected: During the game session, a countdown timer is visible showing remaining time in mm:ss format (e.g., "0:45"). Timer counts down in real-time.
result: issue
reported: "it didn't count down, showing 1:00 all the time"
severity: major

### 7. Hit Detection Works
expected: When you play the correct note on a piano (matching both note AND octave) while a target note is near the timing line, the note turns green indicating a hit. Must hold the note for about 200ms. Hit count increases.
result: issue
reported: "I didn't see the timiming line and the note detector didn't work well, we will discuss for the logic to handle this"
severity: major

### 8. Missed Notes Counted
expected: If a note scrolls past the timing line without being hit, it counts as a miss. Notes that scroll off-screen without being played are automatically marked as missed.
result: pass

### 9. Results Modal Appears
expected: When timer reaches 0:00, a results modal appears showing: large accuracy percentage, hits count (green), misses count (red), total notes, and an encouraging message based on performance.
result: pass

### 10. Play Again and Back to Menu
expected: Results modal has two buttons: "Play Again" (returns to configuration screen to start new session) and "Back to Menu" (returns to Tuner/home screen).
result: pass

## Summary

total: 10
passed: 6
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "Grand staff displays with proper width and correctly positioned treble/bass clefs"
  status: resolved
  reason: "User reported: it display but the width of the grand staff is too short and the treble clef and bas cleft weren't placed at the correct place"
  severity: major
  test: 4
  root_cause: "Clefs use Unicode characters with inadequate CSS font sizing (text-2xl) and hardcoded Y positions that don't align with staff line coordinates calculated from STAFF_CONFIG"
  resolution: "Fixed in 03.1-01: added min-w-[120px], corrected clef Y positions (treble y=58, bass y=108), increased font to text-5xl, timing line uses stroke-red-500"
  artifacts:
    - path: src/components/game/GrandStaff.tsx
      issue: "Treble clef y=35 doesn't align with staff lines; Bass clef y=105 misaligned; text-2xl font size too small for Unicode musical symbols; no minimum width constraint"
  missing:
    - "Correct treble clef Y position to align with G-line"
    - "Correct bass clef Y position to align with F-line on bass staff"
    - "Larger font size (text-5xl or text-6xl) or SVG path alternatives for clefs"
    - "Minimum width constraint on GrandStaff container"
  debug_session: ".planning/debug/grandstaff-display.md"

- truth: "Multiple notes visible on screen at once, notes are circular shape"
  status: resolved
  reason: "User reported: I see the notes move leftward but there is just only one note at a time. I think we should render some notes at a time. also I think notes should be circle but they're not"
  severity: major
  test: 5
  root_cause: "Spawn interval too long (containerWidth/3 formula = ~2.7s) and note shape is oval (w-6 h-4 = 24x16px) instead of circle"
  resolution: "Fixed in 03.1-01: changed note to w-5 h-5 (circle), fixed spawn intervals (1500/1000/750ms by speed) for 3-4 visible notes"
  artifacts:
    - path: src/screens/GameScreen.tsx
      issue: "Line 72 - spawn interval calculation (containerWidth / 3) produces ~2.7 second gaps"
    - path: src/components/game/ScrollingNote.tsx
      issue: "CSS classes 'w-6 h-4' create 24x16px oval shape instead of circle"
  missing:
    - "Shorter spawn interval (divide by 5-6 instead of 3, or fixed 1-1.5s interval)"
    - "Equal width/height for circular notes (e.g., 'w-5 h-5' or 'w-6 h-6')"
  debug_session: ".planning/debug/notes-single-not-circle.md"

- truth: "Timer counts down in real-time during game session"
  status: resolved
  reason: "User reported: it didn't count down, showing 1:00 all the time"
  severity: major
  test: 6
  root_cause: "useMemo dependencies for remainingMs are static during gameplay (startTime set once, status stays 'running'), so no re-renders occur to recalculate the countdown value"
  resolution: "Fixed in 03.1-01: added TIMER_TICK action dispatched every 1000ms, added currentTime to useMemo deps to trigger recalculation"
  artifacts:
    - path: src/hooks/useGameSession.ts
      issue: "remainingMs useMemo depends on values that don't change during running state; session interval only checks end condition without dispatching state updates"
  missing:
    - "A periodic state update during 'running' status to trigger re-renders (e.g., add TIMER_TICK action dispatched every 100ms)"
  debug_session: ".planning/debug/timer-display-not-counting.md"

- truth: "Timing line visible and hit detection registers correct notes"
  status: resolved
  reason: "User reported: I didn't see the timiming line and the note detector didn't work well, we will discuss for the logic to handle this"
  severity: major
  test: 7
  root_cause: "Timing line uses invalid CSS variable hsl(var(--primary)) - Tailwind v4 uses --color-primary with oklch format, not HSL; stroke fails to render"
  resolution: "Fixed in 03.1-01 (timing line stroke-red-500) and 03.1-02 (Wait Mode: Strong Input Gate with volume+clarity thresholds, 150ms sustain, decay detection)"
  artifacts:
    - path: src/components/game/GrandStaff.tsx
      issue: "Line 58: stroke='hsl(var(--primary))' uses non-existent CSS variable"
    - path: src/hooks/useHitDetection.ts
      issue: "200ms sustain requirement may feel unresponsive"
  missing:
    - "Change timing line stroke to use valid Tailwind v4 color or direct color value"
    - "Discuss hit detection logic with user"
  debug_session: ".planning/debug/timing-line-and-hit-detection.md"
