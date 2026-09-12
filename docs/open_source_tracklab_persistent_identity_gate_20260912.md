# OSS provenance — TrackLab persistent identity promotion guard (2026-09-12)

## Source inspected

- Project: TrackingLaboratory/tracklab
- Upstream revision inspected: `5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2`
- Upstream version at that revision: `1.3.24`
- Upstream license: MIT
- Related benchmark concept: SoccerNet Game State Reconstruction / GS-HOTA, which evaluates localization and identity attributes on the pitch.

## What CAY-STABLE reused

No upstream source code, weights, dataset files or configuration were copied.

CAY-STABLE reused the evaluation idea that identity quality must be assessed independently from raw detection quality and that a player identity must survive difficult temporal discontinuities. The existing clean-room `tracking_identity_episode_eval_v1.js` was extended so that re-identification opportunities are derived from ground-truth player disappearance/re-entry and camera-segment changes, rather than from misses created by the candidate tracker itself.

The new `tracking_persistent_identity_promotion_gate_v1.js` composes the existing CAY tracking + metric-trajectory promotion gate and adds a final fail-closed persistent-identity check. It requires identical ground-truth re-entry opportunity counts between baseline and candidate, enough opportunities to be meaningful, and no regression in overall, long-gap or cross-segment recovery by default.

## What this replaces

It replaces a promotion blind spot where a candidate could improve HOTA/IDF1 and metric trajectory quality yet still lose the same C.A. Yenne player after a long occlusion or a multi-plan/segment transition.

It also removes a denominator bias from the legacy identity-episode metric: tracker-induced misses remain available for diagnostics, but the promotion evidence is now based on candidate-independent ground-truth re-entry opportunities.

## Expected impact

- Prevent promotion of trackers that fragment persistent player identity after genuine re-entry.
- Make ByteTrack / BoT-SORT / ReID comparisons fairer because the baseline and candidate are evaluated on the same identity opportunities.
- Protect downstream player cards, trajectories, heatmaps, distance, speed and sprint statistics from cross-player identity contamination.
- Estimated engineering work avoided versus building a separate long-term identity benchmark contract later: roughly 0.5–1 day, because the existing CAY evaluator and promotion gates are extended rather than duplicated.

## License boundary

TrackLab is MIT at the inspected repository revision. Nevertheless this integration is a clean-room adaptation of evaluation concepts only. No TrackLab or SoccerNet implementation code is vendored. SoccerNet `sn-gamestate` is GPL-3.0 and remains outside the CAY-STABLE runtime/code boundary; its code is not copied or linked into this implementation.

## Risks / dependencies

- A tiny number of ground-truth re-entry episodes is statistically weak; the gate therefore defaults to at least 3 opportunities and otherwise returns `INSUFFICIENT_EVIDENCE`.
- Real C.A. Yenne validation clips still need representative long occlusions, pans and plan/segment transitions; synthetic/unit cases cannot prove production accuracy.
- This gate protects identity persistence but does not replace the existing HOTA/IDF1/MOTA, false-CAY, bench/spectator or metric-trajectory gates.
