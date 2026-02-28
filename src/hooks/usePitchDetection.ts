import { useState, useRef, useCallback, useEffect } from 'react';
import { createPitchDetector, PitchDetectorWrapper } from '@/lib/pitch/detector';
import { frequencyToNote } from '@/lib/pitch/notes';
import { calculateCents } from '@/lib/pitch/cents';
import { calculateRMS } from '@/lib/audio/analyser';
import type { PitchResult } from '@/types/pitch';

// ============================================================================
// NOISE GATE & STABILIZATION CONFIGURATION
// ============================================================================

// HYSTERESIS GATE: Two thresholds for smooth open/close behavior
// - OPEN threshold: Signal must exceed this to START detecting (more selective)
// - CLOSE threshold: Signal must drop below this to STOP detecting (allows fade-out)
const GATE_OPEN_MULTIPLIER = 1.5;   // noiseFloor * 1.5 to open gate
const GATE_CLOSE_MULTIPLIER = 1.1;  // noiseFloor * 1.1 to close gate

// Default noise floor RMS if calibration hasn't run
// Very conservative - will gate most silence
const DEFAULT_NOISE_FLOOR_RMS = 0.001;

// TIME-BASED HOLD: Note must be consistent for this duration before display
// More reliable than frame count (independent of frame rate)
// Research suggests 80-130ms is optimal - using 100ms as sweet spot
const CONSISTENCY_HOLD_TIME_MS = 100;

// Silence timeout: how long to wait before clearing display after silence
// Allows natural piano note decay
const SILENCE_TIMEOUT_MS = 150;

// C5 frequency threshold for adaptive clarity
const C5_FREQUENCY = 523.25;

// ============================================================================
// TYPES
// ============================================================================

export interface UsePitchDetectionOptions {
  noiseFloor: number | null;      // dB value (for display only, not used in gate)
  noiseFloorRMS: number | null;   // Linear RMS value (used for noise gate)
}

// Debug info for RMS visual feedback
export interface RMSDebugInfo {
  currentRMS: number;
  openThreshold: number;
  closeThreshold: number;
  gateOpen: boolean;
}

interface ConsistencyState {
  note: string | null;            // Note being tracked (e.g., "C4")
  startTime: number;              // When this note started being detected (ms)
  lastPitch: PitchResult | null;  // Most recent pitch data for this note
  confirmed: boolean;             // Has this note been confirmed (displayed)?
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
  const [rmsDebug, setRmsDebug] = useState<RMSDebugInfo>({
    currentRMS: 0,
    openThreshold: 0,
    closeThreshold: 0,
    gateOpen: false,
  });

  const detectorRef = useRef<PitchDetectorWrapper | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Hysteresis gate state
  const gateOpenRef = useRef<boolean>(false);
  
  // Time-based consistency tracking
  const consistencyRef = useRef<ConsistencyState>({
    note: null,
    startTime: 0,
    lastPitch: null,
    confirmed: false,
  });
  
  // Silence tracking for clearing display (time-based)
  const silenceStartRef = useRef<number | null>(null);

  const detect = useCallback(() => {
    if (!analyserRef.current || !detectorRef.current || !audioContext || !stream) {
      return;
    }

    const analyser = analyserRef.current;
    const detector = detectorRef.current;
    const sampleRate = audioContext.sampleRate;
    const now = performance.now();

    // Get time-domain data for RMS calculation
    const dataArray = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(dataArray);

    // Calculate LINEAR RMS (0 to 1 scale, NOT decibels)
    const currentRMS = calculateRMS(dataArray);

    // HYSTERESIS NOISE GATE: Two thresholds for smooth behavior
    // - Need higher signal to OPEN gate (start detecting)
    // - Can stay open with lower signal (allow natural note decay)
    const noiseFloorRMS = options.noiseFloorRMS ?? DEFAULT_NOISE_FLOOR_RMS;
    const openThreshold = noiseFloorRMS * GATE_OPEN_MULTIPLIER;
    const closeThreshold = noiseFloorRMS * GATE_CLOSE_MULTIPLIER;
    
    // Update gate state using hysteresis logic
    if (!gateOpenRef.current && currentRMS >= openThreshold) {
      // Gate was closed, signal exceeded open threshold - OPEN IT
      gateOpenRef.current = true;
    } else if (gateOpenRef.current && currentRMS < closeThreshold) {
      // Gate was open, signal dropped below close threshold - CLOSE IT
      gateOpenRef.current = false;
    }
    // Otherwise: gate stays in current state (hysteresis zone)
    
    // Update RMS debug info for visual feedback
    setRmsDebug({
      currentRMS,
      openThreshold,
      closeThreshold,
      gateOpen: gateOpenRef.current,
    });
    
    if (!gateOpenRef.current) {
      // Gate is closed - DON'T run pitch detector at all
      
      // Start silence timer if not already started
      if (silenceStartRef.current === null) {
        silenceStartRef.current = now;
      }
      
      // Check if silence timeout has elapsed
      const silenceDuration = now - silenceStartRef.current;
      if (silenceDuration >= SILENCE_TIMEOUT_MS) {
        // Sustained silence - clear display and reset consistency
        consistencyRef.current = { note: null, startTime: 0, lastPitch: null, confirmed: false };
        setPitch(null);
      }
      // If not enough silence time yet, keep displaying current note (natural decay)
      
      animationFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    // Gate is open - reset silence timer and run pitch detector
    silenceStartRef.current = null;
    
    const result = detector.findPitch(dataArray, sampleRate);

    if (result) {
      const { frequency, clarity } = result;
      
      // ADAPTIVE CLARITY: Lower threshold for high notes (above C5)
      // High notes have more complex harmonics that reduce clarity
      const minClarity = frequency > C5_FREQUENCY ? 0.85 : 0.9;
      
      if (clarity < minClarity) {
        // Clarity too low even with adaptive threshold - treat as no detection
        consistencyRef.current = { note: null, startTime: 0, lastPitch: null, confirmed: false };
        animationFrameRef.current = requestAnimationFrame(detect);
        return;
      }
      
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

      // TIME-BASED CONSISTENCY CHECK
      if (consistencyRef.current.note === noteKey) {
        // Same note as before - update pitch data
        consistencyRef.current.lastPitch = newPitch;
        
        // Check if hold time has elapsed
        const heldDuration = now - consistencyRef.current.startTime;
        if (heldDuration >= CONSISTENCY_HOLD_TIME_MS || consistencyRef.current.confirmed) {
          // Note has been consistent long enough, OR already confirmed - update display
          consistencyRef.current.confirmed = true;
          setPitch(newPitch);
        }
        // If not enough time yet, keep previous display
      } else {
        // Different note - reset tracking with new note
        consistencyRef.current = {
          note: noteKey,
          startTime: now,
          lastPitch: newPitch,
          confirmed: false,
        };
      }
      
    } else {
      // Detector returned null (out of frequency range)
      // Reset consistency - can't build on out-of-range detections
      consistencyRef.current = { note: null, startTime: 0, lastPitch: null, confirmed: false };
      // Don't clear display immediately - let silence timeout handle it
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
      consistencyRef.current = { note: null, startTime: 0, lastPitch: null, confirmed: false };
      silenceStartRef.current = null;
    };
  }, [audioContext, stream, detect]);

  return { pitch, isDetecting, rmsDebug };
}
