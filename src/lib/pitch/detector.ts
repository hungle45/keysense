import { PitchDetector } from 'pitchy';

// ============================================================================
// PITCH DETECTION CONFIGURATION
// ============================================================================

// Piano frequency bounds (A0 = 27.5Hz to C8 = 4186Hz)
// Reject any detected pitch outside this range to avoid ghost notes from
// infrasound (HVAC rumble) or ultrasound artifacts
const PIANO_MIN_FREQ = 27;
const PIANO_MAX_FREQ = 4200;

// Minimum clarity to even return a result (very low - adaptive check happens in hook)
const MIN_CLARITY_FLOOR = 0.7;

export interface DetectorResult {
  frequency: number;
  clarity: number;
}

export class PitchDetectorWrapper {
  private detector: PitchDetector<Float32Array>;

  constructor(fftSize: number = 2048) {
    this.detector = PitchDetector.forFloat32Array(fftSize);
  }

  findPitch(input: Float32Array, sampleRate: number): DetectorResult | null {
    const [frequency, clarity] = this.detector.findPitch(input, sampleRate);

    // Only filter by frequency range and minimum floor clarity
    // Adaptive clarity threshold (0.85 for high notes, 0.9 for low) is applied in usePitchDetection
    if (
      clarity > MIN_CLARITY_FLOOR &&
      frequency >= PIANO_MIN_FREQ &&
      frequency <= PIANO_MAX_FREQ
    ) {
      return { frequency, clarity };
    }

    return null;
  }
}

export function createPitchDetector(fftSize: number = 2048): PitchDetectorWrapper {
  return new PitchDetectorWrapper(fftSize);
}
