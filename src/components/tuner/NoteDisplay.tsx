interface NoteDisplayProps {
  note: string;
  octave: number;
}

export function NoteDisplay({ note, octave }: NoteDisplayProps) {
  return (
    <div className="note-display">
      <span className="note-name">{note}</span>
      <span className="note-octave">{octave}</span>
    </div>
  );
}
