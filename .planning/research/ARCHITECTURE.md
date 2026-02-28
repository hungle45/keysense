# Architecture Research

**Domain:** Real-time Pitch Detection Web Apps
**Researched:** 2026-02-28
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer (React)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ TunerView  │  │ GameView   │  │ NotationViewer     │  │
│  │ (Canvas)   │  │ (Session)  │  │ (abcjs)            │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │               │                     │              │
├─────────┴───────────────┴─────────────────────┴──────────────┤
│                   State Layer (React Hooks/Context)         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ useAudio     │  │ usePitch    │  │ useSession      │  │
│  │ (mic input)  │  │ (detected)  │  │ (game state)    │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                    │             │
├─────────┴─────────────────┴────────────────────┴─────────────┤
│                   Audio Engine Layer                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ AudioContext → AnalyserNode → PitchDetector         │    │
│  │ (Optional: AudioWorklet for off-main-thread)        │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                   Platform Layer (Browser)                 │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ getUserMedia│  │ Web Audio API│                         │
│  │ (Microphone)│  │ (Processing) │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **AudioInput** | Captures microphone stream via getUserMedia | `navigator.mediaDevices.getUserMedia({ audio: true })` |
| **AudioContext** | Manages audio graph and processing pipeline | Web Audio API `AudioContext` (singleton) |
| **AnalyserNode** | Provides real-time frequency/time data | Web Audio API, connected to mic source |
| **PitchDetector** | Converts frequency data to musical notes | pitchfinder (YIN/AMDF) or pitchy (McLeod) |
| **AudioEngine** | Orchestrates capture, processing, detection | Custom hook or service class |
| **StateProviders** | Global state for audio, pitch, session | React Context + useReducer |
| **Visualization** | Renders pitch feedback (tuner dial, waveform) | Canvas API or SVG |
| **NotationViewer** | Renders ABC notation as sheet music | abcjs library |
| **SessionManager** | Manages practice games, timing, scoring | Custom hook/service |

## Recommended Project Structure

```
src/
├── components/
│   ├── audio/
│   │   ├── AudioProvider.tsx       # Context for audio engine
│   │   ├── MicrophoneButton.tsx    # Permission request UI
│   │   └── Visualizer.tsx          # Canvas-based pitch display
│   ├── tuner/
│   │   ├── TunerView.tsx           # Main tuner display
│   │   ├── PitchIndicator.tsx      # Note name (C4, G3, etc.)
│   │   └── FrequencyDisplay.tsx     # Hz value display
│   ├── game/
│   │   ├── GameView.tsx            # Practice session container
│   │   ├── NoteTarget.tsx           # Target note display
│   │   ├── SessionTimer.tsx         # 1min/5min timer
│   │   └── ScoreDisplay.tsx         # Hits/misses counter
│   └── notation/
│       └── NotationViewer.tsx       # abcjs wrapper
├── hooks/
│   ├── useAudioEngine.ts           # AudioContext + mic management
│   ├── usePitchDetector.ts         # Real-time pitch detection
│   ├── useCalibration.ts           # Noise floor measurement
│   ├── useSession.ts               # Game state management
│   └── useNotation.ts              # ABC notation helpers
├── lib/
│   ├── pitch/
│   │   ├── detector.ts             # Pitch detection wrapper
│   │   ├── algorithms.ts          # YIN/AMDF/McLeod config
│   │   └── note-utils.ts           # Hz ↔ note name conversion
│   ├── audio/
│   │   ├── audio-context.ts       # AudioContext singleton
│   │   └── analyser.ts             # AnalyserNode setup
│   └── notation/
│       └── abc-utils.ts           # ABC string generation
├── stores/
│   ├── audio-store.ts              # Audio state (Zustand/Jotai)
│   └── session-store.ts            # Game session state
├── types/
│   └── audio.ts                    # TypeScript interfaces
└── utils/
    └── constants.ts                # Note frequencies, thresholds
```

