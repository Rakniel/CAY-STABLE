# OSS adaptation — ball motion validity before possession assignment

## Provenance
- Primary design source: `mradovic38/football-analysis`
- Upstream revision inspected: `1aaac243cc41924f80c0fc904cb0f1ce8c9ecc7d` (2025-01-14)
- Relevant upstream file inspected: `ball_to_player_assignment/ball_to_player_assigner.py`
- License: MIT (`LICENSE`, copyright 2024 Mihailo Radović)
- Local status: **ADAPTED IN CLEAN ROOM**. No upstream source code, trained models or Python dependencies are copied/imported into CAY-STABLE.

## Useful upstream idea
The upstream possession pipeline does not trust every detected ball position equally: it keeps short ball history and rejects ball movement considered implausible before assigning the ball to a nearby player. This is especially useful when a detector jumps to a false ball-like object.

## CAY-STABLE adaptation
CAY already had stricter metric-space player/ball proximity, confidence, ambiguity, stable-ownership duration, plan continuity and event-coverage rules. Replacing that logic would be a regression, so `ball_event_state_v1.js` is extended rather than duplicated.

The adaptation adds two conservative motion gates from validated pitch-metre observations within the same camera plan:

1. **Implausible-motion rejection** — default observed ball speed > 45 m/s returns `UNAVAILABLE` for that frame. The interval cannot improve observable coverage and the ball cannot be assigned to a player.
2. **Fast-ball ownership veto** — default observed ball speed > 22 m/s keeps the ball observable but `FREE`, preventing a clearly fast pass/shot from being credited as controlled possession merely because it crosses a player's proximity radius. The threshold remains configurable for representative-footage tuning.

Motion is evaluated only when both observations have sufficient ball confidence, timestamps are increasing, the gap is <= `maxObservationGapSec`, and the continuity key/plan is unchanged. No motion evidence crosses camera cuts.

## What this replaces / avoids
- avoids adding a second possession/ball-validity service beside `ball_event_state_v1.js`;
- avoids importing the upstream Python/OpenCV/model stack;
- avoids silently crediting high-speed pass-through frames as player possession;
- avoids counting detector teleportation as valid ball coverage.

## Expected gain
- Estimated engineering work avoided: **0.25–0.5 day** of separate ball-validity plumbing and duplicated possession state.
- Expected measurable impact: lower false possession time and fewer false owner transitions on ball-detector jumps / fast passes, while preserving observed FREE-ball coverage.
- New diagnostics: `motionEvaluatedFrames`, `motionRejectedFrames`, `fastBallFreeFrames` and published thresholds.
- No accuracy percentage is claimed until representative C.A. Yenne match footage is benchmarked before/after.

## Risks and dependencies
- The first development prototype used a 12 m/s default ownership threshold. Full CAY non-regression correctly showed that this was too aggressive: it delayed receiver acquisition in an existing valid synthetic pass sequence. The default was therefore raised to **22 m/s** rather than weakening the historical pass test. A stricter threshold can still be configured and benchmarked on representative footage.
- Metric motion requires validated homography/segment projection upstream. Without defensible pitch coordinates, event statistics remain `INDISPONIBLE` through existing guards.
- Ball height is not available, so the gate cannot distinguish aerial from ground motion directly.
- Model/checkpoint licenses remain independent from this MIT design reference.

## Validation
- Existing `tests/ball_event_state_nonregression.js` and the full JavaScript non-regression suite remain mandatory.
- `tests/ball_motion_ownership_nonregression.js` covers default fast pass-through ownership veto, configurable stricter gating, implausible motion rejection, normal controlled-ball compatibility, same-plan pass detection and camera-plan boundary isolation.
- The initial CI failure at the 12 m/s default is retained as design evidence: the implementation was corrected, not the existing regression expectation.
