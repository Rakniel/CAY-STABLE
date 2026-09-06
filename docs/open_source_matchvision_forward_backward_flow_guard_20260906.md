# Open-source audit — MatchVision forward/backward optical-flow guard

Date inspected: 2026-09-06

## Source and license
- Project: `BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline`
- Upstream commit inspected: `9876ed6509cc3c6f8dc5241c53d6079d50ac60b9`
- Inspected file: `src/calibration/optical_flow_tracker.py`
- Project license: MIT.
- Important boundary: MatchVision vendors PnLCalib separately and states that PnLCalib remains under its own upstream license. CAY-STABLE does not copy, import or depend on PnLCalib code or weights.

## Useful mature pattern found
MatchVision does not trust one-way optical flow alone. It tracks features from the previous frame to the current frame, tracks those candidates back to the previous frame, measures the round-trip pixel error, rejects inconsistent points, then estimates camera motion with RANSAC. The inspected implementation configures a 1.5 px forward/backward threshold and reports median forward/backward error as a diagnostic.

This is a useful safety signal for CAY-STABLE because a camera-motion estimate can otherwise have apparently good confidence/support/inlier statistics while individual optical-flow correspondences are not temporally reversible.

## CAY-STABLE adaptation
Local file extended: `metric_camera_motion_projector_v1.js`.

No MatchVision Python/OpenCV source code was copied. CAY-STABLE keeps its existing browser/Node-compatible camera-motion projector and only adapts the evidence contract:
- accepts provider diagnostics through `forwardBackwardErrorPx`, `fbErrorMedianPx`, or `fb_error_median_px`;
- default maximum accepted median round-trip error: 1.5 px, configurable with `maxForwardBackwardErrorPx`;
- if evidence is present and exceeds the threshold, propagation is rejected with `MOTION_FORWARD_BACKWARD_ERROR_TOO_HIGH`;
- callers can require the diagnostic explicitly with `requireForwardBackwardConsistency: true`, in which case missing evidence is rejected with `MOTION_FORWARD_BACKWARD_EVIDENCE_MISSING`;
- existing GMC providers remain backward compatible by default while the runtime producer contract is upgraded progressively;
- accepted forward/backward error is exposed in propagated validation metadata for auditability.

The 1.5 px value is a starting reference from the audited upstream configuration, not a universal football-video truth. It remains configurable because resolution, feature scale and optical-flow implementation can change the appropriate threshold.

## What this replaces / work avoided
This extends the authoritative `metric_camera_motion_projector_v1.js`; no parallel camera-motion module is introduced.

It replaces blind acceptance of otherwise strong GMC evidence when a provider already knows that its optical-flow round trip is inconsistent. Estimated design/plumbing work avoided by reusing the mature upstream validation pattern: **0.25–0.5 day**.

## Expected measurable impact
Deterministic synthetic/non-regression impact:
- a motion estimate with median forward/backward error above 1.5 px is now rejected before it can propagate pitch coordinates;
- a consistent estimate remains accepted;
- strict mode rejects providers that omit the evidence;
- legacy providers remain unchanged unless strict mode is enabled.

Expected real-video effect: fewer bad short-horizon calibration propagations during blur, occlusion, pans and feature mismatches, reducing contamination risk for trajectories, heatmaps, distance and speed. No accuracy percentage is claimed until representative C.A. Yenne footage is benchmarked before/after.

## Dependencies and risks
- Zero new runtime dependency.
- No Python/OpenCV/PyTorch requirement added.
- No MatchVision or PnLCalib code/weights copied.
- Risk: a fixed pixel threshold is resolution/provider dependent; therefore it is configurable.
- Risk: enabling strict mode before the GMC producer emits the diagnostic would reduce metric coverage to `INDISPONIBLE`; strict mode is intentionally opt-in for now.
- Promotion path: once the production camera-motion provider emits validated forward/backward evidence on representative C.A. Yenne clips, benchmark rejection quality and metric coverage before making strict mode the STABLE default.