### Structure Rationale

- **hooks/**: All audio and game logic lives in custom hooks, keeping components pure
- **lib/pitch/**: Isolated pitch detection algorithms for testability and potential WebAssembly optimization
- **components/audio/**: Reusable audio primitives (provider, button, visualizer)
- **components/tuner|game|notation/**: Feature-specific UI, compose lower-level components
- **stores/**: Optional state library (Zustand/Jotai) for complex session state, otherwise use Context

## Architectural Patterns

### Pattern 1: AudioContext Singleton + useRef

**What:** Single AudioContext instance managed via React ref, not state
**When:** Browser limits AudioContext creation; need persistent audio graph
**Trade-offs:** Pro: Single resource, proper lifecycle. Con: Need careful cleanup.

```typescript
const useAudioEngine = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const init = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const cleanup = useCallback(() => {
    audioContextRef.current?.close();
    audioContextRef.current = null;
  }, []);

  return { init, cleanup, audioContext: audioContextRef };
};
```

### Pattern 2: AudioWorklet for Off-Main-Thread Processing

**What:** Run pitch detection in AudioWorklet to avoid blocking UI
**When:** High-frequency updates (60fps), complex algorithms, mobile devices
**Trade-offs:** Pro: Smooth UI, better performance. Con: More complex setup, message passing overhead.

```typescript
// In public/worklets/pitch-processor.worklet.js
class PitchProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0][0];
    // Run pitch detection on input channel data
    const pitch = detectPitch(input);
    this.port.postMessage({ pitch });
    return true;
  }
}
registerProcessor('pitch-processor', PitchProcessor);
```

### Pattern 3: Provider Pattern for Audio State

**What:** React Context exposes audio controls and state globally
**When:** Multiple components need audio access (tuner, game, notation)
**Trade-offs:** Pro: Easy access, centralized state. Con: Re-render cascade if not careful.

```typescript
const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<number | null>(null);
  
  // ... audio engine setup
  
  return (
    <AudioContext.Provider value={{ isListening, currentPitch, start, stop }}>
      {children}
    </AudioContext.Provider>
  );
};
```

### Pattern 4: Debounced Pitch Updates

**What:** Throttle pitch detection callbacks to prevent UI thrashing
**When:** Detection runs faster than visual update needs (e.g., 60fps detection, 30fps UI)
**Trade-offs:** Pro: Smoother UI, predictable rendering. Con: Slight input latency perception.

## Data Flow

### Real-Time Pitch Detection Flow

```
[Microphone]
    ↓ (getUserMedia stream)
[MediaStreamSource]
    ↓ (connect)
[AnalyserNode] ←→ [ScriptProcessorNode / AudioWorklet]
    ↓ (getByteTimeDomainData / onmessage)
[Pitch Detection Algorithm (YIN/AMDF)]
    ↓ (returns Hz)
[Note Converter (Hz → C4, G3, etc.)]
    ↓ (update state)
[React State / Context]
    ↓ (re-render)
[Tuner UI / Game Logic]
```

### Session Game Flow

```
[User taps "Start 1-min Session"]
    ↓
[SessionManager initializes]
    ↓
[Random note generated] → [Target note displayed]
    ↓
[Timer starts (60s countdown)]
    ↓
[User plays note] → [Pitch detected] → [Compare to target]
    ↓
[Score updated] → [Next note generated]
    ↓
[Timer ends] → [Results displayed]
```

### State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User Action (tap "Start")                                  │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Session Hook (useSession)                                  │
│  - startSession(duration)                                   │
│  - generateTargetNote()                                    │
│  - checkPitchMatch(detected, target)                       │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  State (Zustand / useReducer)                               │
│  - status: 'idle' | 'playing' | 'finished'                  │
│  - targetNote: Note                                         │
│  - score: { hits: number, misses: number }                  │
│  - timeRemaining: number                                    │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  UI Components (re-render)                                  │
│  - GameView shows target note, timer, score                │
└─────────────────────────────────────────────────────────────┘
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1K users | Single-page React app, client-side only, no backend |
| 1K-100K users | Add analytics (session duration, accuracy trends), CDN for static assets |
| 100K+ users | Consider WebSocket for cloud sync, offline PWA with service worker |

### Scaling Priorities

1. **First bottleneck:** Mobile performance — Use AudioWorklet, minimize main-thread work
2. **Second bottleneck:** State updates — Batch pitch updates, use requestAnimationFrame for UI sync

## Anti-Patterns

### Anti-Pattern 1: Creating AudioContext in Component State

**What people do:** `const [ctx] = useState(() => new AudioContext())`
**Why it's wrong:** Multiple components may create duplicate contexts; state updates trigger re-renders that disrupt audio
**Do this instead:** Use `useRef` + singleton pattern, or Context provider

### Anti-Pattern 2: Running Pitch Detection on Main Thread

**What people do:** Calling pitchfinder in `useEffect` with setInterval
**Why it's wrong:** Blocks UI thread, causes jank on mobile; detection can miss frames
**Do this instead:** Use AudioWorklet, or at minimum requestAnimationFrame with minimal buffer size

### Anti-Pattern 3: Not Handling AudioContext Suspension

**What people do:** Assuming AudioContext is always running after init
**Why it's wrong:** Browsers auto-suspend AudioContext (especially mobile); requires user gesture to resume
**Do this instead:** Check `audioContext.state`, call `resume()` on user interaction

### Anti-Pattern 4: Storing Audio Objects in React State

**What people do:** `const [analyser] = useState(() => new AnalyserNode(ctx, ...))`
**Why it's wrong:** AnalyserNode isn't serializable; state updates trigger re-renders
**Do this instead:** Use `useRef` for AudioNodes, only use state for primitive values

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| getUserMedia | Direct API call | Requires HTTPS; handle permissions gracefully |
| abcjs | npm package import | Renders ABC notation strings to SVG/canvas |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Audio Engine ↔ UI | React Context + hooks | Provider exposes `startListening()`, `stopListening()`, `currentPitch` |
| Pitch Detector ↔ Game Logic | Callback/Event | On-pitch-detected callback triggers match check |
| Session Manager ↔ Notation | Direct function call | Generate ABC strings from session state |

## Build Order (Suggested)

1. **Phase 1: Audio Foundation**
   - `useAudioEngine` hook (mic capture, AudioContext)
   - `MicrophoneButton` component
   - Basic Hz display

2. **Phase 2: Pitch Detection**
   - `usePitchDetector` hook (integrate pitchfinder/pichy)
   - `note-utils.ts` (Hz ↔ note conversion)
   - `TunerView` with visual feedback

3. **Phase 3: Game Logic**
   - `useSession` hook
   - Random note generation
   - Timing and scoring

4. **Phase 4: Calibration**
   - `useCalibration` hook (noise floor detection)
   - Configurable sensitivity

5. **Phase 5: Notation**
   - `NotationViewer` with abcjs
   - Session → ABC string generation

## Sources

- [Web Audio API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — HIGH
- [pitchfinder library](https://github.com/peterkhayes/pitchfinder) — HIGH
- [pitchy library](https://www.npmjs.com/package/pitchy) — HIGH
- [abcjs GitHub](https://github.com/paulrosen/abcjs) — HIGH
- [Real-time Pitch Detection in Browser](https://pitchdetector.com/real-time-browser-pitch-detection-explained/) — MEDIUM
- [Building a Guitar Tuner with Kiro](https://dev.to/kirodotdev/building-a-real-time-guitar-tuner-web-app-with-kiro-4ak0) — MEDIUM
- [AudioWorklets with React](https://medium.com/hackernoon/implementing-audioworklets-with-react-8a80a470474) — MEDIUM

---

*Architecture research for: Real-time Pitch Detection Web Apps*
*Researched: 2026-02-28*
