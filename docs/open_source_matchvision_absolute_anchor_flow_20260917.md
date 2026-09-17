# OSS audit — MatchVision absolute calibration anchors + guarded flow

Date: 2026-09-17

## Source and license boundary

- Project: `BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline`
- Source: https://github.com/BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline
- Audited default branch: `main` (2026-09-17)
- Repository root license: MIT (`LICENSE`, copyright 2026 BlazeWild).
- Important nested boundary: `external/pnlcalib/LICENSE` is GNU GPL v2. The repository-level MIT declaration does **not** make bundled PnLCalib code permissive.
- CAY-STABLE imports no MatchVision code, no PnLCalib code/checkpoint, no YOLO weights and no dependency from this audit.

## Useful measured upstream result

MatchVision documents a concrete drift case at frame 7699: cumulative optical-flow calibration reached 43.29 px pitch-line alignment error, while a fresh absolute PnLCalib estimate on the same frame reduced it to 9.07 px. Its production architecture therefore refreshes absolute calibration every 30 frames and uses guarded optical flow only between anchors.

This is a useful engineering result, not a transferable CAY accuracy claim. C.A. Yenne footage, camera geometry and calibration providers must be benchmarked independently.

## CAY adaptation

CAY already has the correct extension points: `camera_motion_artifact_provider_v1.js`, `camera_motion_background_evidence_guard_v1.js`, `metric_camera_motion_projector_v1.js`, `metric_segment_registry_v1.js` and validated homography contracts. Do not duplicate them.

Adapt the upstream principle as a provider-neutral policy:

1. Treat absolute validated calibration as the authority.
2. Permit camera-motion propagation only for a bounded interval inside the same camera segment/plan.
3. Require background/pitch evidence, support/inliers, forward-backward consistency and residual/plausibility guards for every propagated transform.
4. Force a new absolute anchor after a cut/plan change, stale anchor, failed evidence gate or excessive accumulated alignment/residual error.
5. Never bridge metric trajectories, heatmaps, distance, speed or events across an invalid interval. Those samples remain `INDISPONIBLE`.
6. Benchmark anchor cadence rather than hard-coding MatchVision's 30-frame value: compare candidate cadences on representative C.A. Yenne clips using metric coverage, reprojection/alignment residual p50/p95, rejected intervals, ID continuity and runtime.

## What this replaces / avoids

This avoids implementing a second calibration/optical-flow pipeline and avoids assuming that incremental camera motion can safely run indefinitely. It also prevents copying GPL-2.0 PnLCalib implementation into the permissive/browser-first CAY runtime.

Estimated engineering avoided: 0.5–1.0 day for anchor-refresh policy and drift-failure design, excluding the later provider benchmark itself.

## Expected measurable impact

- lower long-run calibration drift during pans/zooms;
- zero accepted metric sample across a cut or stale/failed anchor;
- explicit calibration coverage and rejection reasons;
- ability to choose the cheapest anchor cadence that stays inside CAY validation thresholds;
- no new mandatory Python/GPU dependency.

## Status

**Studied / architecture adapted / runtime import rejected.**

Reason for runtime rejection: the useful architecture can extend existing CAY contracts cleanly, while the bundled PnLCalib component has a GPL-2.0 license boundary that CAY must not silently absorb. A future external calibration provider may be evaluated only with its exact code, model/checkpoint and dependency provenance documented separately.
