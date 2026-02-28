import { PitchDetector } from 'pitchy';

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

    if (clarity > 0.9 && frequency > 20 && frequency < 5000) {
      return { frequency, clarity };
    }

    return null;
  }
}

export function createPitchDetector(fftSize: number = 2048): PitchDetectorWrapper {
  return new PitchDetectorWrapper(fftSize);
}
