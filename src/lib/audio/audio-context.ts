let audioContextInstance: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContextInstance) {
    audioContextInstance = createAudioContext();
  }
  return audioContextInstance;
}

export function createAudioContext(): AudioContext {
  const ctx = new AudioContext();
  
  if (ctx.state === 'suspended') {
    const resumeOnInteraction = async () => {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      document.removeEventListener('touchstart', resumeOnInteraction);
      document.removeEventListener('click', resumeOnInteraction);
    };
    
    document.addEventListener('touchstart', resumeOnInteraction);
    document.addEventListener('click', resumeOnInteraction);
  }
  
  return ctx;
}

export function resetAudioContext(): void {
  if (audioContextInstance) {
    audioContextInstance.close();
    audioContextInstance = null;
  }
}
