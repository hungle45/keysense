import { NoteDisplay } from './NoteDisplay';
import { CentsDisplay } from './CentsDisplay';
import type { PitchResult } from '@/types/pitch';
import type { RMSDebugInfo } from '@/hooks/usePitchDetection';

interface TunerDisplayProps {
  pitch: PitchResult | null;
  rmsDebug?: RMSDebugInfo;
}

// Visual debug bar showing current RMS vs gate thresholds
function RMSDebugBar({ rmsDebug }: { rmsDebug: RMSDebugInfo }) {
  // Scale RMS to percentage (cap at openThreshold * 2 for reasonable display)
  const maxDisplay = rmsDebug.openThreshold * 3;
  const rmsPercent = Math.min((rmsDebug.currentRMS / maxDisplay) * 100, 100);
  const openThresholdPercent = (rmsDebug.openThreshold / maxDisplay) * 100;
  const closeThresholdPercent = (rmsDebug.closeThreshold / maxDisplay) * 100;
  
  return (
    <div className="w-full mt-4 space-y-1">
      <div className="text-xs text-muted-foreground flex justify-between">
        <span>Gate: {rmsDebug.gateOpen ? '🟢 OPEN' : '🔴 CLOSED'}</span>
        <span>RMS: {(rmsDebug.currentRMS * 1000).toFixed(2)}</span>
      </div>
      <div className="relative h-4 bg-muted rounded-full overflow-hidden">
        {/* Close threshold marker (lighter) */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-yellow-400/60 z-10"
          style={{ left: `${closeThresholdPercent}%` }}
          title="Close threshold"
        />
        {/* Open threshold marker (brighter) */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-10"
          style={{ left: `${openThresholdPercent}%` }}
          title="Open threshold"
        />
        {/* Current RMS bar */}
        <div 
          className={`h-full transition-all duration-75 ${
            rmsDebug.gateOpen ? 'bg-green-500' : 'bg-red-400'
          }`}
          style={{ width: `${rmsPercent}%` }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground flex justify-between">
        <span>Close: {(rmsDebug.closeThreshold * 1000).toFixed(2)}</span>
        <span>Open: {(rmsDebug.openThreshold * 1000).toFixed(2)}</span>
      </div>
    </div>
  );
}

export function TunerDisplay({ pitch, rmsDebug }: TunerDisplayProps) {
  if (!pitch) {
    return (
      <div className="tuner-display w-full">
        <div className="tuner-waiting">
          <span className="waiting-text">Play a note</span>
        </div>
        {rmsDebug && <RMSDebugBar rmsDebug={rmsDebug} />}
      </div>
    );
  }

  return (
    <div className="tuner-display w-full">
      <NoteDisplay note={pitch.note} octave={pitch.octave} />
      <CentsDisplay cents={pitch.cents} />
      {rmsDebug && <RMSDebugBar rmsDebug={rmsDebug} />}
    </div>
  );
}
