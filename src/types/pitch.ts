export interface PitchResult {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  clarity: number;
  rms: number;  // Volume level for hit detection
}
