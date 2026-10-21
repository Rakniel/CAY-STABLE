# Open-source audit — two_point_calib (2026-09-15)

## Source
- Project: `lood339/two_point_calib`
- Purpose: implementation of *A Two-point Method for PTZ Camera Calibration in Sports* (WACV 2018).
- Upstream: https://github.com/lood339/two_point_calib
- License observed upstream: BSD-2-Clause.
- Runtime dependencies reported upstream: OpenCV, Eigen, FLANN and matio. Each dependency remains subject to its own license/version review before any runtime adoption.

## CAY-STABLE relevance
The useful idea is a low-correspondence PTZ pose/calibration recovery path for sports cameras. It is complementary to CAY-STABLE's existing absolute calibration + guarded camera-motion architecture: after a camera cut or a large pan/tilt/zoom change, a compact PTZ-specific recovery candidate could be benchmarked as another absolute anchor rather than allowing optical-flow compensation to accumulate indefinitely.

## Decision
**Status: STUDIED / NOT INTEGRATED.**

No upstream source code, model, training artifact, or dataset is copied by this change. The BSD-2-Clause license is permissive enough for future source reuse provided its notice/conditions are preserved, but technical maturity and dependency cost must be benchmarked against the existing CAY calibration candidates first.

## What it could replace / avoid
- Could replace part of a bespoke PTZ recovery solver after hard camera motion or cuts.
- Estimated engineering avoided if a benchmark proves it suitable: roughly 1–3 days of geometry/prototyping, excluding integration and validation.

## Expected measurable impact
Candidate benchmark target for CAY-STABLE: reduce time-to-recover a defensible homography after strong pan/tilt/zoom while keeping reprojection error and publication confidence inside existing fail-closed thresholds. No performance claim is made until measured on CAY footage.

## Risks
- Upstream implementation is older and was originally tested with older OpenCV/toolchain versions.
- C++/MATLAB/Python mix is not a drop-in fit for the current browser-oriented STABLE runtime.
- FLANN/matio/Eigen/OpenCV dependency and redistribution details must be pinned and audited before adoption.
- A two-point/PTZ model is not a universal substitute for semantic pitch calibration; it should only become a candidate anchor where camera assumptions are satisfied.

## CAY adaptation rule
If adopted later, reuse only clearly BSD-2-Clause-covered source with preserved notices, pin the exact upstream commit/version, record every modified file, and keep CAY's existing evidence/publication guards authoritative. Never promote calibration merely because the solver returned a matrix.