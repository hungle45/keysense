# Phase 1: Audio Foundation - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can grant microphone access via button tap and calibrate for their environment. This phase delivers the audio foundation: permission handling, AudioContext setup, and calibration module. Mobile UX and error states are included. Pitch detection and game loop are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Permission Flow
- On-demand permission request (button click, not on load)
- Button label: "Enable microphone"
- After grant: go to tuner (main UI)
- If denied: show help text with settings instructions + retry button

### Calibration UX
- Accessed via Settings screen (not main screen)
- Duration: 3-5 seconds
- Visual feedback during calibration: progress bar + current dB reading
- Results displayed: noise floor dB + frequency range

### Mobile Layout
- 2 screens: Home (tuner) + Settings (calibration)
- Home screen structure: Mic button (top) → Tuner display (middle) → Settings gear (top-right)
- Portrait: single column, scrollable if needed
- Touch targets: shadcn defaults (44px minimum)

### Error Handling
- Permission denied: show instructions to enable in browser settings + retry button
- Mic disconnected mid-use: detect and show message
- iOS AudioContext suspension: resume on tap
- No microphone: graceful degradation - show all features but mark mic-required as unavailable

### Claude's Discretion
- Exact visual design of the tuner display (components, colors, typography)
- Calibration exact threshold values for noise floor
- Settings screen layout details

</decisions>

<specifics>
## Specific Ideas

- "Enable microphone" button
- Visual meter during calibration showing dB
- 2 screens: home/tuner + settings with calibration

</specifics>

<deferred>
## Deferred Ideas

- None - discussion stayed within phase scope

</deferred>

---

*Phase: 01-audio-foundation*
*Context gathered: 2026-02-28*
