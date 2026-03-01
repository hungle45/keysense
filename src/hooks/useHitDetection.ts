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
// Reduced from 200ms to 150ms for better responsiveness
const SUSTAIN_DURATION_MS = 150;

// ============================================================================
// STRONG INPUT GATE THRESHOLDS
// ============================================================================

// Volume must be above this (roughly -40dB)
const MIN_RMS_THRESHOLD = 0.01;

// Clarity must be above this
const MIN_CLARITY_THRESHOLD = 0.85;

// Decay detection: If RMS drops by this ratio, note is decaying
// 30% drop from peak indicates decay (likely harmonic artifact)
const DECAY_RATIO_THRESHOLD = 0.7;

export function useHitDetection({
  pitch,
  activeNotes,
  scrollSpeed,
  containerWidth,
  isRunning,
  onHit,
}: UseHitDetectionOptions) {
  // Track sustained note detection with volume tracking
  const sustainedNoteRef = useRef<{
    noteId: string;
    startTime: number;
    note: string;
    octave: number;
    peakRMS: number;      // Track peak volume for decay detection
    lastRMS: number;      // Track last RMS for trend
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
  
  // Strong Input Gate: Both volume AND clarity must be above thresholds
  // This filters out noise, coughs, background sounds
  const isStrongInput = useCallback((p: PitchResult): boolean => {
    return p.rms >= MIN_RMS_THRESHOLD && p.clarity >= MIN_CLARITY_THRESHOLD;
  }, []);
  
  // Detect if note is decaying (volume decreasing significantly)
  // Used to filter out octave jump artifacts during note decay
  const isDecaying = useCallback((currentRMS: number, peakRMS: number): boolean => {
    return currentRMS < peakRMS * DECAY_RATIO_THRESHOLD;
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
    
    // Gate 1: Require strong input (volume + clarity)
    // This filters out noise, coughs, background sounds
    if (!isStrongInput(pitch)) {
      // Weak input - don't start or continue tracking
      sustainedNoteRef.current = null;
      return;
    }
    
    const matchingNote = findMatchingNote();
    const sustained = sustainedNoteRef.current;
    
    if (matchingNote) {
      if (sustained && sustained.noteId === matchingNote.id) {
        // Same note still being played
        
        // Gate 2: Check for decay (octave jump artifact)
        // If volume is decreasing significantly, ignore (it's a harmonic artifact)
        if (isDecaying(pitch.rms, sustained.peakRMS)) {
          // Volume dropping - likely decay artifact, don't count as hit
          // But don't reset tracking - wait for strong input again
          return;
        }
        
        // Update peak RMS if current is higher
        if (pitch.rms > sustained.peakRMS) {
          sustained.peakRMS = pitch.rms;
        }
        sustained.lastRMS = pitch.rms;
        
        // Check sustain duration
        const sustainedDuration = Date.now() - sustained.startTime;
        if (sustainedDuration >= SUSTAIN_DURATION_MS) {
          // Success! Sustained correct note with strong input
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
          peakRMS: pitch.rms,
          lastRMS: pitch.rms,
        };
      }
    } else {
      // No matching note - reset sustained tracking
      // (Wrong note is silent - no negative feedback per user decision)
      sustainedNoteRef.current = null;
    }
  }, [pitch, isRunning, findMatchingNote, onHit, isStrongInput, isDecaying]);
  
  return {
    // Expose for debugging/visualization if needed
    sustainedNote: sustainedNoteRef.current,
    hitWindowPixels: HIT_WINDOW_PIXELS,
    // Debug info: expose thresholds
    thresholds: {
      rms: MIN_RMS_THRESHOLD,
      clarity: MIN_CLARITY_THRESHOLD,
      sustainMs: SUSTAIN_DURATION_MS,
    },
  };
}
