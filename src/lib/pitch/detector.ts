import { PitchDetector } from 'pitchy';

// ============================================================================
// PITCH DETECTION CONFIGURATION
// ============================================================================

// Clarity threshold for accepting a pitch detection
// Must be > 0.9 per user requirements for strict noise rejection
const MIN_CLARITY_THRESHOLD = 0.9;

// Piano frequency bounds (A0 = 27.5Hz to C8 = 4186Hz)
// Reject any detected pitch outside this range to avoid ghost notes from
// infrasound (HVAC rumble) or ultrasound artifacts
const PIANO_MIN_FREQ = 27;
const PIANO_MAX_FREQ = 4200;

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

    // Strict filtering: clarity > 0.9 AND within piano frequency range
    if (
      clarity > MIN_CLARITY_THRESHOLD &&
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
