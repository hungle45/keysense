---
phase: 03-game-loop
plan: 01
subsystem: game
tags: [react, useReducer, state-machine, typescript, usehooks-ts]

# Dependency graph
requires:
  - phase: 02-pitch-detection
    provides: PitchResult type for future hit detection integration
provides:
  - GameState/GameAction discriminated union state machine
  - useGameSession hook with countdown and session timers
  - Note generation with consecutive duplicate avoidance
  - Hand position configurations for note ranges
affects: [03-02, 03-03, 03-04]

# Tech tracking
tech-stack:
  added: [usehooks-ts]
  patterns: [useReducer state machine, computed values from timestamps, discriminated unions]

key-files:
  created:
    - src/types/game.ts
    - src/lib/game/notes.ts
    - src/hooks/useGameSession.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Used useReducer for complex state machine (official React recommendation)"
  - "Computed remainingMs from timestamps instead of storing in state (prevents drift)"
  - "Natural notes only per user decision (no sharps/flats)"

patterns-established:
  - "Discriminated union GameAction for type-safe dispatch"
  - "useInterval from usehooks-ts for timer logic"
  - "Consecutive duplicate avoidance in note generation"

requirements-completed: [GAME-01, GAME-02, GAME-04, GAME-05]

# Metrics
duration: 3min
completed: 2026-02-28
---

# Phase 03 Plan 01: Game Loop Core Summary

**useReducer-based game session state machine with countdown timer, note generation, and computed remaining time from timestamps**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-28T22:16:16Z
- **Completed:** 2026-02-28T22:19:28Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- GameState/GameAction discriminated unions for type-safe state machine
- useGameSession hook with automatic countdown (3-2-1) and session end detection
- Note generation with hand position support and consecutive duplicate avoidance
- Computed remainingMs from timestamps preventing timer drift

## Task Commits

Each task was committed atomically:

1. **Task 1: Create game type definitions** - `cf14c50` (feat)
2. **Task 2: Create note generation utilities** - `18b5e4e` (feat)
3. **Task 3: Create useGameSession hook** - `5eaaa7e` (feat)

**Plan metadata:** (pending) (docs: complete plan)

## Files Created/Modified
- `src/types/game.ts` - GameState, GameAction, TargetNote, NoteAttempt, config types
- `src/lib/game/notes.ts` - generateRandomNote, getNotesForPosition, HAND_POSITIONS
- `src/hooks/useGameSession.ts` - Main game session hook with useReducer state machine
- `package.json` - Added usehooks-ts dependency
- `package-lock.json` - Lock file updated

## Decisions Made
- Used `useReducer` with discriminated union pattern (official React recommendation for complex state)
- Computed `remainingMs` from `startTime + duration - Date.now()` rather than storing in state (prevents drift per RESEARCH.md)
- Installed `usehooks-ts` for battle-tested `useInterval` hook (avoids stale closure bugs)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Game loop core types and state machine ready for UI components
- Ready for 03-02 (scrolling staff component)
- Hook can be consumed by GameSession component once built

## Self-Check: PASSED
- All created files verified to exist on disk
- All commit hashes verified in git log

---
*Phase: 03-game-loop*
*Completed: 2026-02-28*
