export type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export interface AudioEngineState {
  audioContext: AudioContext | null;
  stream: MediaStream | null;
  isReady: boolean;
}

export interface CalibrationResult {
  noiseFloor: number;
  frequencyRange: {
    min: number;
    max: number;
  };
}

export interface CalibrationState {
  noiseFloor: number | null;
  frequencyRange: { min: number; max: number } | null;
  isCalibrating: boolean;
}
