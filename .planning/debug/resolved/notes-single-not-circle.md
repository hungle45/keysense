---
status: diagnosed
trigger: "UAT Phase 03: Notes scroll right to left - only one note at a time, notes not circular"
created: 2026-03-01T00:00:00Z
updated: 2026-03-01T00:00:00Z
---

## Current Focus

hypothesis: Two issues - (1) spawn interval too long, (2) note shape is oval not circle
test: Review spawn calculation and CSS dimensions
expecting: Spawn interval based on screen width causes long gaps; w-6 h-4 causes oval shape
next_action: Document root cause and artifacts

## Symptoms

expected: Multiple notes visible on screen at once, notes are circular shape
actual: Only one note visible at a time, notes appear oval/elliptical
errors: None (visual/UX issue)
reproduction: Start any game session and observe note spawning
started: Since initial implementation

## Eliminated

(none)

## Evidence

- timestamp: 2026-03-01T00:00:00Z
  checked: GameScreen.tsx spawn interval calculation (lines 69-72)
  found: |
    Spawn interval = (containerWidth / 3) / pixelsPerSecond * 1000
    For medium speed (100px/s) and 800px container: (800/3) / 100 * 1000 = 2666ms
    This is ~2.7 seconds between spawns - way too long for multiple visible notes
  implication: With slow scrolling and long spawn intervals, notes disappear before new ones spawn

- timestamp: 2026-03-01T00:00:00Z
  checked: ScrollingNote.tsx CSS classes (line 83)
  found: |
    `className={`absolute w-6 h-4 rounded-full ${noteColor} transition-colors`}`
    w-6 = 24px width, h-4 = 16px height
    This creates an oval (wider than tall), not a circle
  implication: Musical notes should be circles; need equal width and height

- timestamp: 2026-03-01T00:00:00Z
  checked: Scroll speed values in game.ts (lines 27-31)
  found: |
    SCROLL_SPEEDS = { slow: 50, medium: 100, fast: 150 } (pixels per second)
    For 800px container at medium speed: 800/100 = 8 seconds to cross screen
    But spawning every 2.7 seconds means only ~3 notes visible max
  implication: The spawn interval is tied to 1/3 screen width which is too conservative

## Resolution

root_cause: |
  TWO ISSUES:
  1. Spawn interval too long: spawns every ~2.7s (containerWidth/3) which means notes scroll off before overlap
  2. Note shape is oval: CSS uses w-6 h-4 (24x16px) instead of equal dimensions for circle

fix: (not applied - diagnosis only)
verification: (not applied - diagnosis only)
files_changed: []
