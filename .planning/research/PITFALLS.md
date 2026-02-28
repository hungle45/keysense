# Pitfalls Research

**Domain:** Real-time pitch detection web apps
**Researched:** 2026-02-28
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Wrong Pitch Detection Algorithm

**What goes wrong:**
Pitch detection returns incorrect notes, especially misidentifying octaves (detecting C3 when C4 is played) or jumping between notes unpredictably.

**Why it happens:**
Developers default to autocorrelation because it's simple to implement, but autocorrelation fails on musical instruments where harmonic energy exceeds fundamental frequency energy. Piano hammer attacks also produce noise that autocorrelation misinterprets as pitch.

**How to avoid:**
Use YIN algorithm or ML-based approaches (CREPE, SwiftF0) instead of autocorrelation. For real-time web apps, YIN is a good balance of accuracy and performance. Benchmark on actual piano recordings, not just sine waves.

**Warning signs:**
- Testing only with pure sine wave generators
- Octave errors on real instrument recordings
- High-pitched notes consistently wrong

**Phase to address:**
Research phase - Algorithm selection must happen before implementation

---

### Pitfall 2: Ignoring Mobile Microphone Quality

**What goes wrong:**
Pitch detector works on desktop but fails on mobile phones due to poor microphone quality, especially on low-end Android devices.

**Why it happens:**
Phone microphones have limited frequency response, add background noise, and have automatic gain control that distorts strong signals. Pitch algorithms assume clean input.

**How to avoid:**
- Implement noise gating based on measured room noise floor
- Add signal quality indicators to warn users
- Test on actual low-end devices, not just flagship phones
- Include calibration to measure ambient noise before use

**Warning signs:**
- Works perfectly in testing, fails with real users
- Detection more accurate with external USB mic
- Inconsistent results between different phones

**Phase to address:**
Implementation phase - Must test on real mobile devices early

---

### Pitfall 3: iOS Safari Audio Context Restrictions

**What goes wrong:**
App works on Android/Chrome but fails on iOS - microphone doesn't activate, audio glitches occur, or permissions are repeatedly re-requested.

**Why it happens:**
- iOS Safari suspends AudioContext after 30 seconds of inactivity, requiring user interaction to resume
- getUserMedia must be called from user gesture (button tap)
- iOS re-requests microphone permission after brief inactivity even in same session
- Web Audio API has different limitations than native

**How to avoid:**
- Always initialize audio context on button tap, not on page load
- Implement AudioContext.resume() on any user interaction
- Handle permission denial gracefully with clear instructions
- Test on actual iOS devices early - simulators don't replicate audio behavior

**Warning signs:**
- Works in Chrome DevTools mobile mode
- Fails on actual iPhone
- Permission prompt doesn't appear

**Phase to address:**
Implementation phase - Mobile browser testing must be part of development

---

### Pitfall 4: High Note Detection Failure

**What goes wrong:**
App works for middle piano notes but fails on high notes (above C5), showing unstable readings or no detection.

**Why it happens:**
High-frequency notes have less energy in the fundamental frequency and more in overtones. Autocorrelation and basic algorithms struggle because the "true" pitch has weaker signal than harmonics.

**How to avoid:**
Use algorithms designed for high-frequency content (YIN handles this better than autocorrelation). Implement harmonic analysis to identify when detected frequency is likely an overtone.

**Warning signs:**
- Detection works on low/mid piano but not high notes
- High notes flicker between octaves
- Results improve when playing softly vs loudly on high notes

**Phase to address:**
Research phase - Algorithm must be evaluated on full piano range

---

### Pitfall 5: Excessive Latency

**What goes wrong:**
Detected pitch appears noticeably delayed from actual note, making the app unusable for real-time practice feedback.

**Why it happens:**
- Large buffer sizes for audio processing (e.g., 4096 samples at 44.1kHz = ~93ms latency)
- Processing on main thread causes UI jank
- Garbage collection pauses in JavaScript

**How to avoid:**
- Use AudioWorklet for processing (runs on high-priority thread)
- Keep buffer sizes small (256-512 samples for <12ms latency)
- Pre-allocate all objects to avoid garbage collection
- Test latency with visual feedback synchronized to audio

**Warning signs:**
- Noticeable delay between playing and seeing the note
- Audio glitches when other apps run in background
- Performance degrades on slower devices

**Phase to address:**
Implementation phase - Performance testing must include latency measurement

---

### Pitfall 6: Unstable Readings Without Smoothing

**What goes wrong:**
Pitch reading flickers rapidly between correct note and adjacent notes, making it impossible for users to trust the feedback.

**Why it happens:**
Real audio signals have natural micro-variations. Without temporal smoothing or confidence thresholds, every frame's raw detection is displayed.

**How to avoid:**
- Implement note stability requirements (note must be consistent for N milliseconds)
- Add confidence threshold (only display if correlation > X%)
- Use hysteresis to prevent flickering at boundaries

**Warning signs:**
- Users complain "the tuner can't make up its mind"
- Displayed Hz jumps around even when holding steady note
- Visual feedback inconsistent with what user hears

**Phase to address:**
Implementation phase - UX testing with actual users

