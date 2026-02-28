# KeySense Roadmap

**Project:** KeySense (O(1) Piano)
**Depth:** Comprehensive
**Total v1 Requirements:** 28
**Created:** 2026-02-28

---

## Phases

- [ ] **Phase 1: Audio Foundation** - Microphone capture, calibration, mobile UX foundation
- [ ] **Phase 2: Pitch Detection** - Real-time pitch detection with tuner display
- [ ] **Phase 3: Game Loop** - Timed practice sessions with scoring
- [ ] **Phase 4: Rhythm Module** - BPM-based timing practice
- [ ] **Phase 5: Notation Viewer** - ABC notation rendering

---

## Phase Details

### Phase 1: Audio Foundation

**Goal:** Users can grant microphone access and calibrate for their environment

**Depends on:** Nothing (first phase)

**Requirements:** AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04, CALI-01, CALI-02, CALI-03, MOBILE-01, MOBILE-02, MOBILE-03, MOBILE-04

**Success Criteria** (what must be TRUE):

1. User can tap a button to grant microphone permission via browser prompt
2. AudioContext initializes successfully on user interaction (button click)
3. Microphone stream is captured and audio data is available for processing
4. AudioContext singleton prevents multiple instances (no duplicate audio)
5. User can run calibration and see noise level displayed in dB within 10 seconds
6. Calibration detects and displays usable frequency range for piano
7. App functions on mobile Safari (iOS) with proper AudioContext handling
8. App functions on mobile Chrome (Android)
9. UI adapts to portrait orientation on mobile devices
10. All interactive elements have minimum 44x44px touch targets

**Plans:** 1 plan

**Plan list:**
- [ ] 01-audio-foundation-01-PLAN.md — Audio foundation: microphone permission, AudioContext singleton, calibration

---

### Phase 2: Pitch Detection

**Goal:** Users can see real-time pitch detection with note identification and tuner display

**Depends on:** Phase 1 (audio foundation required)

**Requirements:** PITCH-01, PITCH-02, PITCH-03, PITCH-04, PITCH-05

**Success Criteria** (what must be TRUE):

1. Pitch detection runs at 30+ FPS with minimal latency
2. Detected frequency (Hz) is converted to musical note name (e.g., C4, G3, A#5)
3. High piano notes (above C5) are detected correctly despite harmonic dominance
4. Visual tuner shows detected note with cents deviation (sharp/flat/in-tune)
5. Pitch detection ignores input below calibrated noise floor threshold

**Plans:** 1 plan

**Plan list:**
- [ ] 02-pitch-detection-01-PLAN.md — Real-time pitch detection with tuner display

---

### Phase 3: Game Loop

**Goal:** Users can practice with timed sessions that track note accuracy

**Depends on:** Phase 2 (pitch detection required for game logic)

**Requirements:** GAME-01, GAME-02, GAME-03, GAME-04, GAME-05, GAME-06

**Success Criteria** (what must be TRUE):

1. User can start a 1-minute practice session with a single tap
2. User can start a 5-minute practice session with a single tap
3. Random target notes are displayed clearly during the session
4. Session correctly tracks which notes the user hits (correct/incorrect)
5. Session displays elapsed time and remaining time in real-time
6. Session ends with a score summary showing accuracy percentage

**Plans:** TBD

---

### Phase 4: Rhythm Module

**Goal:** Users can practice timing accuracy with BPM-based beat matching

**Depends on:** Phase 3 (game loop foundation)

**Requirements:** RHYTHM-01, RHYTHM-02, RHYTHM-03, RHYTHM-04

**Success Criteria** (what must be TRUE):

1. User can set a target BPM for rhythm practice (e.g., 60, 80, 120)
2. System detects if user plays any note within the timing window of the target beat
3. Rhythm session displays a clear visual beat indicator synchronized to BPM
4. Rhythm session tracks and displays timing accuracy score

**Plans:** TBD

---

### Phase 5: Notation Viewer

**Goal:** Users can view ABC notation rendered as visual music sheets

**Depends on:** Phase 2 (pitch detection enables practice from sheets)

**Requirements:** NOTA-01, NOTA-02, NOTA-03

**Success Criteria** (what must be TRUE):

1. ABC notation string renders as a visual music sheet
2. User can load at least one sample ABC notation to view
3. Music sheet renders legibly on mobile screens (portrait orientation)

**Plans:** TBD

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Audio Foundation | 1/1 | Ready to execute | - |
| 2. Pitch Detection | 0/1 | Ready to execute | - |
| 3. Game Loop | 0/1 | Not started | - |
| 4. Rhythm Module | 0/1 | Not started | - |
| 5. Notation Viewer | 0/1 | Not started | - |

---

## Coverage Map

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

---

*Roadmap created: 2026-02-28*
*Ready for planning: `/gsd-plan-phase 1`*
