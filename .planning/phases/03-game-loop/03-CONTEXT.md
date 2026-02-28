# Phase 3: Game Loop - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Timed practice sessions where users play target notes displayed on a scrolling grand staff (rhythm game style) and get scored on accuracy. Users can select session duration, hand position, and scroll speed before starting.

</domain>

<decisions>
## Implementation Decisions

### Session Flow
- 3-2-1 countdown splash screen before session starts
- Timer counts down (60...59...58) not up
- Modal results screen at end with score summary
- Simple actions on results: "Play Again" and "Back to Menu" only

### Target Note Presentation
- Grand staff notation (both treble and bass clefs)
- Auto-scrolling staff like a rhythm game (notes scroll from right to left)
- User selects hand position before starting (determines note range)
- Both hands always active (notes appear on both clefs)
- Full octave range per position (8 notes: C-D-E-F-G-A-B-C)
- Natural notes only (no sharps/flats)

### Scroll Speed
- User selects speed before starting
- 3 presets: Slow / Medium / Fast
- Fixed speed throughout session (no acceleration)

### Hit Detection & Matching
- Notes reach a center timing line - user must play at that moment
- Exact octave match required (C4 is different from C3)
- Sustained hit required (~200ms hold to count)
- If note scrolls past without being hit: mark as miss, continue scrolling

### Feedback
- Correct hit: green highlight/glow on the note
- Wrong note played: silent (no negative feedback)
- Missed notes: no penalty shown during play, just counted in final score
- Score only shown at end (not during session)
- No sound effects - visual only

### Claude's Discretion
- Exact timing window tolerance for "at the timing line"
- Animation style for scrolling notes
- Visual design of the timing line
- Loading/transition animations

</decisions>

<specifics>
## Specific Ideas

- "Rhythm game style" - notes scroll horizontally, user plays when they reach the target line
- Like Guitar Hero / Piano Tiles but for real piano note reading
- Focus on note reading practice, not just reaction time
- Encouraging, not punishing - wrong notes are silent, score shown only at end

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 03-game-loop*
*Context gathered: 2026-03-01*
