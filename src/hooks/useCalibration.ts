import { useState, useRef, useCallback } from 'react';
import { getAudioContext } from '@/lib/audio/audio-context';
import { createAnalyser, getTimeDomainData, calculateRMS, rmsToDecibels } from '@/lib/audio/analyser';
import { PIANO_MIN_FREQ, PIANO_MAX_FREQ, CALIBRATION_DURATION_MS, CALIBRATION_SAMPLE_INTERVAL_MS } from '@/lib/constants';
import type { CalibrationResult } from '@/types/audio';

export function useCalibration() {
  const [noiseFloor, setNoiseFloor] = useState<number | null>(null);
  const [frequencyRange, setFrequencyRange] = useState<{ min: number; max: number } | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [currentDb, setCurrentDb] = useState<number>(-100);
  
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
    
    const readings: number[] = [];
    
    return new Promise((resolve) => {
      intervalRef.current = setInterval(() => {
        const dataArray = getTimeDomainData(analyser);
        const rms = calculateRMS(dataArray);
        const db = rmsToDecibels(rms);
        readings.push(db);
        setCurrentDb(db);
      }, CALIBRATION_SAMPLE_INTERVAL_MS);
      
      setTimeout(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        if (readings.length > 0) {
          readings.sort((a, b) => a - b);
          const percentileIndex = Math.floor(readings.length * 0.9);
          const noiseFloorValue = readings[percentileIndex] || readings[readings.length - 1];
          
          setNoiseFloor(noiseFloorValue);
          
          const freqRange = detectFrequencyRange(analyser);
          setFrequencyRange(freqRange);
          
          setIsCalibrating(false);
          
          resolve({
            noiseFloor: noiseFloorValue,
            frequencyRange: freqRange,
          });
        } else {
          setIsCalibrating(false);
          resolve({
            noiseFloor: -60,
            frequencyRange: { min: PIANO_MIN_FREQ, max: PIANO_MAX_FREQ },
          });
        }
      }, durationMs);
    });
  }, [detectFrequencyRange]);

  const reset = useCallback(() => {
    setNoiseFloor(null);
    setFrequencyRange(null);
    setIsCalibrating(false);
    setCurrentDb(-100);
    
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
    frequencyRange,
    isCalibrating,
    currentDb,
    startCalibration,
    reset,
  };
}
