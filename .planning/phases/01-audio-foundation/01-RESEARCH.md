# Phase 1: Audio Foundation - Research

**Researched:** 2026-02-28
**Domain:** Browser audio capture, microphone permissions, AudioContext management
**Confidence:** HIGH

## Summary

Phase 1 delivers the audio foundation: microphone permission handling, AudioContext setup, and calibration module. The key technical challenge is iOS Safari compatibility — browsers auto-suspend AudioContext and re-request permissions after inactivity. Use Web Audio API with a singleton pattern, request permissions on user gesture, and handle all permission states (granted/denied/prompt). Calibration measures noise floor via AnalyserNode and displays dB readings.

**Primary recommendation:** Use `useRef` for AudioContext singleton in a custom hook, request microphone permission only on button tap (not page load), and implement explicit AudioContext.resume() on user interaction.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- On-demand permission request (button click, not on load)
- Button label: "Enable microphone"
- After grant: go to tuner (main UI)
- If denied: show help text with settings instructions + retry button
- Calibration UX: Accessed via Settings screen (not main screen)
- Duration: 3-5 seconds
- Visual feedback during calibration: progress bar + current dB reading
- Results displayed: noise floor dB + frequency range
- Mobile Layout: 2 screens (Home/tuner + Settings/calibration)
- Error Handling: Permission denied instructions, mic disconnection detection, iOS AudioContext resume on tap

### Claude's Discretion
- Exact visual design of the tuner display
- Calibration exact threshold values for noise floor
- Settings screen layout details

### Deferred Ideas (OUT OF SCOPE)
- None

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUDIO-01 | User can grant microphone permission via browser prompt | getUserMedia API, permission state handling |
| AUDIO-02 | AudioContext initializes on user interaction (button click) | AudioContext lifecycle, user gesture requirement |
| AUDIO-03 | Microphone stream captured via getUserMedia | MediaStream API, source connection |
| AUDIO-04 | AudioContext singleton prevents multiple instances | Singleton pattern with useRef |
| CALI-01 | User can run calibration to measure room noise floor | AnalyserNode + dB calculation |
| CALI-02 | Calibration displays noise level in dB | Time-domain data to dB conversion |
| CALI-03 | Calibration detects and displays usable frequency range for piano | FFT analysis, piano frequency range (A0=27.5Hz to C8=4186Hz) |
| MOBILE-01 | App functions on mobile Safari (iOS) | iOS Safari AudioContext restrictions |
| MOBILE-02 | App functions on mobile Chrome (Android) | Android Chrome getUserMedia support |
| MOBILE-03 | UI adapts to portrait orientation | CSS responsive design |
| MOBILE-04 | Touch targets are minimum 44x44px | shadcn/ui defaults + custom sizing |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x | UI framework | Industry standard, excellent for audio visualization |
| TypeScript | 5.x | Type safety | Critical for audio processing |
| Vite | 6.x | Build tool | Fast HMR, ESM support required for pitchy |
| Web Audio API | native | Audio processing | Browser-native, no dependencies |
| shadcn/ui | latest | UI components | Mobile-first, accessible, matches PROJECT.md |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| usehooks-ts | latest | React hooks | For microphone permission handling patterns |
| lucide-react | latest | Icons | For mic button, settings gear icon |

### Not Needed for Phase 1
- pitchy (Phase 2 - pitch detection)
- abcjs (Phase 5 - notation)
- tone.js (Phase 4 - rhythm module)

**Installation:**
```bash
npm install react react-dom
npm install -D vite @vitejs/plugin-react typescript
npx shadcn@latest init
npx shadcn@latest add button card progress
npm install lucide-react
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── audio/
│   │   ├── AudioProvider.tsx       # Context for audio engine
│   │   ├── MicrophoneButton.tsx    # Permission request UI
│   │   └── CalibrationView.tsx     # Noise floor measurement
│   └── ui/                         # shadcn components
├── hooks/
│   ├── useAudioEngine.ts           # AudioContext + mic management
│   └── useCalibration.ts           # Noise floor measurement
├── lib/
│   ├── audio/
│   │   ├── audio-context.ts        # AudioContext singleton
│   │   └── analyser.ts             # AnalyserNode setup
│   └── constants.ts                # Audio constants
└── types/
    └── audio.ts                    # TypeScript interfaces
```

### Pattern 1: AudioContext Singleton via useRef

