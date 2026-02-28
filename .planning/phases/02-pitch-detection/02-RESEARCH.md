# Phase 2: Pitch Detection - Research

**Researched:** 2026-02-28
**Domain:** Real-time pitch detection, note identification, cents deviation, tuner display
**Confidence:** HIGH

## Summary

Phase 2 delivers real-time pitch detection with note identification and tuner display. Use `pitchy` v4.x (McLeod Pitch Method) for detection - it handles piano harmonics better than autocorrelation and is ESM-compatible with Vite. Frequency-to-note conversion uses standard formula: `note = 12 × log2(f/440) + 69`. Cents deviation formula: `cents = 1200 × log2(f_detected / f_nearest_note)`. Visual tuner shows note name + cents with color coding (±5 cents = green/in-tune).

**Primary recommendation:** Use `pitchy` library with Float32Array input from AnalyserNode, apply clarity threshold from pitchy to filter noise, and implement RMS volume check against noise floor before running pitch detection.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Note + Cents format (not needle gauge)
- Full screen note display in middle of screen
- Real-time updates (try first, optimize if performance issues)
- Sharps/flats: C#4 format (not ♯ or "sharp")
- Always show octave number (C4, G3, etc.)
- Prefer sharps for enharmonic notes
- Show message when no pitch detected
- Message text: "Play a note"
- Show same message when input below noise floor
- Number + color for cents deviation
- In-tune threshold: ±5 cents (green)
- Sharp: red, Flat: blue
- Number shows deviation (e.g., "+12 cents", "-8 cents")

### Claude's Discretion
- Exact font sizes and layout proportions
- Animation transitions for smooth feel
- Performance optimization approach if needed

### Deferred Ideas (OUT OF SCOPE)
- None - discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PITCH-01 | Real-time pitch detection running at 30+ FPS | pitchy + requestAnimationFrame loop achieves 30+ FPS |
| PITCH-02 | Detected frequency (Hz) converted to musical note name | Frequency-to-note formula + cents calculation |
| PITCH-03 | Pitch detection handles piano harmonic-dominant high notes (above C5) | McLeod method handles harmonics better than autocorrelation; clarity threshold filters |
| PITCH-04 | Visual tuner shows detected note with cents deviation | Note display + cents color coding |
| PITCH-05 | Pitch detection ignores input below noise floor threshold | RMS volume check against noise floor before pitch detection |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pitchy | 4.x | McLeod pitch detection | ESM-native, fast, handles harmonics better than autocorrelation |
| Web Audio API | native | Float32Array audio data | Already in Phase 1 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React | 19.x | UI framework | Existing in project |
| TypeScript | 5.x | Type safety | Existing in project |

**Installation:**
```bash
npm install pitchy
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── tuner/
│   │   ├── TunerDisplay.tsx      # Main tuner UI
│   │   ├── NoteDisplay.tsx      # Large note name
│   │   └── CentsDisplay.tsx     # Cents deviation with color
│   └── audio/
│       └── AudioProvider.tsx     # Phase 1 - already exists
├── hooks/
│   ├── usePitchDetection.ts     # Pitch detection logic
│   └── useNoiseFloor.ts         # Noise floor reference from calibration
├── lib/
│   ├── audio/                   # Phase 1 audio utilities
│   └── pitch/
│       ├── detector.ts          # pitchy wrapper
│       ├── notes.ts             # Note name conversion
│       └── cents.ts             # Cents deviation calculation
└── types/
    └── pitch.ts                 # Pitch detection types
```

### Pattern 1: Pitch Detection with Pitchy

**What:** Real-time pitch detection using McLeod method
**When:** Need accurate pitch detection for monophonic instruments (piano)
**Example:**
```typescript
// Source: pitchy npm package documentation
import { PitchDetector } from 'pitchy';

const sampleRate = 44100;
const inputLength = 2048;
const detector = PitchDetector.forFloat32Array(inputLength);

function detectPitch(audioData: Float32Array, sampleRate: number) {
  const [frequency, clarity] = detector.findPitch(audioData, sampleRate);
  
  // clarity is 0-1, higher = more confident
  if (clarity > 0.9 && frequency > 20) {
    return { frequency, clarity };
  }
  return null;
}
```

