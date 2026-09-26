# Open-source audit — MatchVision AI anchor/flow strategy

Date: 2026-09-26

## Source

- Project: BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline
- Upstream revision audited: `9876ed6509cc3c6f8dc5241c53d6079d50ac60b9`
- Project license: MIT (verified in upstream LICENSE and repository metadata)
- Upstream explicitly states that vendored PnLCalib remains under its own upstream license. CAY-STABLE does **not** import PnLCalib code, checkpoints, YOLO weights, datasets, videos, or generated assets from this project.

## Useful engineering pattern

MatchVision separates expensive absolute pitch calibration anchors from cheap inter-anchor camera-motion propagation. Its documented production strategy runs semantic absolute calibration periodically, then uses guarded optical flow only between anchors. Flow is accepted only with sufficient forward/backward-consistent pitch features, RANSAC support, plausible pitch geometry, bounded line-alignment error, and bounded frame-to-frame projection change. A fresh reliable absolute anchor overrides accumulated flow after drift, pans, zooms or cuts.

The useful contribution to CAY-STABLE is the **validation/benchmark pattern**, not copied runtime code:

1. keep absolute calibration as the authority;
2. permit camera-motion propagation only inside a validated plan/segment;
3. measure line-alignment residuals and mapping coverage separately;
4. periodically refresh absolute evidence rather than trusting cumulative motion indefinitely;
5. reset/reject propagation across cuts or unsupported plan transitions;
6. reject metric publication when calibration/coverage evidence is insufficient.

Upstream documents a concrete drift example where cumulative flow reached 43.29 px line-alignment error and a fresh absolute estimate reduced the same frame to 9.07 px. These are upstream results only and are not claimed as CAY performance.

## CAY-STABLE mapping

CAY-STABLE already contains independent calibration and camera-motion components, including `automatic_pitch_calibration_v1.js`, `camera_motion_artifact_provider_v1.js`, `camera_motion_background_evidence_guard_v1.js`, calibration benchmarks and multi-plan guards. Therefore no parallel pipeline should be introduced.

This audit strengthens the existing architecture contract: camera-motion compensation is a bounded bridge between trusted calibration evidence, never a substitute for it. Future CAY benchmarks should record at minimum absolute-anchor age, propagation age, mapping coverage, calibration residual/error proxy, reset reason and whether each metric sample came from trusted absolute or propagated geometry.

## License boundary

Accepted: high-level architecture and evaluation ideas.

Not imported: source code, PnLCalib implementation, model weights/checkpoints, YOLO/Ultralytics artifacts, training data, videos, annotations, screenshots or generated caches.

Any future direct reuse requires a per-component audit. The root MIT license does not relicense vendored PnLCalib, Ultralytics, model weights, datasets or other third-party artifacts.

## Expected gain

Estimated work avoided: 1–3 engineering days of rediscovering cumulative-flow drift controls and diagnostic fields.

Expected impact: fewer false metric samples caused by stale propagated homographies, clearer coverage/calibration diagnostics, and a more defensible path to distance/speed/sprint metrics on moving-camera footage.

Status: **studied / methodology accepted / runtime not imported**.
