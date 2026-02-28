import { PitchDetector } from 'pitchy';

// Clarity threshold for accepting a pitch detection
// Lower values = more sensitive but potentially more noise
// Higher values = more stable but may miss some notes
// Piano notes typically have clarity 0.7-0.95 depending on harmonics and decay
const MIN_CLARITY_THRESHOLD = 0.8;

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

    if (clarity > MIN_CLARITY_THRESHOLD && frequency > 20 && frequency < 5000) {
      return { frequency, clarity };
    }

    return null;
  }
}

export function createPitchDetector(fftSize: number = 2048): PitchDetectorWrapper {
  return new PitchDetectorWrapper(fftSize);
}
