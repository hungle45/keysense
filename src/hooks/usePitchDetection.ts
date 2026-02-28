import { useState, useRef, useCallback, useEffect } from 'react';
import { createPitchDetector, PitchDetectorWrapper } from '@/lib/pitch/detector';
import { frequencyToNote } from '@/lib/pitch/notes';
import { calculateCents } from '@/lib/pitch/cents';
import { calculateRMS } from '@/lib/audio/analyser';
import type { PitchResult } from '@/types/pitch';

// ============================================================================
// SIMPLE NOISE GATE CONFIGURATION
// ============================================================================

// Simple threshold multiplier: current RMS must be > noiseFloor * this value
const NOISE_GATE_MULTIPLIER = 2.0;

// Default noise floor RMS if calibration hasn't run
const DEFAULT_NOISE_FLOOR_RMS = 0.001;

// ============================================================================
// TYPES
// ============================================================================

export interface UsePitchDetectionOptions {
  noiseFloor: number | null;      // dB value (for display/reference)
  noiseFloorRMS: number | null;   // Linear RMS value (used for noise gate)
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

  const detect = useCallback(() => {
    if (!analyserRef.current || !detectorRef.current || !audioContext || !stream) {
      return;
    }

    const analyser = analyserRef.current;
    const detector = detectorRef.current;
    const sampleRate = audioContext.sampleRate;

    // Get time-domain data
    const dataArray = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(dataArray);

    // Calculate RMS for noise gate
    const currentRMS = calculateRMS(dataArray);
    const noiseFloorRMS = options.noiseFloorRMS ?? DEFAULT_NOISE_FLOOR_RMS;
    const threshold = noiseFloorRMS * NOISE_GATE_MULTIPLIER;

    // Simple noise gate: if below threshold, show "Play a note"
    if (currentRMS < threshold) {
      setPitch(null);
      animationFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    // Above threshold - run pitch detection
    const result = detector.findPitch(dataArray, sampleRate);

    if (result) {
      const { frequency, clarity } = result;
      const noteResult = frequencyToNote(frequency);
      const cents = calculateCents(frequency, noteResult.frequency);

      setPitch({
        frequency,
        note: noteResult.note,
        octave: noteResult.octave,
        cents,
        clarity,
      });
    } else {
      // Pitch detector returned null (low clarity or out of range)
      setPitch(null);
    }

    animationFrameRef.current = requestAnimationFrame(detect);
  }, [audioContext, stream, options.noiseFloorRMS]);

  useEffect(() => {
    if (!audioContext || !stream) {
      return;
    }

    // Use 4096 samples for better low-frequency resolution
    // At 48kHz: ~85ms window, enough for 2+ cycles of A0 (27.5Hz, period=36ms)
    const fftSize = 4096;
    
    detectorRef.current = createPitchDetector(fftSize);

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;
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
    };
  }, [audioContext, stream, detect]);

  return { pitch, isDetecting };
}
