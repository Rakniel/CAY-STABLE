# SRITrack edge-partial recovery guard — 2026-09-03

## Source

- Project: `kaoyuyukao/SRITrack`
- Repository: https://github.com/kaoyuyukao/SRITrack
- License: MIT (verified from repository LICENSE / GitHub metadata during audit)
- Release context: repository release announced March 1, 2026; sports-broadcast MOT focused on re-entry, occlusion and dynamic camera motion.
- CAY integration target: `player_candidate_recovery_v1.js` v1.1.0.

## What was reused

No SRITrack code, weights, checkpoints or dependencies were copied.

CAY adapted one architectural idea: detections touching the image boundary are higher-risk because they may be partial observations. SRITrack-style pipelines can filter such detections to protect identity continuity.

For C.A. Yenne amateur sideline footage, outright rejection is too aggressive because a real player often enters the camera frame from the boundary. CAY therefore uses an intentionally different policy:

1. keep the recovered generic player candidate;
2. mark it `edgePartial: true` and record `edgeSides`;
3. cap/reduce appearance-only confidence;
4. keep `candidateOnly: true` and `teamEvidence: 'NONE'`;
5. never use the border observation alone to prove CAY identity.

## What this replaces

Previously, a border-touching appearance recovery candidate was scored exactly like an equivalent central candidate. That made partial jersey/body fragments unnecessarily competitive during recovery.

The new guard converts border proximity into explicit uncertainty without deleting legitimate entrants.

## Expected measurable impact

- Legitimate edge entrants retained: target 100% versus an outright border-drop policy.
- Appearance-only confidence for edge-partial candidates: capped at 0.14 by default.
- Team identity proof added by this component: 0; remains strictly `NONE`.
- Expected reduction: fewer false fresh-track / wrong-recovery promotions caused by partial body fragments at frame boundaries.

## Time saved

Estimated 0.5 day of designing a border-fragment policy and failure cases from scratch. The mature sports-MOT pattern gave a direct risk signal; CAY only had to adapt it conservatively to amateur footage.

## Risks / dependencies

- No new runtime dependency.
- No copied third-party code.
- Border margin and confidence cap still need validation on real C.A. Yenne videos.
- A wide border margin would over-penalize valid players; default is intentionally narrow (1.5% of the shorter frame dimension).
- This guard is not ReID by itself and must not be interpreted as identity evidence.

## Status

Integrated on validation branch; promote to STABLE only after syntax/non-regression CI passes.
