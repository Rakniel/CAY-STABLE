# Open-source components and design references

CAY-STABLE uses a reuse-first policy: prefer mature, legally compatible building blocks or documented design patterns over rewriting proven tracking/calibration logic. External code is never copied without checking its license and integration cost.

## ByteTrack
- Source: https://github.com/FoundationVision/ByteTrack
- License: MIT
- Status in CAY-STABLE: design pattern adapted, no source code copied.
- CAY use: confidence cascade for tracking. High-confidence detections may initialize tracks; lower-confidence detections are reserved for recovering an already-existing track and must not create new player IDs.
- Local implementation: `tracking_confidence_cascade_v1.js`.
- Expected benefit: fewer ID breaks when a player is briefly blurred, partly hidden or poorly detected, without increasing false CAY IDs from weak detections.

## BoT-SORT
- Source: https://github.com/NirAharon/BoT-SORT
- License: MIT
- Status: evaluated / candidate.
- Candidate use: camera-motion compensation and stronger multi-cue association for difficult pans/zooms.
- Constraint: only integrate pieces that materially outperform the lighter CAY runtime on amateur-club footage.

## TrackLab
- Source: https://github.com/TrackingLaboratory/tracklab
- License: MIT
- Status: evaluated / architecture reference and candidate backend.
- Candidate use: modular tracker/ReID interfaces and evaluation methodology.
- Constraint: Python/PyTorch stack is significantly heavier than the current browser-first CAY runtime; do not make it mandatory unless the measurable gain justifies it.

## SoccerNet Game State Reconstruction
- Source: https://github.com/SoccerNet/sn-gamestate
- License: GPL-3.0
- Status: architecture/benchmark reference only for now.
- Useful ideas: end-to-end athlete tracking, ReID, calibration and game-state reconstruction.
- License rule: do not copy GPL-3.0 implementation code into CAY-STABLE unless the project deliberately adopts compatible distribution obligations.

## Integration rules
1. Keep CAY-STABLE branding, data contracts and UX independent from external projects.
2. Document source, license, version/commit when code is actually incorporated.
3. Add non-regression tests for every adapted component.
4. Prefer explicit `INDISPONIBLE` over guessed statistics.
5. External components must not weaken the 11-on-field invariant, bench/spectator exclusion or CAY identity guards.
6. Measure before/after gains on representative football footage before making a heavy dependency mandatory.
