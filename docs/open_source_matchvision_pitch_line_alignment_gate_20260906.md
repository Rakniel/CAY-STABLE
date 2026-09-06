# MatchVision pitch-line alignment gate audit — 2026-09-06

## Provenance
- Project: MatchVision AI — Sports Video Analytics & Tracking Pipeline
- Source: https://github.com/BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline
- Upstream revision inspected: `9876ed6509cc3c6f8dc5241c53d6079d50ac60b9`
- Revision date: 2026-06-18
- Project license: MIT
- Important license boundary: MatchVision documents vendored PnLCalib separately under its own upstream license. No PnLCalib source, weights or model artifacts are copied or proposed for CAY-STABLE by this integration.

## Useful upstream pattern
MatchVision does not accept short-horizon optical-flow calibration propagation solely because feature tracks and RANSAC are numerically plausible. Its documented production pipeline also checks pitch-line alignment error and rejects propagated calibration that no longer aligns with visible field markings. The upstream report gives a concrete drift example: at frame 7699, cumulative optical flow had a 43.29 px pitch-line alignment error, while a fresh absolute PnLCalib anchor reduced it to 9.07 px. Its current 3,000-frame cache reports 7.43 px median line error, 13.08 px p95 and 7/3000 frames above an 18 px threshold.

## Comparison with CAY-STABLE
`metric_camera_motion_projector_v1.js` already validates:
- forward/backward flow consistency when supplied;
- motion confidence, feature support, inlier ratio and residual;
- orientation, scale, anisotropy, shear and perspective plausibility;
- normalized frame-centre displacement;
- propagation freshness and calibration confidence.

The missing dimension was explicit **image-space pitch-line alignment evidence** produced by the calibration/motion provider and consumed by the same propagation gate. Geometric plausibility alone cannot prove that a mathematically reasonable transform still overlays the actual painted pitch lines after drift.

## CAY adaptation integrated
No MatchVision implementation code is copied. The existing CAY motion contract is extended directly:
1. provider may expose `pitchLineAlignmentErrorPx`, `lineAlignmentErrorPx`, or `pitch_line_alignment_error_px`;
2. `metric_camera_motion_projector_v1.validateMotion()` records the supplied error in validation diagnostics;
3. when `maxPitchLineAlignmentErrorPx` is explicitly configured, propagation is rejected with `MOTION_PITCH_LINE_ALIGNMENT_ERROR_TOO_HIGH` above that threshold;
4. `requirePitchLineAlignmentEvidence: true` rejects providers that omit the evidence;
5. accepted projector metadata publishes both observed error and configured threshold;
6. absolute/manual validated calibration remains authoritative after cuts, pans or drift.

No fixed CAY production threshold is adopted. MatchVision's 18 px diagnostic is evidence from its own camera/model/resolution and is **not** transplanted blindly. Without a configured CAY threshold, line alignment evidence remains diagnostic only and cannot silently reject coverage.

## What this replaces / improves
This does not replace homography, semantic calibration, RANSAC or the existing MatchVision forward/backward guard. It closes one missing validation dimension inside the authoritative `metric_camera_motion_projector_v1.js` path: **does the propagated transform still align with observed field geometry?**

Expected downstream protection: fewer drifted metric projections entering player trajectories, heatmaps, distance, speed and sprint calculations once the real provider emits this evidence and a representative C.A. Yenne threshold is calibrated. When evidence is required and missing/poor, the correct CAY result remains coverage loss / `INDISPONIBLE`, not an invented metric.

## Estimated development gain
Using MatchVision's proven validation pattern avoids roughly **0.25–0.5 day** of designing a drift-observability contract from scratch. The integration reuses the existing projector, diagnostics and non-regression path, adding no parallel calibration stack and no new runtime dependency.

## Measurable synthetic/non-regression effect
The camera-motion regression suite now proves:
- supplied line error is preserved as diagnostic evidence even with no threshold;
- aliases are normalized consistently;
- low error passes when below a configured threshold;
- high error is rejected when above that threshold;
- strict evidence mode rejects a provider that omits the measurement;
- legacy providers remain backward compatible by default.

These are deterministic contract tests only; they are not a claim of C.A. Yenne video accuracy.

## Status
**INTEGRATED AS OPT-IN EVIDENCE CONTRACT / PRODUCTION THRESHOLD NOT YET ENABLED.**

Production promotion gate:
- syntax + STABLE + calibration-v2 non-regressions green;
- real calibration/motion provider emits reliable pitch-line alignment evidence;
- representative C.A. Yenne footage establishes a resolution-aware threshold and shows reduced projection drift;
- no decrease in valid metric coverage unless accompanied by a measurable reduction in bad projections;
- all rejected intervals remain explicitly represented in coverage/availability reporting.

## Risks / dependencies
- Requires a provider capable of measuring line-alignment error from observed pitch markings; the projector never invents that evidence itself.
- A fixed pixel threshold is resolution/camera dependent and can over-reject valid motion.
- Poor line visibility, shadows, worn markings or occlusion can make line evidence unreliable.
- Strict mode and a production threshold must remain disabled until the evidence source is benchmarked on club footage.

## Modification/copying record
- Upstream code copied: **none**.
- Upstream weights/models copied: **none**.
- PnLCalib copied/imported: **none**.
- New runtime dependency: **none**.
- CAY runtime modified: `metric_camera_motion_projector_v1.js` only, extending its evidence contract and diagnostics.
- Tests modified: `tests/metric_camera_motion_projector_nonregression.js`.
- Adapted artifact: validation concept only, independently implemented in the existing CAY browser/Node path.
