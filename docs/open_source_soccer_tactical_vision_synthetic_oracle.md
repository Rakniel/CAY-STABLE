# soccer-tactical-vision synthetic oracle audit

## Provenance
- Project: `rafaelsouza-tech/soccer-tactical-vision`
- Source: https://github.com/rafaelsouza-tech/soccer-tactical-vision
- License: MIT (repository code).
- Audited: 2026-09-25.
- Upstream scope considered: deterministic synthetic clip generator with full ground truth, calibration metrics, pitch-metre projection and stage-separated artifacts.

## License boundary
This document adapts the testing architecture only. No upstream source, model weight, dataset image or generated media is copied into CAY-STABLE.

The upstream repository explicitly keeps optional PnLCalib evaluation support isolated and documents separate provenance for pitch-keypoint training data. Those dependencies and datasets are **not** covered merely because the repository code is MIT. CAY must audit every future model, weight and dataset separately before redistribution or mandatory runtime use.

## Why this is useful to CAY-STABLE
CAY already has production-oriented contracts for validated homography, per-segment calibration, camera-motion propagation, pitch trajectories, heatmaps and fail-closed physical metrics. Replacing those modules would duplicate working logic.

The useful missing layer is an independent deterministic oracle: synthetic sequences where camera transform and player pitch positions are known exactly. Such an oracle can detect regressions that unit tests with hand-written points can miss.

## CAY adaptation
A future CAY synthetic-oracle test fixture should generate its own clean-room deterministic observations and expected values rather than importing upstream implementation code.

Minimum fixture families:
1. static camera + straight player trajectory;
2. camera pan with fixed pitch trajectory;
3. zoom/warp that must invalidate translation-only propagation;
4. hard camera cut creating a new segment;
5. short missing-observation gap that may preserve a trajectory segment;
6. long gap that must split the trajectory;
7. one bad calibration correspondence among redundant landmarks;
8. out-of-pitch projection that must be rejected;
9. teleport/impossible-speed sample that must not inflate distance;
10. partial calibrated coverage that must report explicit coverage and become `INDISPONIBLE` below threshold.

## Acceptance measurements
For every fixture, record before/after values rather than a binary visual judgement:
- homography reprojection mean/max error;
- pitch-position error in metres;
- camera-motion residual and accepted/rejected state;
- valid metric coverage ratio and temporal coverage ratio;
- trajectory segment count;
- distance error versus ground truth;
- heatmap mass conservation and peak-cell error;
- number of impossible-motion samples rejected;
- number of cross-camera-cut samples incorrectly joined.

A calibration/GMC/trajectory change is not considered an improvement merely because it produces more metric samples. It must reduce the relevant ground-truth error without weakening CAY fail-closed rules.

## Runtime impact
None. The oracle belongs in tests/benchmark tooling and must not add Python, PyTorch, OpenCV or model dependencies to the browser-first STABLE runtime.

## What this replaces
It replaces ad-hoc manual construction of calibration/GMC regression examples and subjective visual comparison when evaluating metric-pipeline changes. It does **not** replace `metric_homography_projector_v1.js`, `metric_segment_registry_v1.js`, `metric_camera_motion_projector_v1.js`, `metric_pitch_heatmap_v1.js` or existing non-regression tests.

## Expected gain
Estimated engineering work avoided: 3–6 days versus designing an evaluation methodology from scratch. More importantly, future changes gain measurable error budgets before they can be promoted into STABLE.

## Status
**Studied / audit and acceptance protocol integrated. Runtime not integrated.**

Next promotion gate: implement a small dependency-free CAY-native deterministic fixture and execute it alongside the existing metric non-regression suite. Commit runtime changes only after before/after measurements pass.
