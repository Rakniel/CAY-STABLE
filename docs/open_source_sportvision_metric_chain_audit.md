# SportVision metric-chain open-source assessment

## Upstream
- Project: `MohibShaikh/sportvision`
- Version inspected: `0.3.1`
- Commit inspected: `ba96e1a3b82a95777bb7068594a69f0b866c47c1` (2026-08-27)
- Repository/package license: Apache-2.0
- Relevant public architecture: detector -> ByteTrack -> homography -> field coordinates -> possession/speed/distance/heatmaps.
- Code copied into CAY-STABLE: **none**.
- Runtime dependency added: **none**.

## Why it is useful to CAY-STABLE
CAY-STABLE already contains stronger defensive contracts for homography validation, multi-plan segmentation, metric publication, heatmaps, distance/speed and INDISPONIBLE handling. The useful upstream lesson is therefore not to import another Python stack, but to validate the already-existing CAY modules as one continuous football analytics chain.

This avoids parallel implementations and makes the immediate STABLE target measurable: a calibrated track must become a field trajectory + heatmap + distance/speed result, while an uncalibrated camera plan must fail closed.

## Clean-room adaptation integrated
`tests/synthetic_metric_chain_nonregression.js` adds a deterministic end-to-end metric regression using only existing CAY modules:
- two explicit camera plans with separate homographies;
- seven manual calibration correspondences per plan;
- one deliberately bad calibration click per plan;
- robust consensus required to reject the outlier;
- independent reprojection validation;
- trajectory projection in pitch metres;
- heatmap generation with explicit metric coverage;
- multi-plan trajectory split;
- distance + average speed calculation without bridging the camera cut;
- explicit `INDISPONIBLE` when the second plan has no validated calibration.

## What this replaces / work avoided
Without this chain test, homography, heatmap and physical metrics could each remain green while their contracts drifted apart. Recreating an isolated metric integration harness later would take roughly **0.5–1 engineering day**.

Expected concrete impact:
- catches coordinate-contract regressions before real-video testing;
- protects the rule that camera cuts do not create artificial distance/speed;
- verifies robust manual calibration survives one bad click;
- protects the `INDISPONIBLE` policy for missing-plan calibration;
- provides deterministic before/after measurements for future TVCalib/SoccerNet/calibration integrations.

## Licensing / risk assessment
Apache-2.0 is compatible with the current CAY-STABLE policy for studying or reusing appropriately attributed source, but this integration copies no SportVision implementation. Its transitive runtime stack (Roboflow/Supervision/model weights) is not imported by this change and would require its own provenance audit if ever proposed.

The synthetic benchmark is not evidence of real C.A. Yenne accuracy. Promotion of calibration/detection/tracking changes still requires licensed/owned real-footage validation and the existing coverage/identity/publication gates.

## Status
**INTEGRATED AS CLEAN-ROOM TEST STRATEGY / NO UPSTREAM RUNTIME DEPENDENCY.**
