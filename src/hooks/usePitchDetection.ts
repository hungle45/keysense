import { useState, useRef, useCallback, useEffect } from 'react';
import { createPitchDetector, PitchDetectorWrapper } from '@/lib/pitch/detector';
import { frequencyToNote } from '@/lib/pitch/notes';
import { calculateCents } from '@/lib/pitch/cents';
import { calculateRMS, rmsToDecibels } from '@/lib/audio/analyser';
import type { PitchResult } from '@/types/pitch';

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

    if (db > effectiveNoiseFloor + 10) {
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
        setPitch(null);
      }
    } else {
      setPitch(null);
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
    };
  }, [audioContext, stream, detect]);

  return { pitch, isDetecting };
}