### Pattern 2: Frequency to Note Conversion

**What:** Convert detected Hz to note name + cents
**When:** Display detected note to user
**Example:**
```typescript
// Source: Music theory - standard formula
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function frequencyToNote(frequency: number, a4 = 440): { note: string; octave: number; cents: number } {
  // MIDI note number from frequency
  const midiNote = 12 * Math.log2(frequency / a4) + 69;
  const roundedMidi = Math.round(midiNote);
  
  // Cents deviation from nearest note
  const cents = Math.round(1200 * Math.log2(frequency / (a4 * Math.pow(2, (roundedMidi - 69) / 12))));
  
  const noteIndex = roundedMidi % 12;
  const octave = Math.floor(roundedMidi / 12) - 1;
  
  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    cents
  };
}
```

### Pattern 3: Noise Floor Filtering

**What:** Skip pitch detection when input is too quiet
**When:** Prevent spurious pitch readings from background noise
**Example:**
```typescript
// Source: Audio processing best practices
function calculateRMS(data: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i] * data[i];
  }
  return Math.sqrt(sum / data.length);
}

function isAboveNoiseFloor(rms: number, noiseFloor: number): boolean {
  // noiseFloor from calibration (in dB or linear)
  // Add small margin above noise floor
  return rms > noiseFloor * 1.5;
}
```

### Pattern 4: Real-time Pitch Loop

