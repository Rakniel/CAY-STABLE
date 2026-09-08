# OSS note — SportVision + fail-closed ball/player ambiguity (2026-09-08)

## Source reviewed
- Project: MohibShaikh/sportvision
- URL: https://github.com/MohibShaikh/sportvision
- License: Apache-2.0 (repository license as reviewed 2026-09-08)
- Relevant ideas: modular detector/tracker interchange, ByteTrack integration, pitch homography, team assignment, possession/speed/distance/heatmaps.

## CAY-STABLE decision
No code is copied. The useful architectural idea is the separation between ball detection/tracking and downstream association/analytics. CAY-STABLE keeps its stricter evidence gates instead of adopting nearest-player possession heuristics directly.

The current CAY ball/player drift guard previously selected the closest on-field player whenever that player was inside the proximity gate. That is not sufficiently defensible when two players are almost equally close to the ball. The adaptation introduced here is internal CAY logic: rank eligible players, compare the first two distances, and fail closed when the nearest-neighbour margin is below a configurable ambiguity threshold.

## What changed
- `ball_player_drift_guard_v1.js`
  - adds `ambiguityPitchM` and `ambiguityImage` thresholds;
  - returns `AMBIGUOUS_NEAREST_PLAYERS` instead of anchoring the ball to an arbitrary player when the first two candidates are too close;
  - exposes `associationAvailable=false` for ambiguous/non-associated cases;
  - resets attachment evidence on ambiguity so ambiguity cannot accumulate into a false drift decision;
  - counts ambiguous associations in the diagnostic snapshot.
- `tests/ball_player_drift_guard_nonregression.js`
  - adds a dense-player ambiguity regression;
  - verifies that a clearly separated nearest player still behaves exactly as before.

## Why this is useful for C.A. Yenne
This reduces false ball→player ownership/attachment around duels, tackles and crowded penalty-area scenes. It also prepares possession/pass logic for a stricter rule: association must be demonstrably unique, otherwise the result remains unavailable.

## Reuse / licensing status
- SportVision: studied only, Apache-2.0, no copied code or weights.
- CAY implementation: original adaptation, internal project code.
- Runtime dependency added: none.
- Risk: thresholds need validation on real C.A. Yenne footage before they are reused as possession thresholds; for now they only protect the drift/association guard.

## Expected gain
Avoids implementing an entire separate ball-owner resolver just to obtain a basic ambiguity gate. Estimated work avoided: ~0.5 day. Expected measurable impact: fewer false player anchors in dense scenes, while preserving all existing `INDISPONIBLE`/fail-closed principles.
