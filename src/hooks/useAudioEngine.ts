import { useRef, useCallback, useState } from 'react';
import { getAudioContext } from '@/lib/audio/audio-context';
import type { PermissionState } from '@/types/audio';

export function useAudioEngine() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('idle');
  const [isReady, setIsReady] = useState(false);

  const init = useCallback(async (): Promise<AudioContext> => {
    if (!audioContextRef.current) {
      audioContextRef.current = getAudioContext();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    return audioContextRef.current;
  }, []);

  const requestMicrophone = useCallback(async () => {
    setPermissionState('requesting');
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionState('unavailable');
        return { 
          audioContext: audioContextRef.current, 
          stream: null, 
          error: new Error('getUserMedia not supported') 
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });
      
      streamRef.current = stream;
      
      stream.getAudioTracks().forEach(track => {
        track.onended = () => {
          setIsReady(false);
          setPermissionState('idle');
        };
      });
      
      await init();
      setPermissionState('granted');
      setIsReady(true);
      
      return { 
        audioContext: audioContextRef.current, 
        stream, 
        error: null 
      };
    } catch (error: unknown) {
      const err = error as Error;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
      } else {
        setPermissionState('unavailable');
      }
      setIsReady(false);
      return { 
        audioContext: audioContextRef.current, 
        stream: null, 
        error 
      };
    }
  }, [init]);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setPermissionState('idle');
    setIsReady(false);
  }, []);

  return {
    init,
    requestMicrophone,
    cleanup,
    audioContext: audioContextRef.current,
    stream: streamRef.current,
    isReady,
    permissionState,
  };
}
