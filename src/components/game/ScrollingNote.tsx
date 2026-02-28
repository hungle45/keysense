import { useEffect, useState } from 'react';
import { SCROLL_SPEEDS, type ScrollSpeed, type TargetNote } from '@/types/game';
import { TIMING_LINE_X } from './TimingLine';

interface ScrollingNoteProps {
  note: TargetNote;
  scrollSpeed: ScrollSpeed;
  containerWidth: number;
  onReachTimingLine?: () => void;
  onScrollPast?: () => void;
}

// Map note + octave to Y position on staff
function getNoteYPosition(note: string, octave: number): number {
  // Middle C (C4) is on a ledger line below treble staff
  // Each note step is half the line spacing
  const notePositions: Record<string, number> = {
    'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6,
  };
  
  const middleCY = 60; // Y position of middle C (ledger line)
  const stepSize = 5;  // pixels per note step
  
  const noteIndex = notePositions[note] ?? 0;
  const octaveOffset = (octave - 4) * 7; // 7 notes per octave
  
  return middleCY - (noteIndex + octaveOffset) * stepSize;
}

export function ScrollingNote({ 
  note, 
  scrollSpeed, 
  containerWidth,
  onReachTimingLine,
  onScrollPast,
}: ScrollingNoteProps) {
  const [xPosition, setXPosition] = useState(containerWidth);
  
  useEffect(() => {
    const pixelsPerMs = SCROLL_SPEEDS[scrollSpeed] / 1000;
    let animationFrame: number;
    let hasReachedLine = false;
    let hasScrolledPast = false;
    
    const animate = () => {
      const elapsed = Date.now() - note.spawnTime;
      const newX = containerWidth - (elapsed * pixelsPerMs);
      setXPosition(newX);
      
      // Check if reached timing line
      if (!hasReachedLine && newX <= TIMING_LINE_X + 10) {
        hasReachedLine = true;
        onReachTimingLine?.();
      }
      
      // Check if scrolled past (off left edge)
      if (!hasScrolledPast && newX < -30) {
        hasScrolledPast = true;
        onScrollPast?.();
      }
      
      if (!hasScrolledPast) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [note.spawnTime, scrollSpeed, containerWidth, onReachTimingLine, onScrollPast]);
  
  const yPosition = getNoteYPosition(note.note, note.octave);
  
  // Color based on note status
  const noteColor = note.status === 'hit' 
    ? 'bg-green-500' 
    : note.status === 'missed' 
      ? 'bg-red-400' 
      : 'bg-foreground';
  
  return (
    <div
      className={`absolute w-6 h-4 rounded-full ${noteColor} transition-colors`}
      style={{
        left: xPosition,
        top: yPosition,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Note name label (visible during development) */}
      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
        {note.note}{note.octave}
      </span>
    </div>
  );
}
