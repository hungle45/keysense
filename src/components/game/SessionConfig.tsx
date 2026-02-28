import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GameConfig, HandPosition, ScrollSpeed } from '@/types/game';
import { SESSION_DURATIONS } from '@/types/game';

interface SessionConfigProps {
  config: GameConfig;
  onConfigChange: (config: GameConfig) => void;
  onStart: () => void;
}

export function SessionConfig({ config, onConfigChange, onStart }: SessionConfigProps) {
  const durations: Array<{ key: keyof typeof SESSION_DURATIONS; label: string }> = [
    { key: '1min', label: '1 Minute' },
    { key: '5min', label: '5 Minutes' },
  ];
  
  const positions: Array<{ value: HandPosition; label: string }> = [
    { value: 'middle-c', label: 'Middle C Position' },
    { value: 'g-position', label: 'G Position' },
    { value: 'f-position', label: 'F Position' },
  ];
  
  const speeds: Array<{ value: ScrollSpeed; label: string }> = [
    { value: 'slow', label: 'Slow' },
    { value: 'medium', label: 'Medium' },
    { value: 'fast', label: 'Fast' },
  ];
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Practice Session</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Duration selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Duration</label>
          <div className="flex gap-2">
            {durations.map(({ key, label }) => (
              <Button
                key={key}
                variant={config.duration === SESSION_DURATIONS[key] ? 'default' : 'outline'}
                className="flex-1 min-h-[44px]"
                onClick={() => onConfigChange({ ...config, duration: SESSION_DURATIONS[key] })}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Hand position selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Hand Position</label>
          <div className="flex flex-col gap-2">
            {positions.map(({ value, label }) => (
              <Button
                key={value}
                variant={config.handPosition === value ? 'default' : 'outline'}
                className="min-h-[44px]"
                onClick={() => onConfigChange({ ...config, handPosition: value })}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Speed selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Scroll Speed</label>
          <div className="flex gap-2">
            {speeds.map(({ value, label }) => (
              <Button
                key={value}
                variant={config.scrollSpeed === value ? 'default' : 'outline'}
                className="flex-1 min-h-[44px]"
                onClick={() => onConfigChange({ ...config, scrollSpeed: value })}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        
        <Button 
          className="w-full min-h-[44px] text-lg" 
          size="lg"
          onClick={onStart}
        >
          Start Practice
        </Button>
      </CardContent>
    </Card>
  );
}
