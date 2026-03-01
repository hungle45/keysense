---
status: diagnosed
trigger: "Timer Display - timer shows 1:00 all the time, doesn't count down"
created: 2026-03-01T00:00:00Z
updated: 2026-03-01T00:04:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - useMemo dependencies are static, no re-render trigger exists
test: Analyzed dependency array and interval logic
expecting: N/A - root cause confirmed
next_action: Return diagnosis

## Symptoms

expected: Timer counts down in real-time during game session
actual: Timer shows 1:00 all the time, doesn't count down
errors: None reported
reproduction: Start game session, observe timer
started: UAT Phase 03 game-loop Test 6

## Eliminated

## Evidence

- timestamp: 2026-03-01T00:01:00Z
  checked: useGameSession.ts remainingMs computation (lines 165-170)
  found: |
    remainingMs is computed with useMemo:
    ```javascript
    const remainingMs = useMemo(() => {
      if (state.status !== 'running' || !state.startTime) {
        return state.config.duration;
      }
      return Math.max(0, state.startTime + state.config.duration - Date.now());
    }, [state.status, state.startTime, state.config.duration]);
    ```
    Dependencies are: [state.status, state.startTime, state.config.duration]
    These values DON'T change during gameplay - startTime is set once at session start.
    There is NO dependency that changes over time (no tick counter, no interval-triggered state change).
  implication: useMemo only recalculates when dependencies change. Since none of these change during running state, remainingMs is computed ONCE and never updates.

- timestamp: 2026-03-01T00:02:00Z
  checked: GameScreen.tsx timer display (line 132)
  found: Component uses remainingMs directly: {formatTime(remainingMs)}
  implication: Display correctly shows remainingMs, but remainingMs never updates because useMemo dependencies don't change

- timestamp: 2026-03-01T00:03:00Z
  checked: useGameSession.ts session timer interval (lines 191-204)
  found: |
    There IS an interval that checks remaining time every 100ms:
    ```javascript
    useInterval(
      () => {
        const currentRemainingMs = state.startTime 
          ? Math.max(0, state.startTime + state.config.duration - Date.now())
          : state.config.duration;
        if (currentRemainingMs <= 0) {
          dispatch({ type: 'END_SESSION' });
        }
      },
      state.status === 'running' ? 100 : null
    );
    ```
    But this interval ONLY checks for end condition - it doesn't dispatch any action that would trigger re-render.
  implication: The session will correctly END when time runs out, but the UI won't update during gameplay because no state changes trigger re-renders

## Resolution

root_cause: remainingMs uses useMemo with static dependencies (state.status, state.startTime, config.duration) that don't change during gameplay, so the computed value is calculated once when the session starts and never recalculates - there's no periodic state update or tick counter to trigger re-renders
fix: 
verification: 
files_changed: []
