# ArtificialVision-on-SoccerNet audit

- Source: https://github.com/mariodan02/ArtificialVision-on-SoccerNet
- Upstream inspected: 2026-09-25
- License: **NO LICENSE FILE / NO REUSE GRANT FOUND IN THE INSPECTED REPOSITORY**.
- CAY-STABLE decision: **reference-only; reject source code, notebooks, configuration and model-weight reuse** until an explicit compatible license is published and separately verified.

## Why this is useful to CAY-STABLE

The project reports a SoccerNet-Tracking experiment in which BoT-SORT global-motion compensation was retained but ReID was disabled because visually similar teammates increased ID switches. The authors report HOTA@0.50 = 0.76 for their final pipeline. These are upstream results only and are not CAY-STABLE performance claims.

This is a useful negative result for CAY because amateur football has exactly the same hard case: teammates intentionally wear nearly identical kits. It reinforces the existing CAY policy that appearance/ReID is secondary evidence only and must never silently merge identities.

## CAY adaptation (clean-room policy only)

No upstream implementation is copied. CAY keeps its existing `reid_evidence_fusion_v1.js` contract and `NEVER_AUTO_MERGE` policy. Any future ReID extractor/backend must be benchmarked both **enabled and disabled** on the same C.A. Yenne detections/tracks. Acceptance requires a measurable improvement in identity continuity without increasing false merges, false CAY identities, bench/spectator contamination or cross-plan identity errors.

Minimum comparison gates:

1. same detections and camera segments for both variants;
2. HOTA / IDF1 / ID-switch count where ground truth is available;
3. explicit teammate-confusion and re-entry cases;
4. CAY yellow-detail false-positive set;
5. bench/spectator exclusion set;
6. no weakening of the 11-on-field invariant;
7. runtime/dependency cost recorded separately;
8. ReID remains suggestion/evidence only unless a later, separately validated policy explicitly changes that rule.

## Dependency / legal boundary

The repository README installs Ultralytics, Roboflow and Supervision and contains a fine-tuned YOLO checkpoint. Their licenses and the training-data/model terms are independent of the repository itself. Because the inspected repository does not provide an explicit reuse license, CAY-STABLE imports none of its code, configuration, notebooks or weights.

## Expected work avoided

This ablation result avoids prematurely building or making a heavy ReID backend mandatory before proving it helps on same-kit football footage. Estimated avoided prototype/tuning effort: 1–3 days. The measurable target is not a promised percentage: ReID must beat the no-ReID baseline on CAY identity metrics before becoming a default path.
