# RUN35 — metric coverage gate and open-source review (2026-10-17)

## Scope and validation
- Base: `4746aa5144ee52111c018c2a1dad8f5deda825f8`; feature branch `cay/run34-metric-coverage-eligibility-20261017`.
- Updated only existing `observed_presence_report_v1.js` logic: reuse `CAYPlayerStats.metricProjectorInfo` instead of weaker `projectorInfo`, and publish metric coverage only when `metricEligible===true`.
- Eligibility requires a validated projection function and explicit confidence >= 0.50. Unknown, blank, invalid, or lower confidence must remain INDISPONIBLE for metric coverage.
- New test: `tests/observed_presence_metric_projection_confidence_nonregression.js`; includes threshold boundaries, missing confidence, duplicate frame, team report, and 100 valid frames.
- Tests against actual GitHub module sources in isolated JavaScript: PASS. Synthetic 6-frame baseline metric coverage 0.8333, corrected 0.3333. RUN34 offline archive `validate.sh`: 3 passes, 6000 valid-frame parity comparisons per pass.
- Full CI and real CAY video benchmark remain pending; do not claim a complete STABLE release.

## Open source — Norfair
- Project: https://github.com/tryolabs/norfair
- Version studied: 2.3.0 (PyPI release 2025-04-30).
- License: BSD-3-Clause; retain copyright and conditions if code is later reused. Dependencies and weights must be audited separately.
- Useful functions: detector-agnostic MOT, optional appearance ReID, `MotionEstimator` using optical flow and homography with background masks.
- Intended use: offline reference benchmark for CAY tracking and camera compensation; existing `camera_motion_artifact_provider_v1.js` and `camera_motion_background_evidence_guard_v1.js` remain canonical. No second browser tracking engine.
- What this can avoid: writing a separate offline MOT+GMC baseline; estimated 1–3 developer days (not measured).
- Expected evaluation: compare ID switches, track fragmentation, transform inlier/support and camera drift on annotated club clips; no measured improvement yet.
- Status: STUDIED, NOT INTEGRATED. No third-party source, weights or dependency copied.
- Risks: Python/OpenCV footprint, background point selection, model license, video privacy and drift.
