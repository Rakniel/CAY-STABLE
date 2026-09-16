# MatchVision AI guarded calibration audit — 2026-09-16

## Provenance
- Project: BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline
- Source: https://github.com/BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline
- Revision inspected: repository `main` at the audit date; exact upstream commit must be pinned before any code reuse.
- Top-level license: MIT (verified from upstream `LICENSE`).
- Important nested boundary: vendored `external/pnlcalib/` is GPL-2.0. Its code/checkpoints are **not approved for inclusion** in CAY-STABLE under the current permissive-runtime policy.
- No upstream source code, model weights, checkpoints, videos or datasets are copied by this audit.

## Useful engineering evidence
MatchVision uses an absolute semantic pitch calibration periodically and guarded optical flow between anchors. The upstream README documents a concrete drift example: at frame 7699, cumulative optical flow reached 43.29 px pitch-line alignment error while a fresh absolute calibration reduced that error to 9.07 px. The useful lesson for CAY is not the PnLCalib implementation itself, but the independently testable policy: incremental camera-motion propagation must be short-lived, quality-gated and periodically re-anchored by an absolute calibration.

## CAY-STABLE mapping
CAY already has the correct extension points: `camera_motion_artifact_provider_v1.js`, `metric_camera_motion_projector_v1.js`, `metric_segment_registry_v1.js` and calibration validation. Do not add a parallel calibration pipeline.

Adapt the benchmark principle only:
1. compare propagated transform against the next independently validated absolute anchor;
2. measure median/p95 pitch reprojection disagreement and elapsed time since anchor;
3. measure false distance accumulated by a stationary-player fixture during pan/zoom;
4. force `INDISPONIBLE` once age/error/evidence thresholds fail;
5. reset propagation across cuts, camera segments and calibration-anchor changes.

## What this replaces
No existing CAY runtime is replaced. This avoids designing a calibration-drift benchmark from scratch and gives the existing camera-motion contract a concrete external failure case to reproduce.

## Expected gain
Estimated 0.5–1 day of benchmark/design work avoided. Expected measurable impact is fewer metres/speed spikes caused by stale propagated transforms and an explicit maximum safe propagation horizon per C.A. Yenne camera style. No accuracy claim is made until representative CAY footage is benchmarked.

## Status
**Studied / benchmark principle adapted / runtime import rejected.**

## Risks and dependencies
- Top-level MIT does not override the nested GPL-2.0 PnLCalib license.
- Model/checkpoint/data rights require separate provenance checks.
- Upstream numeric results are source-specific and must not become CAY thresholds without local validation.
- Optical flow can look internally consistent while drifting geometrically; absolute-anchor disagreement remains mandatory evidence.
