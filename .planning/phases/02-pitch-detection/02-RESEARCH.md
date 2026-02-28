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

## External App Patterns

**Researched:** 2026-03-01
**Focus:** Noise gating, hysteresis, detection sensitivity patterns from external tuner applications
**Confidence:** MEDIUM-HIGH (based on open source implementations and audio engineering documentation)

### Summary

Research into how professional and open source tuner applications handle the noise gate problem reveals consistent patterns. The key insight is that **hysteresis** (different thresholds for opening and closing the gate) is the industry-standard solution to prevent "chattering" - the annoying flicker between detected and no-signal states.

### Noise Gate Fundamentals (from Wikipedia Noise Gate article)

Professional noise gates implement several key parameters:

| Parameter | Purpose | Typical Values |
|-----------|---------|----------------|
| **Threshold** | Level to open gate | -40dB to -20dB depending on source |
| **Hysteresis** | Gap between open/close thresholds | 3-6 dB below open threshold |
| **Attack** | Fade-in time | 0.5-10ms for responsive feel |
| **Hold** | Time gate stays open after signal drops | 10-50ms to avoid chopping |
| **Release** | Fade-out time | 20-100ms for smooth decay |

**Key principle:** "Noise gates often implement hysteresis, that is, they have two thresholds: one to open the gate and another, set a few dB below, to close the gate. This means that once a signal has dropped below the close threshold, it has to rise to the open threshold for the gate to open, so that a signal that crosses over the close threshold regularly does not open the gate and cause chattering."

### Open Source Implementation Patterns

