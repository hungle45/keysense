---
status: diagnosed
trigger: "UAT Phase 03 game-loop Test 4: Grand Staff Display - width too short, clefs incorrectly placed"
created: 2026-03-01T00:00:00Z
updated: 2026-03-01T00:00:00Z
---

## Current Focus

hypothesis: Clef symbols use HTML text entities with CSS font-size which doesn't scale well in SVG, and staff width is constrained by parent container layout
test: Examined GrandStaff.tsx SVG rendering and CSS
expecting: Found specific issues with clef positioning and width
next_action: Report structured diagnosis

## Symptoms

expected: Grand staff displays with proper width and correctly positioned treble/bass clefs
actual: Width of grand staff is too short, treble and bass clefs aren't placed at correct positions
errors: Visual rendering issue - not a runtime error
reproduction: Navigate to game screen, start a game session
started: Initial implementation

## Eliminated

(none - first pass analysis)

## Evidence

- timestamp: 2026-03-01T00:00:00Z
  checked: GrandStaff.tsx lines 38-62
  found: |
    1. SVG uses `w-full` class which should make it full width, but parent div also has `overflow-hidden`
    2. Clef rendering uses HTML text entities (&#119070; for treble, &#119074; for bass) with CSS class `text-2xl`
    3. Clef positioning is hardcoded: x="10", y="35" for treble; y calculation for bass uses offset
    4. Staff lines use x2="100%" which should work for full width
  implication: Main issues are clef positioning and potentially the container constraints

- timestamp: 2026-03-01T00:00:00Z
  checked: GameScreen.tsx container layout (lines 128, 140)
  found: |
    1. Container uses `flex flex-col h-full` with `ref={containerRef}`
    2. GrandStaff wrapper uses `flex-1 px-4` which should allow expansion
    3. containerWidth is measured via ResizeObserver and passed to ScrollingNote
  implication: Width measurement is happening, but GrandStaff has no explicit min-width

- timestamp: 2026-03-01T00:00:00Z
  checked: GrandStaff.tsx clef positioning (lines 42, 48)
  found: |
    1. Treble clef: x="10" y="35" - hardcoded pixel positions
    2. Bass clef: x="10" y={20 + STAFF_CONFIG.staffHeight + STAFF_CONFIG.gap + 15}
       = x="10" y={20 + 40 + 30 + 15} = x="10" y="105"
    3. Staff lines start at yOffset=20 for treble staff
    4. Treble clef at y=35 is 15px into the staff (should align with staff lines)
    5. text-2xl font size may not render musical symbols correctly
  implication: Clef Y positions don't correctly align with staff line positions

- timestamp: 2026-03-01T00:00:00Z
  checked: Musical symbol rendering approach
  found: |
    Using Unicode musical symbols (U+1D11E treble clef, U+1D122 bass clef) with CSS text styling
    These symbols require proper font support and sizing - text-2xl may be insufficient
    SVG text elements with CSS classes for sizing is problematic for precise positioning
  implication: Should use proper SVG paths or larger font size with adjusted positions

## Resolution

root_cause: Clefs use Unicode characters with inadequate CSS font sizing (text-2xl ~24px) and hardcoded pixel positions that don't align with the staff line coordinates; additionally the GrandStaff container lacks explicit minimum width constraints.

fix: (not yet applied - diagnosis only)
verification: (not yet applied)
files_changed: []
