import { useState, useRef, useCallback, useEffect } from 'react';
import { createPitchDetector, PitchDetectorWrapper } from '@/lib/pitch/detector';
import { frequencyToNote } from '@/lib/pitch/notes';
import { calculateCents } from '@/lib/pitch/cents';
import { calculateRMS } from '@/lib/audio/analyser';
import type { PitchResult } from '@/types/pitch';

// ============================================================================
// NOISE GATE & STABILIZATION CONFIGURATION
// ============================================================================

// Noise gate multiplier: currentRMS must be > noiseFloor * this value
// 2.5x provides good margin above ambient noise without missing soft notes
const NOISE_GATE_MULTIPLIER = 2.5;

// Default noise floor RMS if calibration hasn't run
// Very conservative - will gate most silence
const DEFAULT_NOISE_FLOOR_RMS = 0.001;

// Consecutive frame consistency: note must be detected N times in a row
// before updating the UI. Prevents single-frame ghost notes.
const CONSECUTIVE_FRAMES_REQUIRED = 3;

// Silence frame threshold: how many silent frames before clearing display
const SILENCE_FRAMES_TO_CLEAR = 5;

// ============================================================================
// TYPES
// ============================================================================

export interface UsePitchDetectionOptions {
  noiseFloor: number | null;      // dB value (for display only, not used in gate)
  noiseFloorRMS: number | null;   // Linear RMS value (used for noise gate)
}

interface ConsistencyState {
  note: string | null;            // Note being tracked (e.g., "C4")
  count: number;                  // Consecutive frames with this note
  lastPitch: PitchResult | null;  // Most recent pitch data for this note
}

// ============================================================================
// MAIN HOOK
// ============================================================================

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
  
  // Consecutive frame consistency tracking
  const consistencyRef = useRef<ConsistencyState>({
    note: null,
    count: 0,
    lastPitch: null,
  });
  
  // Silence tracking for clearing display
  const silentFrameCountRef = useRef<number>(0);

  const detect = useCallback(() => {
    if (!analyserRef.current || !detectorRef.current || !audioContext || !stream) {
      return;
    }

    const analyser = analyserRef.current;
    const detector = detectorRef.current;
    const sampleRate = audioContext.sampleRate;

    // Get time-domain data for RMS calculation
    const dataArray = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(dataArray);

    // Calculate LINEAR RMS (0 to 1 scale, NOT decibels)
    const currentRMS = calculateRMS(dataArray);

    // NOISE GATE: Check if signal is above threshold BEFORE running pitch detector
    // This is the primary defense against ghost notes
    const noiseFloorRMS = options.noiseFloorRMS ?? DEFAULT_NOISE_FLOOR_RMS;
    const gateThreshold = noiseFloorRMS * NOISE_GATE_MULTIPLIER;
    
    if (currentRMS < gateThreshold) {
      // Below noise gate - DON'T run pitch detector at all
      silentFrameCountRef.current++;
      
      if (silentFrameCountRef.current >= SILENCE_FRAMES_TO_CLEAR) {
        // Sustained silence - clear display and reset consistency
        consistencyRef.current = { note: null, count: 0, lastPitch: null };
        setPitch(null);
      }
      // If not enough silent frames yet, keep displaying current note (natural decay)
      
      animationFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    // Above noise gate - reset silence counter and run pitch detector
    silentFrameCountRef.current = 0;
    
    const result = detector.findPitch(dataArray, sampleRate);

    if (result) {
      const { frequency, clarity } = result;
      
      // Detector already filters for clarity > 0.9 and piano frequency range
      const noteResult = frequencyToNote(frequency);
      const cents = calculateCents(frequency, noteResult.frequency);
      const noteKey = `${noteResult.note}${noteResult.octave}`;

      const newPitch: PitchResult = {
        frequency,
        note: noteResult.note,
        octave: noteResult.octave,
        cents,
        clarity,
      };

      // CONSECUTIVE FRAME CONSISTENCY CHECK
      if (consistencyRef.current.note === noteKey) {
        // Same note as before - increment count
        consistencyRef.current.count++;
        consistencyRef.current.lastPitch = newPitch;
      } else {
        // Different note - reset tracking
        consistencyRef.current = {
          note: noteKey,
          count: 1,
          lastPitch: newPitch,
        };
      }

      // Only update UI if note has been consistent for required frames
      if (consistencyRef.current.count >= CONSECUTIVE_FRAMES_REQUIRED) {
        setPitch(consistencyRef.current.lastPitch);
      }
      // If not enough consecutive frames yet, keep previous display
      
    } else {
      // Detector returned null (low clarity or out of frequency range)
      // Reset consistency - can't build on unclear detections
      consistencyRef.current = { note: null, count: 0, lastPitch: null };
      // Don't clear display immediately - let silence threshold handle it
    }

    animationFrameRef.current = requestAnimationFrame(detect);
  }, [audioContext, stream, options.noiseFloorRMS]);

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
      // Reset all tracking state
      consistencyRef.current = { note: null, count: 0, lastPitch: null };
      silentFrameCountRef.current = 0;
    };
  }, [audioContext, stream, detect]);

  return { pitch, isDetecting };
}
