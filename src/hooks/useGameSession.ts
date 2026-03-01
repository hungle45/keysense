/**
 * Game session state machine hook.
 * 
 * Manages the complete lifecycle of a practice session:
 * idle -> countdown (3-2-1) -> running -> complete
 * 
 * Uses useReducer for predictable state transitions and
 * computed values (remainingMs, accuracy) to avoid state drift.
 */

import { useReducer, useCallback, useMemo } from 'react';
import { useInterval } from 'usehooks-ts';
import type { 
  GameState, 
  GameAction, 
  GameConfig, 
  TargetNote,
} from '@/types/game';
import { generateRandomNote, createNoteId } from '@/lib/game/notes';

/**
 * Initial state for a new game session.
 */
const initialState: GameState = {
  status: 'idle',
  config: {
    duration: 60_000,
    handPosition: 'middle-c',
    scrollSpeed: 'medium',
  },
  startTime: null,
  countdownValue: 3,
  activeNotes: [],
  noteHistory: [],
  hits: 0,
  misses: 0,
  currentTime: Date.now(),
};

/**
 * Pure reducer function for game state transitions.
 * Handles all game actions in a predictable, testable way.
 */
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'CONFIGURE':
      return { ...state, config: action.config };
      
    case 'START_COUNTDOWN':
      return { 
        ...state, 
        status: 'countdown', 
        countdownValue: 3,
        hits: 0,
        misses: 0,
        activeNotes: [],
        noteHistory: [],
      };
      
    case 'COUNTDOWN_TICK':
      return { 
        ...state, 
        countdownValue: Math.max(0, state.countdownValue - 1) 
      };
      
    case 'TIMER_TICK':
      return { ...state, currentTime: action.time };
      
    case 'START_SESSION':
      return { 
        ...state, 
        status: 'running', 
        startTime: Date.now(),
        countdownValue: 0,
      };
      
    case 'SPAWN_NOTE':
      return {
        ...state,
        activeNotes: [...state.activeNotes, action.note],
      };
      
    case 'NOTE_HIT': {
      const noteIndex = state.activeNotes.findIndex(n => n.id === action.noteId);
      if (noteIndex === -1) return state;
      
      const hitNote = state.activeNotes[noteIndex];
      const updatedNote: TargetNote = {
        ...hitNote,
        status: 'hit',
        hitTime: Date.now(),
      };
      
      return {
        ...state,
        activeNotes: state.activeNotes.filter(n => n.id !== action.noteId),
        noteHistory: [...state.noteHistory, {
          targetNote: updatedNote,
          playedNote: action.playedNote,
          playedOctave: action.playedOctave,
          wasHit: true,
          timestamp: Date.now(),
        }],
        hits: state.hits + 1,
      };
    }
      
    case 'NOTE_MISSED': {
      const missedNote = state.activeNotes.find(n => n.id === action.noteId);
      if (!missedNote) return state;
      
      return {
        ...state,
        activeNotes: state.activeNotes.filter(n => n.id !== action.noteId),
        noteHistory: [...state.noteHistory, {
          targetNote: { ...missedNote, status: 'missed' },
          playedNote: null,
          playedOctave: null,
          wasHit: false,
          timestamp: Date.now(),
        }],
        misses: state.misses + 1,
      };
    }
      
    case 'END_SESSION': {
      // Mark all remaining active notes as missed
      const remainingMisses = state.activeNotes.map(note => ({
        targetNote: { ...note, status: 'missed' as const },
        playedNote: null,
        playedOctave: null,
        wasHit: false,
        timestamp: Date.now(),
      }));
      
      return {
        ...state,
        status: 'complete',
        activeNotes: [],
        noteHistory: [...state.noteHistory, ...remainingMisses],
        misses: state.misses + remainingMisses.length,
      };
    }
      
    case 'RESET':
      return initialState;
      
    default:
      return state;
  }
}

/**
 * Main game session hook providing state and actions.
 * 
 * Features:
 * - Automatic countdown timer (3-2-1 before session starts)
 * - Session timer that ends the game when time runs out
 * - Computed remainingMs from timestamps (prevents drift)
 * - Note spawning with duplicate avoidance
 * 
 * @returns State, computed values, and action handlers
 */
export function useGameSession() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Compute remaining time from timestamps (not stored in state to avoid drift)
  // This is recalculated on each render when running
  const remainingMs = useMemo(() => {
    if (state.status !== 'running' || !state.startTime) {
      return state.config.duration;
    }
    return Math.max(0, state.startTime + state.config.duration - Date.now());
  }, [state.status, state.startTime, state.config.duration, state.currentTime]);
  
  // Compute accuracy percentage from hits and misses
  const accuracy = useMemo(() => {
    const total = state.hits + state.misses;
    if (total === 0) return 0;
    return Math.round((state.hits / total) * 100);
  }, [state.hits, state.misses]);
  
  // Countdown timer: ticks every second during countdown phase
  useInterval(
    () => {
      if (state.countdownValue > 1) {
        dispatch({ type: 'COUNTDOWN_TICK' });
      } else {
        dispatch({ type: 'START_SESSION' });
      }
    },
    state.status === 'countdown' ? 1000 : null
  );
  
  // Session timer: checks every 100ms for end condition during running phase
  useInterval(
    () => {
      // Re-check remaining time each tick (computed value may have changed)
      const currentRemainingMs = state.startTime 
        ? Math.max(0, state.startTime + state.config.duration - Date.now())
        : state.config.duration;
        
      if (currentRemainingMs <= 0) {
        dispatch({ type: 'END_SESSION' });
      }
    },
    state.status === 'running' ? 100 : null
  );
  
  // Timer display: update currentTime to trigger re-renders for countdown display
  useInterval(
    () => {
      dispatch({ type: 'TIMER_TICK', time: Date.now() });
    },
    state.status === 'running' ? 1000 : null
  );
  
  // Action: Update session configuration (before starting)
  const configure = useCallback((config: GameConfig) => {
    dispatch({ type: 'CONFIGURE', config });
  }, []);
  
  // Action: Begin the countdown sequence
  const startGame = useCallback(() => {
    dispatch({ type: 'START_COUNTDOWN' });
  }, []);
  
  // Action: Spawn a new target note (avoids consecutive duplicates)
  const spawnNote = useCallback(() => {
    const lastNote = state.activeNotes[state.activeNotes.length - 1];
    const excludeNote = lastNote ? { note: lastNote.note, octave: lastNote.octave } : null;
    const newNote = generateRandomNote(state.config.handPosition, excludeNote);
    
    const targetNote: TargetNote = {
      id: createNoteId(),
      note: newNote.note,
      octave: newNote.octave,
      spawnTime: Date.now(),
      hitTime: null,
      status: 'pending',
    };
    
    dispatch({ type: 'SPAWN_NOTE', note: targetNote });
  }, [state.activeNotes, state.config.handPosition]);
  
  // Action: Record a successful hit on a target note
  const recordHit = useCallback((noteId: string, playedNote: string, playedOctave: number) => {
    dispatch({ type: 'NOTE_HIT', noteId, playedNote, playedOctave });
  }, []);
  
  // Action: Record a miss (note scrolled past without being hit)
  const recordMiss = useCallback((noteId: string) => {
    dispatch({ type: 'NOTE_MISSED', noteId });
  }, []);
  
  // Action: Reset to initial idle state
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);
  
  return {
    // State
    state,
    // Computed values
    remainingMs,
    accuracy,
    // Actions
    configure,
    startGame,
    spawnNote,
    recordHit,
    recordMiss,
    reset,
  };
}