#### Pattern 1: RMS Threshold (cwilso/PitchDetect, alexanderell tuner)
**Source:** [github.com/cwilso/PitchDetect](https://github.com/cwilso/PitchDetect), 1.4k stars

```typescript
// Fixed RMS threshold - simple but effective
function autoCorrelate(buffer: Float32Array, sampleRate: number) {
  var rms = 0;
  for (var i = 0; i < buffer.length; i++) {
    var val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / buffer.length);
  
  if (rms < 0.01) // not enough signal
    return -1;
  
  // ... pitch detection continues
}
```

**Characteristics:**
- Fixed threshold: `rms < 0.01`
- No hysteresis (same threshold for open/close)
- Simple, works for basic tuning
- Can cause chattering at boundary levels

**Limitation:** Without hysteresis, signals hovering near 0.01 RMS will rapidly flicker between detected/not-detected states.

#### Pattern 2: Confidence Ratio (jbergknoff/guitar-tuner)
**Source:** [github.com/jbergknoff/guitar-tuner](https://github.com/jbergknoff/guitar-tuner), 179 stars

```javascript
// Compute the average magnitude
var average = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
var confidence = maximum_magnitude / average;
var confidence_threshold = 10; // empirical, arbitrary

if (confidence > confidence_threshold) {
  // Signal is strong enough relative to background
  document.getElementById("note-name").textContent = dominant_frequency.name;
}
```

**Characteristics:**
- Dynamic threshold: requires signal 10x stronger than average
- Self-calibrating to current noise level
- No explicit hysteresis, but ratio provides natural stability
- More robust in varying noise environments

#### Pattern 3: Smoothing with Count Threshold (alexanderell tuner)
**Source:** [alexanderell.is/posts/tuner/](https://alexanderell.is/posts/tuner/)

```typescript
var smoothingCount = 0;
var smoothingThreshold = 5;      // Hz difference for "similar"
var smoothingCountThreshold = 5;  // frames required

// Check if note is stable before displaying
function noteIsSimilarEnough() {
  if (typeof(valueToDisplay) == 'number') {
    return Math.abs(valueToDisplay - previousValueToDisplay) < smoothingThreshold;
  }
  return valueToDisplay === previousValueToDisplay;
}

if (noteIsSimilarEnough()) {
  if (smoothingCount < smoothingCountThreshold) {
    smoothingCount++;
    return; // Don't update display yet
  } else {
    previousValueToDisplay = valueToDisplay;
    smoothingCount = 0;
  }
} else {
  previousValueToDisplay = valueToDisplay;
  smoothingCount = 0;
  return; // Reset, don't display
}
```

**Smoothing options provided:**
| Mode | Hz Threshold | Frame Count |
|------|-------------|-------------|
| None | 99999 | 0 |
| Basic | 10 Hz | 5 frames |
| Very | 5 Hz | 10 frames |

**Characteristics:**
- Temporal consistency requirement
- Note must be stable for N consecutive frames
- Prevents flicker from momentary readings
- Trade-off: adds latency (5-10 frames × ~16ms = 80-160ms)

### Recommended Hysteresis Pattern for KeySense

Based on research, implement a **two-threshold hysteresis pattern** with **temporal smoothing**:

```typescript
// Noise gate state machine
type GateState = 'closed' | 'opening' | 'open' | 'closing';

interface NoiseGate {
  state: GateState;
  openThreshold: number;     // RMS multiplier to open (e.g., 1.5x noise floor)
  closeThreshold: number;    // RMS multiplier to close (e.g., 1.1x noise floor)
  holdFrames: number;        // Frames to hold open after signal drops
  currentHoldCount: number;
}

function updateGate(
  gate: NoiseGate, 
  currentRMS: number, 
  noiseFloor: number
): boolean {
  const openLevel = noiseFloor * gate.openThreshold;
  const closeLevel = noiseFloor * gate.closeThreshold;
  
  switch (gate.state) {
    case 'closed':
      if (currentRMS > openLevel) {
        gate.state = 'open';
        gate.currentHoldCount = 0;
        return true; // Gate opens
      }
      return false;
      
    case 'open':
      if (currentRMS > closeLevel) {
        gate.currentHoldCount = 0;
        return true; // Still above close threshold
      } else {
        gate.currentHoldCount++;
        if (gate.currentHoldCount >= gate.holdFrames) {
          gate.state = 'closed';
          return false; // Gate closes after hold period
        }
        return true; // In hold period
      }
      
    default:
      return gate.state === 'open';
  }
}
```

### Recommended Values Based on Research

| Parameter | Recommended Value | Rationale |
|-----------|------------------|-----------|
| **Open threshold** | 1.5× noise floor RMS | Standard from existing research; matches 0.01 RMS pattern assuming ~0.007 noise floor |
| **Close threshold** | 1.1× noise floor RMS | 3-6dB below open threshold (Wikipedia standard); prevents chattering |
| **Hold frames** | 5-8 frames (~80-130ms) | Matches piano note decay; prevents premature cutoff |
| **Clarity threshold** | 0.85-0.95 | pitchy-specific; lower for piano harmonics |

### Hysteresis Ratio Explanation

The **1.5x open / 1.1x close** pattern creates a ~2.7dB gap:
- `20 * log10(1.5 / 1.1) ≈ 2.7 dB`
- This is slightly smaller than the typical 3-6dB recommendation
- For piano with long sustain, a smaller gap is appropriate

**Alternative ratios to consider:**
| Ratio | Gap | Use Case |
|-------|-----|----------|
| 2.0x / 1.2x | 4.4 dB | Noisy environments, percussive sources |
| 1.5x / 1.1x | 2.7 dB | Piano sustain, quiet environments |
| 1.3x / 1.05x | 1.9 dB | Very sensitive, may cause chattering |

### Visual Feedback Patterns

Professional tuners provide visual feedback for detection state:

#### Pattern: Level Meter with Gate Indicator
```
┌─────────────────────────────────┐
│         C#4                     │  ← Note display
│        +3 cents                 │  ← Cents (red = sharp)
│                                 │
│  [▓▓▓▓▓▓▓░░░░░░] ── OPEN       │  ← Level meter + gate state
│  └───┴───┴───────┘              │
│   ↑   ↑                         │
│  close open                     │  ← Threshold indicators
└─────────────────────────────────┘
```

**What helps users understand detection:**
1. **Level meter** - Shows current input volume
2. **Threshold markers** - Shows where open/close thresholds are
3. **Gate state indicator** - "OPEN", "LISTENING", or just hide when closed
4. **"Play a note" message** - Clear instruction when gate is closed

### Piano-Specific Considerations

Piano presents unique challenges compared to guitar:

| Characteristic | Piano | Guitar | Impact |
|---------------|-------|--------|--------|
| Attack | Very fast (10-30ms) | Medium (50-100ms) | Need faster gate response |
| Decay | Long (2-10s) | Medium (1-3s) | Need longer hold time |
| Harmonics | Complex, dominant above C5 | Simpler | Need robust pitch detection |
| Dynamic range | Very wide (ppp to fff) | Narrower | Need adaptive thresholds |

**Piano-specific recommendations:**
1. **Shorter attack** - Gate should open immediately when note struck
2. **Longer hold** - 100-150ms to handle note sustain without chattering
3. **Lower clarity threshold** - 0.85 instead of 0.95 for harmonic-rich high notes
4. **Frequency-dependent behavior** - Consider different thresholds for low vs high notes

### FastTune Insights (Advanced)

[FastTune](https://github.com/FastTune/FastTune) uses AI/transformer models to achieve 100-200ms faster response than traditional algorithms. Key insights:

- **Onset resonance interference** - Strong resonance peaks at note start (especially guitar) can mislead pitch detection for 200ms+
- **Solution approach** - Train model to recognize resonance patterns and extract true fundamental faster
- **For KeySense** - Not necessary for MVP, but explains why initial ~200ms may show unstable readings

### Latency Expectations

What makes detection feel "responsive" vs "laggy":

| Response Time | User Perception |
|--------------|-----------------|
| <50ms | Instant, professional feel |
| 50-100ms | Acceptable for tuning |
| 100-200ms | Noticeable delay, still usable |
| >200ms | Laggy, frustrating |

**KeySense target:** 50-100ms total latency (buffer + processing + rendering)

### Recommended Implementation for PITCH-05

Based on this research, the recommended approach for KeySense:

```typescript
interface DetectionConfig {
  // Noise gate
  openThresholdMultiplier: 1.5,    // 1.5x noise floor to open
  closeThresholdMultiplier: 1.1,   // 1.1x noise floor to close (2.7dB hysteresis)
  holdFrames: 6,                    // ~100ms at 60fps
  
  // Pitch quality
  minClarity: 0.85,                 // pitchy clarity threshold
  minFrequency: 27.5,               // A0 - lowest piano note
  maxFrequency: 4186,               // C8 - highest piano note
  
  // Smoothing
  frameConsistency: 3,              // Require 3 consistent frames
  frequencyTolerance: 5,            // Hz tolerance for "same note"
}
```

### Sources

#### Primary (HIGH confidence)
- [Wikipedia: Noise Gate](https://en.wikipedia.org/wiki/Noise_gate) - Hysteresis definition, professional audio standards
- [cwilso/PitchDetect](https://github.com/cwilso/PitchDetect) - 1.4k stars, RMS threshold pattern
- [alexanderell.is/posts/tuner/](https://alexanderell.is/posts/tuner/) - Smoothing patterns, implementation walkthrough

#### Secondary (MEDIUM confidence)
- [jbergknoff/guitar-tuner](https://github.com/jbergknoff/guitar-tuner) - Confidence ratio pattern
- [FastTune](https://github.com/FastTune/FastTune) - Onset resonance insights

#### Tertiary (LOW confidence - needs validation)
- User's current 1.5x/1.1x hysteresis values - Reasonable based on research, needs testing

---

*External App Patterns research added: 2026-03-01*
*Research for Phase 2: Pitch Detection*