---

### Pitfall 7: No Room Noise Calibration

**What goes wrong:**
App works in quiet rooms but fails in typical home environments with ambient noise (HVAC, traffic, other people).

**Why it happens:**
Background noise triggers false pitch detection or prevents detection of quiet notes. Most algorithms assume signal-to-noise ratio that doesn't exist in real environments.

**How to avoid:**
- Include pre-session calibration to measure noise floor
- Implement adaptive threshold based on measured noise level
- Show signal quality indicator to users
- Allow sensitivity adjustment

**Warning signs:**
- Works in soundproof room, fails at user's home
- Detection triggers on silence (background noise)
- Quiet notes undetected while loud ones work

**Phase to address:**
Feature definition phase - Calibration must be a planned feature

---

### Pitfall 8: Piano-Specific Timbre Ignored

**What goes wrong:**
Algorithm works on voice or violin but fails specifically on piano, missing attacks or misidentifying sustained tones.

**Why it happens:**
Piano has unique characteristics: strong attack transient (almost like noise), harmonic series with unusual ratios, and rapid decay on quiet notes. Generic pitch detection doesn't account for these.

**How to avoid:**
- Test specifically with piano recordings, not just test tones
- Adjust algorithm parameters for piano frequency range (A0=27.5Hz to C8=4186Hz)
- Consider attack transient separately from sustained pitch

**Warning signs:**
- Works on singing/tuning forks, fails on actual piano
- Misses the initial attack of each note
- Detects pitch during attack but loses it during sustain

**Phase to address:**
Research phase - Algorithm evaluation must include piano-specific testing

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using autocorrelation for simplicity | Easy to implement | Poor accuracy on real instruments, octave errors | Never for music apps |
| Large audio buffers | Simpler code | Unusable latency | Never for real-time feedback |
| Skipping mobile testing | Faster initial development | Broken on majority of user devices | Never for mobile-first product |
| Hardcoded sensitivity | Works in quiet testing | Fails in real environments | Only for MVP demo |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| getUserMedia | Calling without user gesture on iOS | Always trigger on button tap |
| AudioContext | Creating on page load | Create/resume on user gesture |
| PWA manifest | Not specifying display: standalone | Set for app-like experience |
| iOS permissions | Not handling denied state | Show clear instructions to enable in Settings |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Main thread audio processing | Audio glitches, UI freezes | Use AudioWorklet | On any device during normal use |
| GC pauses | Periodic audio dropouts | Pre-allocate buffers, avoid allocations in process loop | After ~30 seconds of use |
| Large FFT size | High latency | Use smallest buffer that still detects accurately | Always - wrong approach |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Microphone access without HTTPS | Audio intercepted | Require HTTPS for all production deployments |
| No permission timeout | Continuous access without user awareness | Request permission only when needed, release when done |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No feedback when mic not working | User confused why app doesn't respond | Clear status indicators: "Waiting for microphone..." |
| Permission denied without guidance | User thinks app broken | Show how to enable in browser settings |
| Silent failures | User doesn't know detection failed | Audio/visual feedback when note detected vs not detected |

## "Looks Done But Isn't" Checklist

- [ ] **Pitch Detection:** Works with test tones but fails on real piano — test with actual instrument recordings
- [ ] **Mobile:** Works in Chrome DevTools but fails on iOS Safari — test on real devices
- [ ] **Latency:** Acceptable in quiet room but degrades with noise — measure under realistic conditions
- [ ] **Permissions:** Handles grant but not denial — test both states
- [ ] **Calibration:** Works in studio but fails in home — test in noisy environments

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong algorithm | HIGH | Rewrite pitch detection engine |
| Mobile audio bugs | MEDIUM | Add iOS-specific handling, test on devices |
| Latency issues | MEDIUM | Migrate to AudioWorklet, optimize buffers |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Wrong algorithm | Research | Benchmark on piano recordings |
| Mobile Safari restrictions | Implementation | Test on iOS devices |
| High note detection | Research | Test full piano range |
| Latency | Implementation | Measure with visual feedback |
| Unstable readings | Implementation | User testing |
| Room noise | Feature definition | Test in various environments |
| Piano timbre | Research | Test with real piano |

## Sources

- [PitchDetector.com - Why unstable readings](https://pitchdetector.com/why-does-my-pitch-detector-give-unstable-readings/)
- [PitchDetector.com - Autocorrelation vs YIN](https://pitchdetector.com/autocorrelation-vs-yin-algorithm-for-pitch-detection/)
- [Hacker News - Realtime DSP in browser](https://news.ycombinator.com/item?id=7906674)
- [Stack Overflow - iOS Safari microphone](https://stackoverflow.com/questions/77992521/how-access-the-microphone-in-ios-17-for-web-or-pwa-applications-in-nextjs)
- [MDN - Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [Web Audio API performance notes](https://padenot.github.io/web-audio-perf/)
- [GitHub - pitch-benchmark](https://github.com/lars76/pitch-benchmark)
- [PWA iOS Limitations - MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)

---

*Pitfalls research for: Real-time pitch detection web apps*
*Researched: 2026-02-28*
