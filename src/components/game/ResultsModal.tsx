import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { NoteAttempt } from '@/types/game';

interface ResultsModalProps {
  hits: number;
  misses: number;
  accuracy: number;
  noteHistory: NoteAttempt[];
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function ResultsModal({
  hits,
  misses,
  accuracy,
  noteHistory: _noteHistory,
  onPlayAgain,
  onBackToMenu,
}: ResultsModalProps) {
  const total = hits + misses;
  
  // Determine performance message
  const getMessage = () => {
    if (accuracy >= 90) return { text: 'Excellent!', color: 'text-green-500' };
    if (accuracy >= 70) return { text: 'Great job!', color: 'text-blue-500' };
    if (accuracy >= 50) return { text: 'Good effort!', color: 'text-yellow-500' };
    return { text: 'Keep practicing!', color: 'text-muted-foreground' };
  };
  
  const message = getMessage();
  
  return (
    <div className="fixed inset-0 bg-background/95 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Session Complete!</CardTitle>
          <p className={`text-xl font-medium ${message.color}`}>{message.text}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main accuracy score */}
          <div className="text-center">
            <div className="text-7xl font-bold text-primary">
              {accuracy}%
            </div>
            <p className="text-muted-foreground mt-2">Accuracy</p>
          </div>
          
          {/* Stats breakdown */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-500">{hits}</div>
              <div className="text-sm text-muted-foreground">Hits</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{misses}</div>
              <div className="text-sm text-muted-foreground">Missed</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
          
          {/* Progress bar visualization */}
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all"
              style={{ width: `${accuracy}%` }}
            />
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 min-h-[44px]"
              onClick={onBackToMenu}
            >
              Back to Menu
            </Button>
            <Button
              className="flex-1 min-h-[44px]"
              onClick={onPlayAgain}
            >
              Play Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
