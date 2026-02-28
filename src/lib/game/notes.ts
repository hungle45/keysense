/**
 * Note generation utilities for the game loop.
 * 
 * Handles random note selection within hand positions,
 * avoiding consecutive duplicates for musical variety.
 * Natural notes only (no sharps/flats) per user decision.
 */

import type { HandPosition } from '@/types/game';

/**
 * Natural notes used in practice (no sharps/flats per user decision).
 */
const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

/**
 * Hand position configurations defining note ranges.
 * Each position covers a full octave (8 notes: C-D-E-F-G-A-B-C).
 */
export const HAND_POSITIONS = {
  'middle-c': { 
    notes: NATURAL_NOTES, 
    baseOctave: 4,  // C4-B4 + C5
    clef: 'treble' as const 
  },
  'g-position': { 
    notes: NATURAL_NOTES, 
    baseOctave: 3,  // G3-F4 range (crosses clefs)
    clef: 'both' as const 
  },
  'f-position': { 
    notes: NATURAL_NOTES, 
    baseOctave: 3,  // F3-E4 range
    clef: 'bass' as const 
  },
} as const;

/**
 * Note with octave information for game display.
 */
export interface NoteWithOctave {
  note: string;
  octave: number;
}

/**
 * Get all possible notes for a given hand position.
 * Returns a full octave of notes (8 notes) for practice variety.
 * 
 * @param position - The hand position to get notes for
 * @returns Array of notes with their octave numbers
 */
export function getNotesForPosition(position: HandPosition): NoteWithOctave[] {
  const config = HAND_POSITIONS[position];
  const result: NoteWithOctave[] = [];
  
  // Generate all notes in the base octave
  for (const note of config.notes) {
    result.push({ note, octave: config.baseOctave });
  }
  
  // Add the octave note (e.g., C5 for middle-c position)
  result.push({ note: 'C', octave: config.baseOctave + 1 });
  
  return result;
}

/**
 * Generate a random note within the hand position range.
 * Avoids consecutive duplicates for musical variety.
 * 
 * @param position - The hand position determining available notes
 * @param excludeNote - Optional note to exclude (prevents consecutive duplicates)
 * @returns A randomly selected note with octave
 */
export function generateRandomNote(
  position: HandPosition,
  excludeNote?: NoteWithOctave | null
): NoteWithOctave {
  const possibleNotes = getNotesForPosition(position);
  
  // Filter out the excluded note if provided (avoids consecutive duplicates)
  const available = excludeNote
    ? possibleNotes.filter(n => !(n.note === excludeNote.note && n.octave === excludeNote.octave))
    : possibleNotes;
  
  // Select a random note from available options
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}

/**
 * Create a unique ID for a target note.
 * Combines timestamp and random string for uniqueness.
 * 
 * @returns A unique string ID for use as React key
 */
export function createNoteId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
