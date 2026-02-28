export type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export interface AudioEngineState {
  audioContext: AudioContext | null;
  stream: MediaStream | null;
  isReady: boolean;
}

export interface CalibrationResult {
  noiseFloor: number;       // dB value for display
  noiseFloorRMS: number;    // Raw RMS value for gate comparison
  frequencyRange: {
    min: number;
    max: number;
  };
}

export interface CalibrationState {
  noiseFloor: number | null;
  noiseFloorRMS: number | null;
  frequencyRange: { min: number; max: number } | null;
  isCalibrating: boolean;
}