**What:** Single AudioContext instance managed via React useRef, not state
**When:** Browser limits AudioContext creation; need persistent audio graph
**Example:**
```typescript
// Source: Architecture research - Web Audio API best practices
const useAudioEngine = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const init = useCallback(async () => {
    // Create AudioContext only on user interaction
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    // Handle iOS Safari suspension
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    return audioContextRef.current;
  }, []);

  const requestMicrophone = useCallback(async () => {
    const ctx = await init();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true 
      });
      streamRef.current = stream;
      return { ctx, stream, error: null };
    } catch (error) {
      return { ctx, stream: null, error };
    }
  }, [init]);

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    // Don't close AudioContext - keep for reuse
  }, []);

  return { init, requestMicrophone, cleanup, audioContext: audioContextRef };
};
```

### Pattern 2: Permission State Management

**What:** Handle all permission states gracefully
**When:** Need robust permission UX for mobile browsers
**Example:**
```typescript
type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

const usePermission = () => {
  const [state, setState] = useState<PermissionState>('idle');
  
  const request = useCallback(async () => {
    setState('requesting');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // Stop after getting permission
      setState('granted');
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setState('denied');
      } else {
        setState('unavailable');
      }
    }
  }, []);

  return { state, request };
};
```

### Pattern 3: Calibration (Noise Floor Detection)

**What:** Measure ambient noise to set detection threshold
**When:** Before pitch detection or when user runs calibration
**Example:**
```typescript
// Source: MDN AnalyserNode, Web Audio API best practices
const useCalibration = (audioContext: AudioContext, stream: MediaStream) => {
  const analyser = useRef<AnalyserNode | null>(null);
  const [noiseFloor, setNoiseFloor] = useState<number | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);

  const startCalibration = useCallback(async (durationMs: number = 3000) => {
    analyser.current = audioContext.createAnalyser();
    analyser.current.fftSize = 2048;
    
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser.current);
    
    setIsCalibrating(true);
    const readings: number[] = [];
    const bufferLength = analyser.current.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    
    const sampleInterval = setInterval(() => {
      analyser.current!.getFloatTimeDomainData(dataArray);
      
      // Calculate RMS (root mean square)
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      
      // Convert to decibels (relative)
      const db = 20 * Math.log10(rms + 0.0001);
      readings.push(db);
    }, 50); // Sample every 50ms
    
    setTimeout(() => {
      clearInterval(sampleInterval);
      
      // Use 90th percentile to filter outliers (sudden loud noises)
      readings.sort((a, b) => a - b);
      const percentile = readings[Math.floor(readings.length * 0.9)];
      setNoiseFloor(percentile);
      setIsCalibrating(false);
    }, durationMs);
  }, [audioContext, stream]);

  return { noiseFloor, isCalibrating, startCalibration };
};
```

### Pattern 4: iOS Safari AudioContext Resume

**What:** Resume suspended AudioContext on any user interaction
**When:** App runs on iOS Safari
**Example:**
```typescript
// Source: Pitfalls research - iOS Safari restrictions
useEffect(() => {
  const handleInteraction = async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  };

  // Add listeners for user interactions
  document.addEventListener('touchstart', handleInteraction, { once: false });
  document.addEventListener('click', handleInteraction, { once: false });

  return () => {
    document.removeEventListener('touchstart', handleInteraction);
    document.removeEventListener('click', handleInteraction);
  };
}, []);
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Audio graph management | Custom AudioContext factory | Web Audio API native | Browser optimizes, handles lifecycle |
| dB calculation | Custom RMS formula | AnalyserNode + Math.log10 | Standard, tested algorithm |
| Permission handling | Custom state machine | Navigator.mediaDevices check | Browser handles complexity |
| Audio visualization | Raw Canvas API | AnalyserNode + requestAnimationFrame | Simpler, built-in data |

**Key insight:** Web Audio API is well-designed and browser-optimized. Don't wrap it in complex abstractions - use it directly with useRef for stateful references.

## Common Pitfalls

### Pitfall 1: AudioContext Created on Page Load

**What goes wrong:** Browser blocks AudioContext, or iOS Safari suspends it immediately
**Why it happens:** AudioContext requires user gesture to initialize properly
**How to avoid:** Always create/resume AudioContext in button click handler
**Warning signs:** "AudioContext not allowed to start" errors, silent failures

### Pitfall 2: Not Handling Permission Denied State

**What goes wrong:** User denies permission, app shows no feedback or crashes
**Why it happens:** getUserMedia throws error, not handled gracefully
**How to avoid:** Catch error, check error.name for 'NotAllowedError'/'PermissionDeniedError', show instructions
**Warning signs:** White screen after permission prompt, uncaught exceptions

### Pitfall 3: iOS Safari Re-requests Permission

**What goes wrong:** iOS Safari re-prompts for microphone after ~1 minute of inactivity
**Why it happens:** iOS security behavior - re-authenticates after idle
**How to avoid:** No fix - handle gracefully by showing "Microphone access expired" + retry button
**Warning signs:** Works initially, fails after backgrounding or idle

### Pitfall 4: AudioContext Multiple Instances

**What goes wrong:** Multiple components create separate AudioContexts, browser limits hit
**Why it happens:** React re-renders create new instances if stored in state
**How to avoid:** Use singleton pattern with useRef at module or context level
**Warning signs:** "Max audio contexts reached" errors, audio glitches

### Pitfall 5: No Disconnect Detection

**What goes wrong:** User unplugs headphones/mic, app continues showing stale data
**Why it happens:** MediaStream doesn't automatically detect device removal
**How to avoid:** Listen to MediaStreamTrack 'ended' event
**Example:**
```typescript
stream.getAudioTracks().forEach(track => {
  track.onended = () => {
    setMicConnected(false);
  };
});
```

## Code Examples

### Basic getUserMedia Flow
```typescript
// Source: MDN getUserMedia documentation
async function requestMicrophone(): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('getUserMedia not supported');
  }
  
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });
}
```

### Connecting Microphone to AudioContext
```typescript
// Source: MDN Web Audio API
const audioContext = new AudioContext();
const stream = await requestMicrophone();
const source = audioContext.createMediaStreamSource(stream);
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
source.connect(analyser);
```

### Piano Frequency Range Detection
```typescript
// Source: Music theory - piano key frequencies
const PIANO_MIN_FREQ = 27.5;  // A0
const PIANO_MAX_FREQ = 4186;  // C8

