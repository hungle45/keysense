# Requirements: KeySense

**Defined:** 2026-02-28
**Core Value:** Real-time pitch detection and practice feedback for piano students using only a smartphone microphone.

## v1 Requirements

### Audio Foundation

- [ ] **AUDIO-01**: User can grant microphone permission via browser prompt
- [ ] **AUDIO-02**: AudioContext initializes on user interaction (button click)
- [ ] **AUDIO-03**: Microphone stream captured via getUserMedia
- [ ] **AUDIO-04**: AudioContext singleton prevents multiple instances

### Calibration

- [ ] **CALI-01**: User can run calibration to measure room noise floor
- [ ] **CALI-02**: Calibration displays noise level in dB
- [ ] **CALI-03**: Calibration detects and displays usable frequency range for piano

### Pitch Detection

- [ ] **PITCH-01**: Real-time pitch detection running at 30+ FPS
- [ ] **PITCH-02**: Detected frequency (Hz) converted to musical note name (e.g., C4, G3, A#5)
- [ ] **PITCH-03**: Pitch detection handles piano harmonic-dominant high notes (above C5)
- [ ] **PITCH-04**: Visual tuner shows detected note with cents deviation
- [ ] **PITCH-05**: Pitch detection ignores input below noise floor threshold

### Game Loop

- [ ] **GAME-01**: User can start 1-minute practice session
- [ ] **GAME-02**: User can start 5-minute practice session
- [ ] **GAME-03**: Random target notes displayed during session
- [ ] **GAME-04**: Session tracks correct/incorrect note hits
- [ ] **GAME-05**: Session displays elapsed time and remaining time
- [ ] **GAME-06**: Session ends with score summary (accuracy percentage)

### Rhythm Module

- [ ] **RHYTHM-01**: User can set target BPM for rhythm practice
- [ ] **RHYTHM-02**: System detects if user plays any note within timing window of target beat
- [ ] **RHYTHM-03**: Rhythm session displays visual beat indicator
- [ ] **RHYTHM-04**: Rhythm session tracks timing accuracy score

### Notation Viewer

- [ ] **NOTA-01**: ABC notation string renders as visual music sheet
- [ ] **NOTA-02**: User can load sample ABC notation
- [ ] **NOTA-03**: Music sheet renders legibly on mobile screens

### Mobile UX

- [ ] **MOBILE-01**: App functions on mobile Safari (iOS)
- [ ] **MOBILE-02**: App functions on mobile Chrome (Android)
- [ ] **MOBILE-03**: UI adapts to portrait orientation
- [ ] **MOBILE-04**: Touch targets are minimum 44x44px

## v2 Requirements

### Progress Tracking

- **PROG-01**: Session history stored locally
- **PROG-02**: User can view past session scores
- **PROG-03**: User can view improvement trends over time

### Advanced Features

- **ADV-01**: Chord detection via TensorFlow.js
- **ADV-02**: Practice recommendations based on weak areas
- **ADV-03**: Import custom ABC notation files

## Out of Scope

| Feature | Reason |
|---------|--------|
| MIDI input support | Using microphone only for lower barrier to entry |
| Real-time multiplayer | Single-player only for v1 |
| Audio output/sound synthesis | Microphone input only, no piano sound |
| OAuth/social login | Not required for personal practice app |
| Cloud sync | Local storage sufficient for v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIO-01 | Phase 1 | Pending |
| AUDIO-02 | Phase 1 | Pending |
| AUDIO-03 | Phase 1 | Pending |
| AUDIO-04 | Phase 1 | Pending |
| CALI-01 | Phase 1 | Pending |
| CALI-02 | Phase 1 | Pending |
| CALI-03 | Phase 1 | Pending |
| PITCH-01 | Phase 2 | Pending |
| PITCH-02 | Phase 2 | Pending |
| PITCH-03 | Phase 2 | Pending |
| PITCH-04 | Phase 2 | Pending |
| PITCH-05 | Phase 2 | Pending |
| GAME-01 | Phase 3 | Pending |
| GAME-02 | Phase 3 | Pending |
| GAME-03 | Phase 3 | Pending |
| GAME-04 | Phase 3 | Pending |
| GAME-05 | Phase 3 | Pending |
| GAME-06 | Phase 3 | Pending |
| RHYTHM-01 | Phase 4 | Pending |
| RHYTHM-02 | Phase 4 | Pending |
| RHYTHM-03 | Phase 4 | Pending |
| RHYTHM-04 | Phase 4 | Pending |
| NOTA-01 | Phase 5 | Pending |
| NOTA-02 | Phase 5 | Pending |
| NOTA-03 | Phase 5 | Pending |
| MOBILE-01 | Phase 1 | Pending |
| MOBILE-02 | Phase 1 | Pending |
| MOBILE-03 | Phase 1 | Pending |
| MOBILE-04 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-28*
*Roadmap created: 2026-02-28*
