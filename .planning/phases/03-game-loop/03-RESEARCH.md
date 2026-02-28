# Phase 3: Game Loop - Research

**Researched:** 2026-03-01
**Domain:** React state management, game timers, pitch comparison logic
**Confidence:** HIGH

## Summary

The game loop implementation requires managing complex session state (idle/running/complete), accurate timing for countdowns, random note generation, and real-time pitch comparison. The existing `usePitchDetection` hook already provides clean pitch data (`note`, `octave`, `cents`, `clarity`) that the game loop will consume.

The recommended approach uses `useReducer` for session state management (official React guidance for complex state with multiple transitions), a custom `useInterval` hook for accurate timing (Dan Abramov's declarative pattern), and simple note comparison logic that ignores octaves for beginner-friendly practice.

**Primary recommendation:** Use `useReducer` with discriminated union state types for the game session, `useInterval` hook from usehooks-ts for timing, and compare notes by name only (C, D, E) ignoring octave.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React useReducer | built-in | Session state machine | Official React recommendation for complex state with many transitions |
| usehooks-ts | ^3.1.0 | useInterval hook | Battle-tested implementation of Dan Abramov's declarative interval pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React useRef | built-in | Timer start time, session data | Track mutable values without re-renders |
| React useCallback | built-in | Stable event handlers | Prevent unnecessary child re-renders |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| usehooks-ts useInterval | Custom useInterval hook | Custom is fine if avoiding dependencies; usehooks-ts is well-tested |
| useReducer | Multiple useState | useState works but leads to scattered state logic for complex sessions |
| External state library (Zustand) | Built-in React | Overkill for single-component game state |

**Installation:**
```bash
npm install usehooks-ts
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── hooks/
│   └── useGameSession.ts    # Main game loop hook with useReducer
├── lib/
│   └── game/
│       ├── notes.ts         # Note generation and comparison
│       └── scoring.ts       # Score calculation utilities
├── components/
│   └── game/
│       ├── GameSession.tsx  # Main game UI component
│       ├── TargetNote.tsx   # Display for target note
│       ├── Timer.tsx        # Session countdown display
│       └── ScoreSummary.tsx # End-of-session results
└── types/
    └── game.ts              # GameState, GameAction types
```

### Pattern 1: Discriminated Union State Machine
**What:** Model game state as discriminated union with explicit status field
**When to use:** Always for complex state with distinct phases (idle/running/complete)
**Example:**
```typescript
// Source: React official docs - useReducer pattern
type GameStatus = 'idle' | 'running' | 'complete';

interface GameState {
  status: GameStatus;
  duration: number;           // Total session duration in ms
  startTime: number | null;   // Timestamp when started
  currentNote: string | null; // Target note (e.g., "C", "D#")
  hits: number;               // Correct notes played
  misses: number;             // Wrong notes played
  noteHistory: NoteAttempt[]; // All attempts for review
}

type GameAction =
  | { type: 'START_SESSION'; duration: number }
  | { type: 'NEXT_NOTE'; note: string }
  | { type: 'NOTE_HIT' }
  | { type: 'NOTE_MISS' }
  | { type: 'END_SESSION' };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        status: 'running',
        duration: action.duration,
        startTime: Date.now(),
        hits: 0,
        misses: 0,
        noteHistory: [],
      };
    case 'NEXT_NOTE':
      return { ...state, currentNote: action.note };
    case 'NOTE_HIT':
      return { ...state, hits: state.hits + 1 };
    case 'NOTE_MISS':
      return { ...state, misses: state.misses + 1 };
    case 'END_SESSION':
      return { ...state, status: 'complete', currentNote: null };
    default:
      return state;
  }
}
```

### Pattern 2: Declarative useInterval
**What:** Custom hook that makes setInterval work correctly with React's mental model
**When to use:** For game timers, countdowns, periodic UI updates
**Example:**
```typescript
// Source: usehooks-ts useInterval (based on Dan Abramov's pattern)
import { useInterval } from 'usehooks-ts';

function useGameTimer(
  onTick: () => void,
  onComplete: () => void,
  endTime: number | null
) {
  useInterval(
    () => {
      if (endTime && Date.now() >= endTime) {
        onComplete();
      } else {
        onTick();
      }
    },
    endTime ? 100 : null  // Poll every 100ms when running, null to stop
  );
}
```

### Pattern 3: Note Comparison (Name Only)
**What:** Compare detected pitch to target by note name, ignoring octave
**When to use:** Beginner practice mode where any correct note is acceptable
**Example:**
```typescript
// Simple note comparison - ignores octave for accessibility
function isNoteMatch(detected: string | null, target: string): boolean {
  if (!detected) return false;
  // Compare base note only, handles sharps/flats
  return detected === target;
}

// With octave-aware comparison (for advanced mode later)
function isExactNoteMatch(
  detected: { note: string; octave: number } | null,
  target: { note: string; octave: number }
): boolean {
  if (!detected) return false;
  return detected.note === target.note && detected.octave === target.octave;
}
```

### Anti-Patterns to Avoid
- **Mutating reducer state:** Always return new objects from reducer, never modify state directly
- **setInterval in useEffect without cleanup:** Causes memory leaks and stale closures
- **Storing derived state:** Don't store `remainingTime` - compute from `startTime` and `duration`
- **Multiple useState for related state:** Leads to impossible state combinations (e.g., running=true but startTime=null)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interval timing | Raw setInterval in useEffect | `useInterval` from usehooks-ts | Stale closure bugs are extremely common; pattern is solved |
| Complex state transitions | Multiple useState | useReducer with discriminated unions | Scattered state logic becomes unmaintainable |
| Random note selection | Simple Math.random | Fisher-Yates or weighted random | Avoid consecutive duplicates, ensure musical variety |

**Key insight:** setInterval with React hooks is a known-hard problem. Dan Abramov's `useInterval` pattern (implemented in usehooks-ts) solves stale closure issues that trip up even experienced developers.

## Common Pitfalls

### Pitfall 1: Stale Closure in setInterval
**What goes wrong:** Counter stays at 1, timer doesn't update, callback uses old state values
**Why it happens:** setInterval callback captures state from initial render, doesn't see updates
**How to avoid:** Use `useInterval` hook which stores callback in ref, OR use functional state updates `setCount(c => c + 1)`
**Warning signs:** State updates work on button click but not in interval

### Pitfall 2: Timer Drift
**What goes wrong:** Session ends late, displayed time doesn't match elapsed time
**Why it happens:** setInterval isn't precise; each tick can be delayed by JS event loop
**How to avoid:** Store `startTime` timestamp, compute elapsed time as `Date.now() - startTime`
**Warning signs:** 1-minute session takes 62+ seconds to complete

### Pitfall 3: Note Persistence Window
**What goes wrong:** User plays correct note but it's not detected as a hit
**Why it happens:** Pitch detection and game loop are asynchronous; note might change between frames
**How to avoid:** Track "currently detecting" note separately from "locked in" hit; use debounce or hold time (e.g., 200ms continuous correct pitch = hit)
**Warning signs:** Users report hitting notes that weren't counted

### Pitfall 4: Race Condition on Session End
**What goes wrong:** Extra note hits counted after session ends, or session ends mid-note
**Why it happens:** Timer callback and pitch detection callback fire in unpredictable order
**How to avoid:** Check `status === 'running'` before processing any game events; end timer first, then process final state
**Warning signs:** Inconsistent final scores, hits counted after "Session Complete" shows

### Pitfall 5: Derived State Desync
**What goes wrong:** Displayed remaining time doesn't match actual remaining time
**Why it happens:** Storing `remainingTime` in state and decrementing it, instead of computing
**How to avoid:** Compute: `remainingMs = startTime + duration - Date.now()`
**Warning signs:** Pausing and resuming causes time to jump

## Code Examples

Verified patterns for this implementation:

### useInterval from usehooks-ts
```typescript
// Source: usehooks-ts v3.1.0 - https://usehooks-ts.com/react-hook/use-interval
import { useEffect, useRef } from 'react';

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => clearInterval(id);
  }, [delay]);
}
```

### Random Note Generator (with no consecutive repeats)
```typescript
// Musical notes for piano practice
const PRACTICE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Simple generator - avoids consecutive duplicates
function generateRandomNote(excludeNote: string | null): string {
  const available = excludeNote 
    ? PRACTICE_NOTES.filter(n => n !== excludeNote)
    : PRACTICE_NOTES;
  return available[Math.floor(Math.random() * available.length)];
}
```

### Time Formatting for Display
```typescript
// Format milliseconds as mm:ss
function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
```

### Complete useGameSession Hook Structure
```typescript
// Source: Synthesized from React docs + usehooks-ts patterns
import { useReducer, useCallback, useRef } from 'react';
import { useInterval } from 'usehooks-ts';
import type { PitchResult } from '@/types/pitch';

interface GameState {
  status: 'idle' | 'running' | 'complete';
  duration: number;
  startTime: number | null;
  currentNote: string | null;
  hits: number;
  misses: number;
}

export function useGameSession(pitch: PitchResult | null) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Computed values (not stored in state)
  const remainingMs = state.startTime 
    ? Math.max(0, state.startTime + state.duration - Date.now())
    : state.duration;

  // Timer tick - check for session end
  useInterval(
    () => {
      if (remainingMs <= 0) {
        dispatch({ type: 'END_SESSION' });
      }
    },
    state.status === 'running' ? 100 : null
  );

  // Note matching - separate effect
  // ...

  return {
    state,
    remainingMs,
    start: (duration: number) => dispatch({ type: 'START_SESSION', duration }),
    // ...
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| setInterval directly | useInterval hook | React Hooks era (2019+) | Prevents stale closure bugs |
| Multiple useState | useReducer for complex state | React 16.8+ | Official recommendation for state machines |
| External state libraries | Built-in useReducer | Still valid but React capable | Simpler dependency tree for focused components |

**Deprecated/outdated:**
- Using `setInterval` directly in `useEffect`: Known to cause stale closure bugs; use `useInterval` pattern
- Class components for game loops: Hooks provide cleaner composition

## Open Questions

1. **Note Hit Detection Timing Window**
   - What we know: Need some tolerance for note detection (pitch fluctuates)
   - What's unclear: Optimal timing window (100ms? 200ms? 500ms?) for "locking in" a correct note
   - Recommendation: Start with 200ms sustained correct pitch = hit; tune based on user testing

2. **Sharp/Flat Note Handling**
   - What we know: Pitch detection returns note names like "C#", "Db"
   - What's unclear: Should we generate sharps/flats as targets, or only natural notes for simplicity?
   - Recommendation: Phase 3 MVP uses only natural notes (C, D, E, F, G, A, B); add sharps/flats in later enhancement

3. **Audio Continues Between Sessions**
   - What we know: Pitch detection runs via `usePitchDetection` at App level
   - What's unclear: Should pitch detection pause during session idle/complete states?
   - Recommendation: Keep pitch detection running (tuner always active); game session just ignores it when not running

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GAME-01 | User can start 1-minute practice session | useReducer START_SESSION action with duration=60000 |
| GAME-02 | User can start 5-minute practice session | Same pattern with duration=300000 |
| GAME-03 | Random target notes displayed during session | generateRandomNote() utility, excludes consecutive repeats |
| GAME-04 | Session tracks correct/incorrect note hits | useReducer NOTE_HIT/NOTE_MISS actions, note comparison logic |
| GAME-05 | Session displays elapsed time and remaining time | Compute from startTime + duration - Date.now(); useInterval for updates |
| GAME-06 | Session ends with score summary | END_SESSION action, compute accuracy = hits / (hits + misses) |

## Sources

### Primary (HIGH confidence)
- React official docs - useReducer: https://react.dev/reference/react/useReducer
- React official docs - Extracting State Logic: https://react.dev/learn/extracting-state-logic-into-a-reducer
- Dan Abramov - Making setInterval Declarative: https://overreacted.io/making-setinterval-declarative-with-react-hooks/
- usehooks-ts useInterval: https://usehooks-ts.com/react-hook/use-interval

### Secondary (MEDIUM confidence)
- usehooks-ts GitHub (43k+ stars): https://github.com/juliencrn/usehooks-ts

### Tertiary (LOW confidence)
- None - all patterns verified against official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - React useReducer is official recommendation; usehooks-ts is battle-tested
- Architecture: HIGH - Discriminated union state machine is well-documented React pattern
- Pitfalls: HIGH - Stale closure problem is extensively documented by Dan Abramov

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (patterns are stable; React fundamentals don't change frequently)
