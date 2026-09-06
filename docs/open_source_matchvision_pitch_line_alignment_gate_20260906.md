# MatchVision pitch-line alignment gate audit — 2026-09-06

## Provenance
- Project: MatchVision AI — Sports Video Analytics & Tracking Pipeline
- Source: https://github.com/BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline
- Upstream revision inspected: `9876ed6509cc3c6f8dc5241c53d6079d50ac60b9`
- Revision date: 2026-06-18
- Project license: MIT
- Important license boundary: MatchVision documents vendored PnLCalib separately under its own upstream license. No PnLCalib source, weights or model artifacts are copied or proposed for CAY-STABLE by this audit.

## Useful upstream pattern
MatchVision does not accept short-horizon optical-flow calibration propagation solely because feature tracks and RANSAC are numerically plausible. Its documented production pipeline also checks pitch-line alignment error and rejects propagated calibration that no longer aligns with visible field markings. The upstream report gives a concrete drift example: at frame 7699, cumulative optical flow had a 43.29 px pitch-line alignment error, while a fresh absolute PnLCalib anchor reduced it to 9.07 px. Its current 3,000-frame cache reports 7.43 px median line error, 13.08 px p95 and 7/3000 frames above an 18 px threshold.

## Comparison with CAY-STABLE
`metric_camera_motion_projector_v1.js` already validates:
- forward/backward flow consistency when supplied;
- motion confidence, feature support, inlier ratio and residual;
- orientation, scale, anisotropy, shear and perspective plausibility;
- normalized frame-centre displacement;
- propagation freshness and calibration confidence.

What is still missing is an explicit **image-space pitch-line alignment evidence field** produced by the calibration/motion provider and consumed by the propagation gate. Geometric plausibility alone cannot prove that a mathematically reasonable transform still overlays the actual painted pitch lines after drift.

## Proposed CAY adaptation
Do not copy MatchVision implementation code. Extend the existing CAY motion contract instead of creating another calibration module:
1. provider may expose `pitchLineAlignmentErrorPx` plus documented aliases;
2. `metric_camera_motion_projector_v1.validateMotion()` may reject the transform when the supplied error exceeds a configurable threshold;
3. a strict mode may require this evidence before metric propagation is publishable;
4. diagnostic value and threshold should be retained in returned validation/provenance so coverage loss is explicit rather than silent;
5. absolute/manual validated calibration remains authoritative and must override propagated motion after cuts, pans or drift.

No fixed CAY production threshold is adopted by this audit. MatchVision's 18 px diagnostic is evidence from its own camera/model/resolution and must not be transplanted blindly. CAY needs a threshold benchmarked against representative club footage and frame resolution.

## What this would replace / improve
This does not replace homography, semantic calibration, RANSAC or the existing MatchVision forward/backward guard. It closes one missing validation dimension inside the existing `metric_camera_motion_projector_v1.js` path: **does the propagated transform still align with observed field geometry?**

Expected downstream protection: fewer drifted metric projections entering player trajectories, heatmaps, distance, speed and sprint calculations. When evidence is missing or poor, the correct CAY result remains coverage loss / `INDISPONIBLE`, not an invented metric.

## Estimated development gain
Using MatchVision's proven validation pattern avoids roughly 0.25–0.5 day of designing a drift-observability contract from scratch. Most of the CAY infrastructure already exists; only provider evidence plumbing, gate tests and a representative threshold benchmark remain.

## Status
**STUDIED / CANDIDATE — NOT RUNTIME INTEGRATED.**

Promotion gate:
- reuse `metric_camera_motion_projector_v1.js`; no parallel calibration stack;
- syntax + STABLE + calibration-v2 non-regressions green;
- synthetic tests prove supplied high line error is rejected and low error is retained;
- representative C.A. Yenne footage establishes a resolution-aware threshold and shows reduced projection drift;
- no decrease in valid metric coverage unless accompanied by a measurable reduction in bad projections;
- all rejected intervals remain explicitly represented in coverage/availability reporting.

## Risks / dependencies
- Requires a provider capable of measuring line-alignment error from observed pitch markings; the current projector cannot invent that evidence itself.
- A fixed pixel threshold is resolution/camera dependent and can over-reject valid motion.
- Poor line visibility, shadows, worn markings or occlusion can make line evidence unreliable.
- Adding a gate without reliable provider evidence would create false confidence; strict mode must remain disabled until the evidence source is benchmarked.

## Modification/copying record
- Upstream code copied: **none**.
- Upstream weights/models copied: **none**.
- New runtime dependency: **none**.
- CAY runtime modified by this audit: **none**.
- Adapted artifact: validation concept and promotion criteria only.
