# PnLCalib 2026 — calibration refinement audit

Date: 2026-09-15
Status: STUDIED / REJECTED FOR CODE INTEGRATION

## Provenance

- Project: `mguti97/PnLCalib`
- Upstream: https://github.com/mguti97/PnLCalib
- Paper: *PnLCalib: Sports Field Registration via Points and Lines Optimization*, Computer Vision and Image Understanding 267 (2026), 104712.
- Upstream update noted 2026-03-10: weighting parameter for PnL refinement and lens-distortion optimization.
- License observed at audit time: GNU GPL v2 (`LICENSE`).

## Useful technical pattern

PnLCalib refines an initial sports-camera calibration by jointly exploiting detected pitch keypoints and field lines, then optimizes camera parameters. The 2026 upstream revision also exposes lens-distortion optimization. This is directly relevant to CAY-STABLE recovery after difficult broadcast views, occlusions, zoom and non-standard camera poses.

## CAY-STABLE decision

Do **not** copy, vendor, translate or derive runtime code from PnLCalib under the current CAY-STABLE licensing policy. GPL-v2 obligations are not accepted for direct integration into the current product.

The research-level idea may still guide an independent implementation: after a CAY-owned initial homography/camera estimate, use line/keypoint reprojection residuals as a refinement objective, keep the pre/post residuals, and fail closed when the refined calibration cannot prove an improvement. Any future implementation must be written independently from the paper/algorithm description and CAY's existing geometry primitives, not by translating GPL source.

## What this could replace

A future CAY-owned refinement stage could replace ad-hoc homography acceptance after difficult pan/tilt/zoom transitions and reduce dependence on a single point-only estimate.

## Expected impact / work avoided

- Research/design avoided by using the published method as a reference: roughly 1–3 engineering days.
- Expected measurable impact if independently adapted: lower pitch-line reprojection error and fewer calibration dropouts after camera movement.
- Required benchmark: compare median/p95 reprojection error, accepted-calibration coverage, recovery latency after shot/plan changes, and downstream metric-availability rate before/after refinement.

## Risks / dependencies

- GPL-v2 prevents direct code reuse under current policy.
- Model weights and datasets have separate terms and must be audited independently.
- Non-linear refinement can converge to a visually plausible but wrong local optimum; CAY must retain explicit confidence/evidence gates and `INDISPONIBLE` semantics.
- Lens-distortion optimization adds parameters and can overfit when visible pitch evidence is sparse.

## Modification record

No upstream code, model, weight, dataset or configuration was copied. This document records provenance, license boundary, the independently reusable algorithmic idea, expected gain, and validation requirements only.
