import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Settings, Volume2, Music, Play, RotateCcw } from 'lucide-react';
import { useCalibration } from '@/hooks/useCalibration';
import { PIANO_MIN_FREQ, PIANO_MAX_FREQ } from '@/lib/constants';

interface CalibrationViewProps {
  stream: MediaStream | null;
}

export function CalibrationView({ stream }: CalibrationViewProps) {
  const {
    noiseFloor,
    frequencyRange,
    isCalibrating,
    currentDb,
    startCalibration,
    reset,
  } = useCalibration();
  
  const [hasCalibrated, setHasCalibrated] = useState(false);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const handleStartCalibration = async () => {
    if (!stream) return;
    
    setHasCalibrated(false);
    await startCalibration(stream);
    setHasCalibrated(true);
  };

  const handleReset = () => {
    reset();
    setHasCalibrated(false);
  };

  const formatFrequency = (freq: number): string => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(1)} kHz`;
    }
    return `${freq.toFixed(0)} Hz`;
  };

  const getNoiseLevel = (db: number): string => {
    if (db >= -20) return 'Very Loud';
    if (db >= -30) return 'Loud';
    if (db >= -40) return 'Moderate';
    if (db >= -50) return 'Quiet';
    return 'Very Quiet';
  };

  if (!stream) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Calibration
          </CardTitle>
          <CardDescription>
            Enable microphone first to run calibration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please enable your microphone from the Home screen before running calibration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Calibration
        </CardTitle>
        <CardDescription>
          Measure ambient noise to optimize detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasCalibrated && !isCalibrating && (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Find a quiet location and tap "Start Calibration". The calibration will run for 3-5 seconds.
            </p>
            <Button 
              onClick={handleStartCalibration}
              size="lg"
              className="min-h-[44px] w-full"
            >
              <Play className="mr-2 h-5 w-5" />
              Start Calibration
            </Button>
          </div>
        )}

        {isCalibrating && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Calibrating...</p>
              <p className="text-3xl font-bold">{currentDb.toFixed(0)} dB</p>
              <p className="text-sm text-muted-foreground">{getNoiseLevel(currentDb)}</p>
            </div>
            <Progress value={100} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              Measuring ambient noise level
            </p>
          </div>
        )}

        {hasCalibrated && !isCalibrating && noiseFloor !== null && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Noise Floor</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{noiseFloor.toFixed(1)} dB</p>
                  <p className="text-xs text-muted-foreground">{getNoiseLevel(noiseFloor)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Frequency Range</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {frequencyRange ? `${formatFrequency(frequencyRange.min)} - ${formatFrequency(frequencyRange.max)}` : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Piano: {formatFrequency(PIANO_MIN_FREQ)} - {formatFrequency(PIANO_MAX_FREQ)}
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleReset}
              variant="outline"
              size="lg"
              className="min-h-[44px] w-full"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Recalibrate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
