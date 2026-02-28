import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useAudioEngine } from '@/hooks/useAudioEngine';

interface MicrophoneButtonProps {
  onGranted?: (stream: MediaStream) => void;
}

export function MicrophoneButton({ onGranted }: MicrophoneButtonProps) {
  const { permissionState, requestMicrophone } = useAudioEngine();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = async () => {
    setErrorMessage(null);
    const result = await requestMicrophone();
    
    if (result.error) {
      setErrorMessage(getErrorMessage(result.error));
    } else if (result.stream && onGranted) {
      onGranted(result.stream);
    }
  };

  const getErrorMessage = (error: unknown): string => {
    const err = error as Error;
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return 'Microphone access was denied. Please enable microphone access in your browser settings and try again.';
    }
    if (err.name === 'NotFoundError') {
      return 'No microphone found. Please connect a microphone and try again.';
    }
    return 'Unable to access microphone. Please check your browser settings.';
  };

  const getButtonContent = () => {
    switch (permissionState) {
      case 'requesting':
        return (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Requesting access...
          </>
        );
      case 'granted':
        return (
          <>
            <Mic className="mr-2 h-5 w-5" />
            Microphone enabled
          </>
        );
      case 'denied':
      case 'unavailable':
        return (
          <>
            <MicOff className="mr-2 h-5 w-5" />
            Microphone unavailable
          </>
        );
      default:
        return (
          <>
            <Mic className="mr-2 h-5 w-5" />
            Enable microphone
          </>
        );
    }
  };

  const isDisabled = permissionState === 'requesting';

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        size="lg"
        className="min-h-[44px] min-w-[200px] text-base"
        variant={permissionState === 'granted' ? 'secondary' : 'default'}
      >
        {getButtonContent()}
      </Button>
      
      {permissionState === 'denied' && (
        <div className="text-center text-sm text-muted-foreground max-w-[280px]">
          <p className="mb-2">{errorMessage}</p>
          <p>To enable:</p>
          <ul className="list-disc list-inside text-left mt-1">
            <li>Click the lock/icon in your browser's address bar</li>
            <li>Find "Microphone" in the permissions list</li>
            <li>Change it to "Allow"</li>
          </ul>
        </div>
      )}
      
      {permissionState === 'unavailable' && errorMessage && (
        <p className="text-center text-sm text-destructive max-w-[280px]">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
