# Open-source audit — Simo-03/football-player-detection

Audit date: 2026-09-25

## Provenance
- Source: https://github.com/Simo-03/football-player-detection
- License: MIT (repository LICENSE, copyright 2025 Selim Sherif)
- Upstream state inspected: default branch `main`; README current at audit time.
- No upstream source code, model weights, thresholds, or datasets are copied into CAY-STABLE by this audit.

## Useful evidence
The project is a compact end-to-end football pipeline covering player/GK/referee tracking, dedicated ball detection, pitch keypoints, RANSAC homography, team assignment, possession, passes/turnovers, heatmaps, trajectories and reports. Its published 30-second evaluation reports 23 player tracks with median 750-frame duration, 693/750 frames with valid homography (92.4%), and ball detections on 633/750 frames (84.4%). It also explicitly states what it has *not* validated yet: full MOTChallenge metrics, independent homography ground-truth error and pass/possession precision-recall. That disclosure is useful for CAY-STABLE's evidence policy.

The most reusable architectural idea is not an algorithm import but an evaluation boundary: report detection coverage, tracking continuity and homography availability separately instead of turning downstream outputs into a single opaque success metric. CAY-STABLE already has separate coverage/provenance contracts, so this should reinforce rather than duplicate them.

## CAY-STABLE decision
### Adapt
For future representative C.A. Yenne video benchmarks, record at least these independent layers before accepting a tracking/calibration change:
1. player/ball observation coverage;
2. tracking continuity / ID switches (plus HOTA/IDF1 when labelled truth exists);
3. validated metric-calibration coverage and reprojection error;
4. downstream trajectory/heatmap coverage;
5. event precision/recall only when labelled ball-event truth exists.

A backend must not be promoted merely because it increases downstream availability. Availability obtained from stale or weak geometric evidence is a regression under CAY's fail-closed policy.

### Reject / do not transplant
The upstream pipeline can reuse a previous homography for up to 60 frames after a candidate calibration fails. CAY-STABLE must **not** copy that behavior as a generic fallback. Existing CAY metric modules deliberately require segment/anchor/freshness evidence and return `INDISPONIBLE` when metric proof is no longer defensible. Short propagation is acceptable only through the existing guarded camera-motion artifact contract with explicit provenance, support/inlier/residual evidence, segment isolation and age limits.

The repository's YOLO model files/weights are also outside this MIT-code decision. They require separate provenance/license auditing before any use. Likewise Ultralytics/runtime dependencies must be audited independently; the repository MIT license does not automatically relicense transitive dependencies or weights.

## Expected impact
- Work avoided: roughly 0.5–1 day of benchmark-metric design by reusing the upstream separation of coverage/continuity/calibration reporting as an evaluation reference.
- Expected measurable effect: clearer before/after acceptance reports and lower risk of claiming a tracking/calibration improvement that merely increases guessed/stale outputs.
- Runtime impact: none in this audit.
- Status: **studied; evaluation principle adapted; stale-homography fallback rejected; runtime/models not integrated**.
