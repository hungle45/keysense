import { useRef, useEffect, useCallback, useState } from 'react';
import { useGameSession } from '@/hooks/useGameSession';
import { useHitDetection } from '@/hooks/useHitDetection';
import { SessionConfig } from '@/components/game/SessionConfig';
import { CountdownSplash } from '@/components/game/CountdownSplash';
import { GrandStaff } from '@/components/game/GrandStaff';
import { ScrollingNote } from '@/components/game/ScrollingNote';
import { ResultsModal } from '@/components/game/ResultsModal';
import { SCROLL_SPEEDS } from '@/types/game';
import type { PitchResult } from '@/types/pitch';

interface GameScreenProps {
  pitch: PitchResult | null;
  onBackToMenu?: () => void;
}

// Format milliseconds as mm:ss
function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function GameScreen({ pitch, onBackToMenu }: GameScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const {
    state,
    remainingMs,
    accuracy,
    configure,
    startGame,
    spawnNote,
    recordHit,
    recordMiss,
    reset,
  } = useGameSession();
  
  // Track container width for scroll calculations
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  
  // Hit detection integration
  useHitDetection({
    pitch,
    activeNotes: state.activeNotes,
    scrollSpeed: state.config.scrollSpeed,
    containerWidth,
    isRunning: state.status === 'running',
    onHit: recordHit,
  });
  
  // Spawn notes at regular intervals based on scroll speed
  useEffect(() => {
    if (state.status !== 'running') return;
    
    // Calculate spawn interval based on scroll speed
    // Spawn when previous note is ~1/3 across the screen
    const pixelsPerSecond = SCROLL_SPEEDS[state.config.scrollSpeed];
    const spawnIntervalMs = (containerWidth / 3) / pixelsPerSecond * 1000;
    
    // Spawn first note immediately
    if (state.activeNotes.length === 0) {
      spawnNote();
    }
    
    const interval = setInterval(() => {
      if (state.status === 'running') {
        spawnNote();
      }
    }, spawnIntervalMs);
    
    return () => clearInterval(interval);
  }, [state.status, state.config.scrollSpeed, containerWidth, spawnNote, state.activeNotes.length]);
  
  // Handle note scrolling past (mark as missed)
  const handleNoteMissed = useCallback((noteId: string) => {
    recordMiss(noteId);
  }, [recordMiss]);
  
  // Render based on game status
  if (state.status === 'idle') {
    return (
      <div className="flex items-center justify-center p-4">
        <SessionConfig
          config={state.config}
          onConfigChange={configure}
          onStart={startGame}
        />
      </div>
    );
  }
  
  if (state.status === 'countdown') {
    return <CountdownSplash value={state.countdownValue} />;
  }
  
  if (state.status === 'complete') {
    return (
      <ResultsModal
        hits={state.hits}
        misses={state.misses}
        accuracy={accuracy}
        noteHistory={state.noteHistory}
        onPlayAgain={reset}
        onBackToMenu={() => {
          reset();
          onBackToMenu?.();
        }}
      />
    );
  }
  
  // Running state - show game UI
  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      {/* Timer display */}
      <div className="flex justify-between items-center p-4">
        <div className="text-2xl font-mono font-bold">
          {formatTime(remainingMs)}
        </div>
        <div className="text-sm text-muted-foreground">
          Hits: {state.hits}
        </div>
      </div>
      
      {/* Grand staff with scrolling notes */}
      <div className="flex-1 px-4">
        <GrandStaff>
          {state.activeNotes.map(note => (
            <ScrollingNote
              key={note.id}
              note={note}
              scrollSpeed={state.config.scrollSpeed}
              containerWidth={containerWidth}
              onScrollPast={() => handleNoteMissed(note.id)}
            />
          ))}
        </GrandStaff>
      </div>
      
      {/* Current pitch display (helpful for user) */}
      {pitch && (
        <div className="text-center p-4 text-lg">
          Playing: <span className="font-bold">{pitch.note}{pitch.octave}</span>
        </div>
      )}
    </div>
  );
}
