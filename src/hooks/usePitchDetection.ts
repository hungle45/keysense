import { useState, useRef, useCallback, useEffect } from 'react';
import { createPitchDetector, PitchDetectorWrapper } from '@/lib/pitch/detector';
import { frequencyToNote } from '@/lib/pitch/notes';
import { calculateCents } from '@/lib/pitch/cents';
import { calculateRMS, rmsToDecibels } from '@/lib/audio/analyser';
import type { PitchResult } from '@/types/pitch';

// ============================================================================
// PITCH STABILIZATION CONFIGURATION
// ============================================================================

// Voting system: Buffer of recent notes to find most frequent
const VOTE_BUFFER_SIZE = 10;

// Temporal debouncing: Lock note display to prevent rapid changes
const NOTE_LOCK_TIME_MS = 150;

// Volume gate: Number of consecutive silent frames before clearing buffer
const SILENCE_FRAMES_TO_CLEAR = 5;

// ============================================================================
// HELPER: Note key for voting (combines note name + octave)
// ============================================================================
function getNoteKey(pitch: PitchResult): string {
  return `${pitch.note}${pitch.octave}`;
}

// ============================================================================
// HELPER: Find most frequent note in buffer (voting system)
// ============================================================================
function getMostFrequentNote(buffer: PitchResult[]): PitchResult | null {
  if (buffer.length === 0) return null;
  
  // Count occurrences of each note
  const counts = new Map<string, { count: number; pitch: PitchResult }>();
  
  for (const pitch of buffer) {
    const key = getNoteKey(pitch);
    const existing = counts.get(key);
    if (existing) {
      existing.count++;
      // Keep the most recent pitch data for this note (better cents accuracy)
      existing.pitch = pitch;
    } else {
      counts.set(key, { count: 1, pitch });
    }
  }
  
  // Find the most frequent note
  let maxCount = 0;
  let winner: PitchResult | null = null;
  
  for (const { count, pitch } of counts.values()) {
    if (count > maxCount) {
      maxCount = count;
      winner = pitch;
    }
  }
  
  return winner;
}

export interface UsePitchDetectionOptions {
  noiseFloor: number | null;
}

export function usePitchDetection(
  audioContext: AudioContext | null,
  stream: MediaStream | null,
  options: UsePitchDetectionOptions
) {
  const [pitch, setPitch] = useState<PitchResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const detectorRef = useRef<PitchDetectorWrapper | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Voting system: sliding window buffer of recent detections
  const voteBufferRef = useRef<PitchResult[]>([]);
  
  // Temporal debouncing: track when note was last changed
  const lastNoteChangeTimeRef = useRef<number>(0);
  const currentDisplayedNoteRef = useRef<string | null>(null);
  
  // Volume gate: track consecutive silent frames
  const silentFrameCountRef = useRef<number>(0);

  const detect = useCallback(() => {
    if (!analyserRef.current || !detectorRef.current || !audioContext || !stream) {
      return;
    }

    const analyser = analyserRef.current;
    const detector = detectorRef.current;
    const sampleRate = audioContext.sampleRate;

    const dataArray = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(dataArray);

    const rms = calculateRMS(dataArray);
    const db = rmsToDecibels(rms);

    const effectiveNoiseFloor = options.noiseFloor !== null ? options.noiseFloor : -60;
    const now = performance.now();

    // Check if we're above the noise floor (sound detected)
    if (db > effectiveNoiseFloor + 10) {
      // Reset silence counter - we have sound
      silentFrameCountRef.current = 0;
      
      const result = detector.findPitch(dataArray, sampleRate);

      if (result) {
        const { frequency, clarity } = result;
        const noteResult = frequencyToNote(frequency);
        const cents = calculateCents(frequency, noteResult.frequency);

        const newPitch: PitchResult = {
          frequency,
          note: noteResult.note,
          octave: noteResult.octave,
          cents,
          clarity,
        };

        // Add to vote buffer (sliding window)
        voteBufferRef.current.push(newPitch);
        if (voteBufferRef.current.length > VOTE_BUFFER_SIZE) {
          voteBufferRef.current.shift();
        }

        // Get the winning note from voting
        const winningPitch = getMostFrequentNote(voteBufferRef.current);
        
        if (winningPitch) {
          const winningNoteKey = getNoteKey(winningPitch);
          const timeSinceLastChange = now - lastNoteChangeTimeRef.current;
          
          // Temporal debouncing: only change displayed note if lock time has passed
          // OR if this is the first note being displayed
          if (
            currentDisplayedNoteRef.current === null ||
            currentDisplayedNoteRef.current === winningNoteKey ||
            timeSinceLastChange >= NOTE_LOCK_TIME_MS
          ) {
            // Update displayed note
            if (currentDisplayedNoteRef.current !== winningNoteKey) {
              currentDisplayedNoteRef.current = winningNoteKey;
              lastNoteChangeTimeRef.current = now;
            }
            setPitch(winningPitch);
          }
          // If locked and different note, keep displaying current note (no setPitch call)
        }
      }
      // If detector returned null (low clarity), we just don't add to buffer
      // The voting system will naturally smooth over occasional misses
      
    } else {
      // Below noise floor - VOLUME GATE
      silentFrameCountRef.current++;
      
      if (silentFrameCountRef.current >= SILENCE_FRAMES_TO_CLEAR) {
        // Clear the vote buffer on sustained silence
        voteBufferRef.current = [];
        currentDisplayedNoteRef.current = null;
        setPitch(null);
      }
      // If not enough silent frames yet, keep displaying current note (natural decay)
    }

    animationFrameRef.current = requestAnimationFrame(detect);
  }, [audioContext, stream, options.noiseFloor]);

  useEffect(() => {
    if (!audioContext || !stream) {
      return;
    }

    detectorRef.current = createPitchDetector(2048);

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    sourceRef.current = source;

    setIsDetecting(true);
    detect();

    return () => {
      setIsDetecting(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      detectorRef.current = null;
      // Reset stabilization state
      voteBufferRef.current = [];
      currentDisplayedNoteRef.current = null;
      lastNoteChangeTimeRef.current = 0;
      silentFrameCountRef.current = 0;
    };
  }, [audioContext, stream, detect]);

  return { pitch, isDetecting };
}