**What:** Continuous pitch detection using requestAnimationFrame
**When:** Need 30+ FPS pitch detection
**Example:**
```typescript
// Source: Web Audio API patterns
function usePitchDetection(audioContext: AudioContext, stream: MediaStream) {
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
  
  const bufferLength = analyser.fftSize;
  const inputBuffer = new Float32Array(bufferLength);
  const detector = PitchDetector.forFloat32Array(bufferLength);
  
  const [pitch, setPitch] = useState<{ note: string; cents: number } | null>(null);
  
  useEffect(() => {
    let animationId: number;
    
    const detect = () => {
      analyser.getFloatTimeDomainData(inputBuffer);
      
      // Check RMS first
      const rms = calculateRMS(inputBuffer);
      if (isAboveNoiseFloor(rms, noiseFloorRef.current)) {
        const [frequency, clarity] = detector.findPitch(inputBuffer, audioContext.sampleRate);
        
        if (clarity > 0.9 && frequency > 20 && frequency < 5000) {
          const { note, octave, cents } = frequencyToNote(frequency);
          setPitch({ note: `${note}${octave}`, cents });
        } else {
          setPitch(null);
        }
      } else {
        setPitch(null);
      }
      
      animationId = requestAnimationFrame(detect);
    };
    
    detect();
    return () => cancelAnimationFrame(animationId);
  }, [audioContext, stream]);
  
  return pitch;
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pitch detection algorithm | Custom autocorrelation | pitchy (McLeod) | McLeod handles harmonics better, avoids octave errors |
| Frequency-to-note math | Custom formula | Standard MIDI formula | Well-tested, handles all frequencies |
| Cents calculation | Custom log formula | 1200 × log2 | Standard music theory |
| Real-time loop | setInterval | requestAnimationFrame | Syncs with display refresh, pauses when tab hidden |

**Key insight:** Pitch detection is a solved problem. Use pitchy - it's optimized for real-time use and handles the complex math of McLeod method. Only build thin wrappers for your specific UI needs.

## Common Pitfalls

### Pitfall 1: Octave Errors on Piano High Notes

**What goes wrong:** Detected pitch is an octave lower than actual
**Why it happens:** Piano harmonics above C5 are stronger than fundamental; autocorrelation detects wrong peak
**How to avoid:** Use McLeod method (pitchy) which handles harmonics better; tune clarity threshold; prefer higher frequency peaks when clarity is high
**Warning signs:** Playing C6 shows as C5, octaves consistently wrong

### Pitfall 2: Spurious Pitch on Background Noise

**What goes wrong:** Random numbers displayed when no note playing
**Why it happens:** Pitch detection runs on silence/background noise
**How to avoid:** Check RMS/volume before pitch detection; use clarity threshold from pitchy (>0.9); use noise floor from calibration
**Warning signs:** Notes appearing when room is quiet

### Pitfall 3: UI Not Updating (React)

**What goes wrong:** Pitch detection running but UI stuck
**Why it happens:** Stale closure in useEffect, not including pitch in dependency array
**How to avoid:** Use useRef for mutable pitch data, or ensure proper dependency management
**Warning signs:** Console shows no errors but UI doesn't update

### Pitfall 4: Buffer Underruns / Audio Glitches

**What goes wrong:** Choppy pitch detection, missed notes
**Why it happens:** Processing takes too long, buffer not filled fast enough
**How to avoid:** Use 2048 FFT size (not 4096); pitchy is optimized for real-time; don't do heavy processing in the loop
**Warning signs:** Inconsistent pitch readings, "Play a note" showing during actual playing

### Pitfall 5: iOS Safari AudioContext Suspension

**What goes wrong:** Pitch detection stops after ~30 seconds on iOS
**Why it happens:** iOS Safari suspends AudioContext after inactivity
**How to avoid:** Resume AudioContext on any user interaction; may need to handle in parent component
**Warning signs:** Works on desktop, fails on iOS after idle

## Code Examples

### Tuner Color Coding
```typescript
// Source: CONTEXT.md requirements
function getCentsColor(cents: number): string {
  const absCents = Math.abs(cents);
  if (absCents <= 5) return 'text-green-500';  // In tune
  if (cents > 0) return 'text-red-500';       // Sharp
  return 'text-blue-500';                       // Flat
}
```

### Note Display Format
```typescript
// Source: CONTEXT.md - C#4 format, show octave, prefer sharps
function formatNote(note: string, octave: number): string {
  // Already using sharps from NOTE_NAMES array
  return `${note}${octave}`;  // e.g., "C#4"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Autocorrelation | McLeod Pitch Method | 2005 paper | Better harmonics handling |
| ScriptProcessorNode | AnalyserNode + requestAnimationFrame | 2018+ | Main thread not blocked |
| Zero-crossing | FFT-based methods | ~2010 | Much more accurate |

**Deprecated/outdated:**
- **Zero-crossing pitch detection:** Very inaccurate, not suitable for musical instruments
- **ScriptProcessorNode:** Deprecated, being removed from browsers

## Open Questions

1. **What clarity threshold works best for piano?**
   - What we know: pitchy returns clarity 0-1, higher = more confident
   - What's unclear: Exact threshold for piano vs other instruments
   - Recommendation: Start with 0.9, tune based on testing

2. **How to handle transposing pianos (slightly off pitch)?**
   - What we know: Standard A4=440Hz, some pianos are 442Hz
   - What's unclear: Allow user to adjust reference pitch?
   - Recommendation: Start with 440Hz default, add setting if needed

3. **Buffer size tradeoffs?**
   - What we know: 2048 samples = ~46ms at 44100Hz
   - What's unclear: Need faster response (smaller buffer) vs accuracy (larger)
   - Recommendation: 2048 is good balance; try 1024 if need faster response

## Sources

### Primary (HIGH confidence)
- [pitchy npm](https://www.npmjs.com/package/pitchy) - Library documentation
- [pitchy GitHub](https://github.com/ianprime0509/pitchy) - Source and examples
- [Music Stack Exchange: Cents calculation](https://music.stackexchange.com/questions/17566) - Verified formula
- [Newt UNSW: Note frequencies](https://newt.phys.unsw.edu.au/jw/notes.html) - Note/frequency reference

### Secondary (MEDIUM confidence)
- [WebSearch: piano pitch detection harmonics](https://www.researchgate.net/publication/267419130) - Harmonics handling research

### Tertiary (LOW confidence)
- [WebSearch: pitch detection react](https://alexanderell.is/posts/tuner/) - Implementation patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - pitchy is well-documented, ESM-compatible with Vite
- Architecture: HIGH - React hooks pattern widely used for audio
- Pitfalls: MEDIUM - Most issues known, but may need device testing

**Research date:** 2026-02-28
**Valid until:** 2026-04-01 (30 days - stable domain)

---
*Research for Phase 2: Pitch Detection*
