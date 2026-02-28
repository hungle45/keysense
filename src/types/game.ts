/**
 * Game loop type definitions for KeySense practice sessions.
 * 
 * This module defines the core contracts for the rhythm-game style
 * practice mode where notes scroll across a staff and users play
 * them in real-time.
 */

/**
 * Hand positions determine the note range for practice.
 * Each position covers a full octave of natural notes.
 */
export type HandPosition = 
  | 'middle-c'      // C4-C5 (Middle C position, treble clef)
  | 'g-position'    // G3-G4 (G below middle C, crosses clefs)
  | 'f-position';   // F3-F4 (F below middle C, bass clef)

/**
 * Scroll speed presets for note movement across the staff.
 */
export type ScrollSpeed = 'slow' | 'medium' | 'fast';

/**
 * Scroll speed values in pixels per second.
 * Determines how fast notes travel from spawn to timing line.
 */
export const SCROLL_SPEEDS: Record<ScrollSpeed, number> = {
  slow: 50,
  medium: 100,
  fast: 150,
};

/**
 * Available session durations in milliseconds.
 */
export const SESSION_DURATIONS = {
  '1min': 60_000,
  '5min': 300_000,
} as const;

/**
 * Type-safe session duration keys.
 */
export type SessionDuration = keyof typeof SESSION_DURATIONS;

/**
 * Configuration for a practice session.
 * Set before the session starts and remains constant throughout.
 */
export interface GameConfig {
  /** Total session duration in milliseconds */
  duration: number;
  /** Hand position determining note range */
  handPosition: HandPosition;
  /** Speed at which notes scroll across the staff */
  scrollSpeed: ScrollSpeed;
}

/**
 * A target note displayed on the scrolling staff.
 * Created when spawned, updated when hit or missed.
 */
export interface TargetNote {
  /** Unique identifier for React key and state management */
  id: string;
  /** Note name (C, D, E, F, G, A, B - natural notes only) */
  note: string;
  /** Octave number (e.g., 4 for C4) */
  octave: number;
  /** Timestamp when the note was spawned */
  spawnTime: number;
  /** Timestamp when the note was hit (null if not yet hit or missed) */
  hitTime: number | null;
  /** Current status of this note in the game */
  status: 'pending' | 'hit' | 'missed';
}

/**
 * Record of a single note attempt during the session.
 * Stored in history for post-session review.
 */
export interface NoteAttempt {
  /** The target note that was presented */
  targetNote: TargetNote;
  /** The note the user actually played (null if missed without playing) */
  playedNote: string | null;
  /** The octave the user actually played (null if missed) */
  playedOctave: number | null;
  /** Whether the attempt was successful */
  wasHit: boolean;
  /** Timestamp when this attempt was recorded */
  timestamp: number;
}

/**
 * The current phase of the game session.
 * Forms a state machine: idle -> countdown -> running -> complete
 */
export type GameStatus = 'idle' | 'countdown' | 'running' | 'complete';

/**
 * Complete game state managed by useReducer.
 * Designed as a discriminated union state machine.
 */
export interface GameState {
  /** Current phase of the session */
  status: GameStatus;
  /** Session configuration (set during idle, constant during play) */
  config: GameConfig;
  /** Timestamp when the running phase started (null before running) */
  startTime: number | null;
  /** Current countdown value (3, 2, 1, 0) during countdown phase */
  countdownValue: number;
  /** Notes currently visible on the scrolling staff */
  activeNotes: TargetNote[];
  /** All completed note attempts for session history */
  noteHistory: NoteAttempt[];
  /** Count of successfully hit notes */
  hits: number;
  /** Count of missed notes */
  misses: number;
}

/**
 * Actions that can be dispatched to update game state.
 * Discriminated union ensures type-safe action handling.
 */
export type GameAction =
  /** Update session configuration before starting */
  | { type: 'CONFIGURE'; config: GameConfig }
  /** Begin the 3-2-1 countdown sequence */
  | { type: 'START_COUNTDOWN' }
  /** Decrement the countdown value by 1 */
  | { type: 'COUNTDOWN_TICK' }
  /** Transition from countdown to running (start the session) */
  | { type: 'START_SESSION' }
  /** Add a new target note to the active notes */
  | { type: 'SPAWN_NOTE'; note: TargetNote }
  /** Record a successful hit on a target note */
  | { type: 'NOTE_HIT'; noteId: string; playedNote: string; playedOctave: number }
  /** Record a miss (note scrolled past without being hit) */
  | { type: 'NOTE_MISSED'; noteId: string }
  /** End the session (timer reached zero) */
  | { type: 'END_SESSION' }
  /** Reset to initial idle state */
  | { type: 'RESET' };
