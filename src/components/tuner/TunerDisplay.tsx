import { NoteDisplay } from './NoteDisplay';
import { CentsDisplay } from './CentsDisplay';
import type { PitchResult } from '@/types/pitch';

interface TunerDisplayProps {
  pitch: PitchResult | null;
}

export function TunerDisplay({ pitch }: TunerDisplayProps) {
  if (!pitch) {
    return (
      <div className="tuner-display w-full">
        <div className="tuner-waiting">
          <span className="waiting-text">Play a note</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tuner-display w-full">
      <NoteDisplay note={pitch.note} octave={pitch.octave} />
      <CentsDisplay cents={pitch.cents} />
    </div>
  );
}
