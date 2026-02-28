import { useEffect, useRef, useCallback } from 'react';
import type { PitchResult } from '@/types/pitch';
import type { TargetNote, ScrollSpeed } from '@/types/game';
import { SCROLL_SPEEDS } from '@/types/game';
import { TIMING_LINE_X } from '@/components/game/TimingLine';

interface UseHitDetectionOptions {
  pitch: PitchResult | null;
  activeNotes: TargetNote[];
  scrollSpeed: ScrollSpeed;
  containerWidth: number;
  isRunning: boolean;
  onHit: (noteId: string, playedNote: string, playedOctave: number) => void;
}

// Hit window: how close to timing line a note must be to count (pixels)
const HIT_WINDOW_PIXELS = 40;  // +/- 40 pixels from timing line

// Sustain requirement: how long correct note must be held (ms)
const SUSTAIN_DURATION_MS = 200;

export function useHitDetection({
  pitch,
  activeNotes,
  scrollSpeed,
  containerWidth,
  isRunning,
  onHit,
}: UseHitDetectionOptions) {
  // Track sustained note detection
  const sustainedNoteRef = useRef<{
    noteId: string;
    startTime: number;
    note: string;
    octave: number;
  } | null>(null);
  
  // Calculate current X position of a note
  const getNoteX = useCallback((note: TargetNote): number => {
    const elapsed = Date.now() - note.spawnTime;
    const pixelsPerMs = SCROLL_SPEEDS[scrollSpeed] / 1000;
    return containerWidth - (elapsed * pixelsPerMs);
  }, [scrollSpeed, containerWidth]);
  
  // Check if note is within hit window
  const isInHitWindow = useCallback((noteX: number): boolean => {
    return Math.abs(noteX - TIMING_LINE_X) <= HIT_WINDOW_PIXELS;
  }, []);
  
  // Find the note in hit window that matches the played pitch
  const findMatchingNote = useCallback((): TargetNote | null => {
    if (!pitch) return null;
    
    for (const note of activeNotes) {
      if (note.status !== 'pending') continue;
      
      const noteX = getNoteX(note);
      if (!isInHitWindow(noteX)) continue;
      
      // Exact match required: same note AND same octave (per user decision)
      if (note.note === pitch.note && note.octave === pitch.octave) {
        return note;
      }
    }
    
    return null;
  }, [pitch, activeNotes, getNoteX, isInHitWindow]);
  
  // Main detection effect
  useEffect(() => {
    if (!isRunning || !pitch) {
      // Reset sustained tracking when not running or no pitch
      sustainedNoteRef.current = null;
      return;
    }
    
    const matchingNote = findMatchingNote();
    
    if (matchingNote) {
      const sustained = sustainedNoteRef.current;
      
      if (sustained && sustained.noteId === matchingNote.id) {
        // Same note still being played - check if sustained long enough
        const sustainedDuration = Date.now() - sustained.startTime;
        
        if (sustainedDuration >= SUSTAIN_DURATION_MS) {
          // Hit! Note was sustained for required duration
          onHit(matchingNote.id, pitch.note, pitch.octave);
          sustainedNoteRef.current = null;  // Reset for next note
        }
        // Otherwise keep tracking this note
      } else {
        // New matching note detected - start tracking
        sustainedNoteRef.current = {
          noteId: matchingNote.id,
          startTime: Date.now(),
          note: pitch.note,
          octave: pitch.octave,
        };
      }
    } else {
      // No matching note - reset sustained tracking
      // (Wrong note is silent - no negative feedback per user decision)
      sustainedNoteRef.current = null;
    }
  }, [pitch, isRunning, findMatchingNote, onHit]);
  
  return {
    // Expose for debugging/visualization if needed
    sustainedNote: sustainedNoteRef.current,
    hitWindowPixels: HIT_WINDOW_PIXELS,
  };
}