function isPianoFrequency(freq: number): boolean {
  return freq >= PIANO_MIN_FREQ && freq <= PIANO_MAX_FREQ;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ScriptProcessorNode | AudioWorklet | 2018+ | Main thread not blocked |
| Autoconfidence threshold | Pitch stability tracking | 2020+ | More stable readings |
| AudioContext on load | User gesture required | iOS Safari 2019+ | Better privacy |

**Deprecated/outdated:**
- **ScriptProcessorNode:** Deprecated, being removed from browsers. Use AudioWorklet or libraries that abstract this.
- **AudioContext created without user gesture:** iOS Safari now requires explicit user action.

## Open Questions

1. **Should we auto-resume AudioContext on every tap?**
   - What we know: iOS Safari suspends after 30s of inactivity
   - What's unclear: Best UX pattern - resume on any tap or only mic button tap?
   - Recommendation: Resume on any user interaction to ensure audio is ready

2. **How to handle permission "prompt" vs "denied" on iOS?**
   - What we know: iOS prompts once, then remembers choice
   - What's unclear: Can we re-prompt programmatically or only via settings?
   - Recommendation: Always show retry button that re-calls getUserMedia; if denied, show settings instructions

3. **What noise floor threshold is appropriate?**
   - What we know: Typical quiet room ~30-40 dB SPL
   - What's unclear: Calibration threshold values
   - Recommendation: Let calibration measure, then use measured value + offset (e.g., +10dB) as threshold

## Sources

### Primary (HIGH confidence)
- [MDN: getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) - Browser API documentation
- [MDN: AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode) - Audio analysis
- [MDN: Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) - Official guidance
- [Stack Overflow: iOS Safari microphone](https://stackoverflow.com/questions/79401143/ios-safari-switches-audio-output-to-speakers-when-starting-microphone-recording) - iOS behavior
- [WebKit: Safari 26 beta](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/) - Current Safari capabilities

### Secondary (MEDIUM confidence)
- [WebSearch: getUserMedia 2026](https://blog.addpipe.com/getusermedia-getting-started/) - Current guide
- [WebSearch: AudioContext singleton React](https://medium.com/@ignatovich.dm/singletons-in-react-applications-when-and-how-to-use-them-effectively-2a943691949d) - React patterns
- [WebSearch: Mobile Safari permissions](https://stackoverflow.com/questions/78602778/why-does-safari-on-ios-re-ask-for-microphone-permission-after-one-minute) - iOS re-prompt behavior

### Tertiary (LOW confidence)
- [WebSearch: shadcn mobile touch targets](https://smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks) - Accessibility guidance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Well-established React + Web Audio stack
- Architecture: HIGH - Singleton pattern widely documented, iOS quirks known
- Pitfalls: MEDIUM - iOS behavior can change; verify on real devices

**Research date:** 2026-02-28
**Valid until:** 2026-04-01 (30 days - stable domain, but iOS changes frequently)

---
*Research for Phase 1: Audio Foundation*
