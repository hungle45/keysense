const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface NoteResult {
  note: string;
  octave: number;
  frequency: number;
}

export function frequencyToNote(frequency: number, a4: number = 440): NoteResult {
  const midiNote = 12 * Math.log2(frequency / a4) + 69;
  const roundedMidi = Math.round(midiNote);
  const noteIndex = roundedMidi % 12;
  const octave = Math.floor(roundedMidi / 12) - 1;

  const noteFrequency = a4 * Math.pow(2, (roundedMidi - 69) / 12);

  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    frequency: noteFrequency,
  };
}
