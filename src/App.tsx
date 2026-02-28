import { useState } from 'react';
import { Settings, Home as HomeIcon, Mic } from 'lucide-react';
import { MicrophoneButton } from '@/components/audio/MicrophoneButton';
import { CalibrationView } from '@/components/audio/CalibrationView';
import { TunerDisplay } from '@/components/tuner/TunerDisplay';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useCalibration } from '@/hooks/useCalibration';
import { usePitchDetection } from '@/hooks/usePitchDetection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Screen = 'home' | 'settings';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(false);

  const handleMicrophoneGranted = (newStream: MediaStream) => {
    setStream(newStream);
    setMicEnabled(true);
  };

  const handleMicrophoneDisconnect = () => {
    setStream(null);
    setMicEnabled(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">KeySense</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentScreen(currentScreen === 'home' ? 'settings' : 'home')}
          className="min-h-[44px] min-w-[44px]"
          aria-label={currentScreen === 'home' ? 'Go to Settings' : 'Go to Home'}
        >
          {currentScreen === 'home' ? (
            <Settings className="h-6 w-6" />
          ) : (
            <HomeIcon className="h-6 w-6" />
          )}
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        {currentScreen === 'home' ? (
          <HomeScreen 
            micEnabled={micEnabled} 
            onMicrophoneGranted={handleMicrophoneGranted}
            onMicrophoneDisconnect={handleMicrophoneDisconnect}
          />
        ) : (
          <SettingsScreen stream={stream} />
        )}
      </main>

      <nav className="flex border-t">
        <Button
          variant={currentScreen === 'home' ? 'secondary' : 'ghost'}
          className="flex-1 rounded-none min-h-[44px]"
          onClick={() => setCurrentScreen('home')}
        >
          <HomeIcon className="mr-2 h-5 w-5" />
          Tuner
        </Button>
        <Button
          variant={currentScreen === 'settings' ? 'secondary' : 'ghost'}
          className="flex-1 rounded-none min-h-[44px]"
          onClick={() => setCurrentScreen('settings')}
        >
          <Settings className="mr-2 h-5 w-5" />
          Settings
        </Button>
      </nav>
    </div>
  );
}

interface HomeScreenProps {
  micEnabled: boolean;
  onMicrophoneGranted: (stream: MediaStream) => void;
  onMicrophoneDisconnect: () => void;
}

function HomeScreen({ micEnabled, onMicrophoneGranted }: HomeScreenProps) {
  const { audioContext, stream, isReady } = useAudioEngine();
  const { noiseFloor } = useCalibration();

  const { pitch } = usePitchDetection(
    isReady && audioContext ? audioContext : null,
    isReady && stream ? stream : null,
    { noiseFloor }
  );

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center space-y-2">
        <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center">
          <Mic className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold">Piano Practice Companion</h2>
        <p className="text-muted-foreground">
          Enable your microphone to start detecting pitch
        </p>
      </div>

      <div className="flex justify-center">
        <MicrophoneButton onGranted={onMicrophoneGranted} />
      </div>

      {micEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Tuner Display</CardTitle>
            <CardDescription>Detected pitch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <TunerDisplay pitch={pitch} />
            </div>
          </CardContent>
        </Card>
      )}

      {micEnabled && (
        <p className="text-xs text-center text-muted-foreground">
          Tip: If the microphone stops working, try refreshing the page.
        </p>
      )}
    </div>
  );
}

interface SettingsScreenProps {
  stream: MediaStream | null;
}

function SettingsScreen({ stream }: SettingsScreenProps) {
  return (
    <div className="w-full max-w-md space-y-4">
      <CalibrationView stream={stream} />
    </div>
  );
}

export default App;
