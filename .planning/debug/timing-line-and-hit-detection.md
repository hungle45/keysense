---
status: diagnosed
trigger: "UAT Phase 03: Test 7 - Hit Detection Works - timing line not visible, note detector didn't work well"
created: 2026-03-01T00:00:00.000Z
updated: 2026-03-01T00:00:00.000Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: Timing line invisible due to CSS variable mismatch + hit detection requires 200ms sustain which may feel unresponsive
test: Review CSS variable usage and hit detection timing parameters
expecting: CSS variable mismatch causes invisible timing line
next_action: Report diagnosis

## Symptoms

expected: Timing line visible, hit detection registers correct notes
actual: "I didn't see the timing line and the note detector didn't work well"
errors: none reported
reproduction: Start game session, observe timing line visibility and hit detection behavior
started: Phase 03 game-loop implementation

## Evidence

- timestamp: 2026-03-01T00:00:01.000Z
  checked: GrandStaff.tsx timing line rendering (line 58)
  found: Uses `stroke="hsl(var(--primary))"` for timing line color
  implication: SVG uses HSL wrapper expecting Tailwind v3 style variable

- timestamp: 2026-03-01T00:00:02.000Z
  checked: index.css CSS variables (line 13)
  found: Tailwind v4 uses `--color-primary: oklch(15% 0 0)` not `--primary`
  implication: `hsl(var(--primary))` resolves to invalid color, timing line invisible

- timestamp: 2026-03-01T00:00:03.000Z
  checked: useHitDetection.ts sustain requirement (line 20)
  found: SUSTAIN_DURATION_MS = 200 - requires holding correct note for 200ms
  implication: Quick note taps won't register as hits, feels unresponsive

- timestamp: 2026-03-01T00:00:04.000Z
  checked: useHitDetection.ts hit window (line 17)
  found: HIT_WINDOW_PIXELS = 40 (+/- 40px from timing line x=80)
  implication: Hit window is reasonable but invisible timing line makes it hard to judge

- timestamp: 2026-03-01T00:00:05.000Z
  checked: ScrollingNote.tsx onScrollPast callback (line 57)
  found: Notes marked as missed when x < -30 (past left edge)
  implication: Notes not marked missed at timing line, only when off screen

## Resolution

root_cause: Timing line uses invalid CSS variable `hsl(var(--primary))` - Tailwind v4 uses `--color-primary` with oklch format, not HSL. The timing line stroke color fails to render, making it invisible. Additionally, 200ms sustain requirement may contribute to "not working well" perception.

fix: empty
verification: empty
files_changed: []
