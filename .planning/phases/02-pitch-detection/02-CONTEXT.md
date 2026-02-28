# Phase 2: Pitch Detection - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can see real-time pitch detection with note identification and tuner display. This phase delivers the pitch detection engine, note name conversion, and visual tuner. Depends on Phase 1 audio foundation. Game loop and rhythm module are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Tuner Display
- Note + Cents format (not needle gauge)
- Full screen note display in middle of screen
- Real-time updates (try first, optimize if performance issues)

### Note Format
- Sharps/flats: C#4 format (not ♯ or "sharp")
- Always show octave number (C4, G3, etc.)
- Prefer sharps for enharmonic notes

### No Input State
- Show message when no pitch detected
- Message text: "Play a note"
- Show same message when input below noise floor

### Cents Display
- Number + color for cents deviation
- In-tune threshold: ±5 cents (green)
- Sharp: red, Flat: blue
- Number shows deviation (e.g., "+12 cents", "-8 cents")

### Claude's Discretion
- Exact font sizes and layout proportions
- Animation transitions for smooth feel
- Performance optimization approach if needed

</decisions>

<specifics>
## Specific Ideas

- Large note in center of screen
- Cents number below note with color coding
- "Play a note" message when no input

</specifics>

<deferred>
## Deferred Ideas

- None - discussion stayed within phase scope

</deferred>

---

*Phase: 02-pitch-detection*
*Context gathered: 2026-02-28*
