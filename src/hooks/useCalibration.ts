import { useState, useRef, useCallback } from 'react';
import { getAudioContext } from '@/lib/audio/audio-context';
import { createAnalyser, getTimeDomainData, calculateRMS, rmsToDecibels } from '@/lib/audio/analyser';
import { PIANO_MIN_FREQ, PIANO_MAX_FREQ, CALIBRATION_DURATION_MS, CALIBRATION_SAMPLE_INTERVAL_MS } from '@/lib/constants';
import type { CalibrationResult } from '@/types/audio';

// LocalStorage key for persisting calibration
const CALIBRATION_STORAGE_KEY = 'keysense_calibration';

interface StoredCalibration {
  noiseFloor: number;
  noiseFloorRMS: number;
  frequencyRange: { min: number; max: number };
  timestamp: number;
}

function loadStoredCalibration(): StoredCalibration | null {
  try {
    const stored = localStorage.getItem(CALIBRATION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveCalibration(data: StoredCalibration): void {
  try {
    localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

function clearStoredCalibration(): void {
  try {
    localStorage.removeItem(CALIBRATION_STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

export function useCalibration() {
  // Initialize state from localStorage
  const stored = loadStoredCalibration();
  
  const [noiseFloor, setNoiseFloor] = useState<number | null>(stored?.noiseFloor ?? null);
  const [noiseFloorRMS, setNoiseFloorRMS] = useState<number | null>(stored?.noiseFloorRMS ?? null);
  const [frequencyRange, setFrequencyRange] = useState<{ min: number; max: number } | null>(stored?.frequencyRange ?? null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [currentDb, setCurrentDb] = useState<number>(-100);
  const [hasCalibrated, setHasCalibrated] = useState(stored !== null);
  
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const detectFrequencyRange = useCallback((analyser: AnalyserNode): { min: number; max: number } => {
    const bufferLength = analyser.frequencyBinCount;
    const sampleRate = analyser.context.sampleRate;
    const frequencyData = new Float32Array(bufferLength);
    analyser.getFloatFrequencyData(frequencyData);
    
    let minFreq = PIANO_MAX_FREQ;
    let maxFreq = PIANO_MIN_FREQ;
    
    const binWidth = sampleRate / (bufferLength * 2);
    
    for (let i = 0; i < bufferLength; i++) {
      const freq = i * binWidth;
      if (freq < PIANO_MIN_FREQ || freq > PIANO_MAX_FREQ) continue;
      
      const db = frequencyData[i];
      if (db > -60) {
        if (freq < minFreq) minFreq = freq;
        if (freq > maxFreq) maxFreq = freq;
      }
    }
    
    if (minFreq === PIANO_MAX_FREQ) minFreq = PIANO_MIN_FREQ;
    if (maxFreq === PIANO_MIN_FREQ) maxFreq = PIANO_MAX_FREQ;
    
    return { min: minFreq, max: maxFreq };
  }, []);

  const startCalibration = useCallback(async (stream: MediaStream, durationMs: number = CALIBRATION_DURATION_MS): Promise<CalibrationResult> => {
    setIsCalibrating(true);
    setNoiseFloor(null);
    setFrequencyRange(null);
    setCurrentDb(-100);
    
    const audioContext = getAudioContext();
    const analyser = createAnalyser(audioContext);
    analyserRef.current = analyser;
    
    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;
    source.connect(analyser);
    
    const dbReadings: number[] = [];
    const rmsReadings: number[] = [];
    
    return new Promise((resolve) => {
      intervalRef.current = setInterval(() => {
        const dataArray = getTimeDomainData(analyser);
        const rms = calculateRMS(dataArray);
        const db = rmsToDecibels(rms);
        dbReadings.push(db);
        rmsReadings.push(rms);
        setCurrentDb(db);
      }, CALIBRATION_SAMPLE_INTERVAL_MS);
      
      setTimeout(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        if (dbReadings.length > 0) {
          // Calculate AVERAGE linear RMS (not percentile) for noise floor
          // This gives a stable baseline for the noise gate
          const avgRMS = rmsReadings.reduce((sum, val) => sum + val, 0) / rmsReadings.length;
          const noiseFloorRMSValue = avgRMS;
          
          // Keep dB value for display purposes only (average dB)
          const avgDb = dbReadings.reduce((sum, val) => sum + val, 0) / dbReadings.length;
          const noiseFloorValue = avgDb;
          
          setNoiseFloor(noiseFloorValue);
          setNoiseFloorRMS(noiseFloorRMSValue);
          
          const freqRange = detectFrequencyRange(analyser);
          setFrequencyRange(freqRange);
          
          // Persist to localStorage
          saveCalibration({
            noiseFloor: noiseFloorValue,
            noiseFloorRMS: noiseFloorRMSValue,
            frequencyRange: freqRange,
            timestamp: Date.now(),
          });
          setHasCalibrated(true);
          
          setIsCalibrating(false);
          
          resolve({
            noiseFloor: noiseFloorValue,
            noiseFloorRMS: noiseFloorRMSValue,
            frequencyRange: freqRange,
          });
        } else {
          setIsCalibrating(false);
          resolve({
            noiseFloor: -60,
            noiseFloorRMS: 0.001, // Very low default RMS
            frequencyRange: { min: PIANO_MIN_FREQ, max: PIANO_MAX_FREQ },
          });
        }
      }, durationMs);
    });
  }, [detectFrequencyRange]);

  const reset = useCallback(() => {
    setNoiseFloor(null);
    setNoiseFloorRMS(null);
    setFrequencyRange(null);
    setIsCalibrating(false);
    setCurrentDb(-100);
    setHasCalibrated(false);
    clearStoredCalibration();
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    analyserRef.current = null;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return {
    noiseFloor,
    noiseFloorRMS,
    frequencyRange,
    isCalibrating,
    currentDb,
    hasCalibrated,
    startCalibration,
    reset,
  };
}
