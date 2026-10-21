# Open-source audit — MatchVision AI calibration architecture

Audit date: 2026-09-17

## Source and license boundary

- Project: `BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline`
- Source: https://github.com/BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline
- Audited upstream revision: `9876ed6509cc3c6f8dc5241c53d6079d50ac60b9`
- Top-level project license: MIT, verified from the repository `LICENSE` file.
- Important nested boundary: vendored `external/pnlcalib` is GPL-2.0. That code is **not compatible with CAY-STABLE's current permissive-only direct-import policy** and must not be copied or incorporated into the runtime.
- Model weights, YOLO/Ultralytics components and datasets remain separate license/provenance surfaces and are not covered merely by the repository MIT license.

No MatchVision or PnLCalib source code, model weights, datasets, configuration, or assets are copied by this audit.

## Useful architecture discovered

MatchVision uses a useful two-timescale calibration pattern:

1. obtain an absolute pitch calibration on periodic keyframes;
2. use guarded optical flow only between those absolute anchors;
3. require forward/backward-consistent pitch features, RANSAC inliers, plausible pitch geometry and pitch-line alignment before accepting propagated motion;
4. let a fresh reliable absolute calibration override accumulated optical-flow propagation;
5. expose mapping coverage and calibration diagnostics alongside metrics.

This is highly aligned with CAY-STABLE's existing `metric_segment_registry_v1.js`, `camera_motion_artifact_provider_v1.js`, `metric_camera_motion_projector_v1.js`, `metric_homography_projector_v1.js` and fail-closed `INDISPONIBLE` policy.

## CAY adaptation — no duplicated pipeline

Do **not** create a MatchVision/PnLCalib runtime path. Extend the existing CAY artifact/provider contracts only.

The useful adaptation is the explicit **absolute-anchor refresh policy**:

- propagated camera motion is temporary evidence, never a permanent calibration;
- every propagated interval must remain attached to the same camera segment and calibration anchor;
- refresh/override with a newly validated absolute calibration whenever one becomes available;
- accumulated propagation must be invalidated on cut/plan change, stale evidence, insufficient static support, excessive residual, forward/backward failure, implausible pitch geometry or excessive pitch-line disagreement;
- metric trajectories, heatmaps, distance and speed receive zero samples while calibration is unavailable;
- coverage must distinguish absolute-calibrated time from safely propagated time rather than hiding uncertainty.

This strengthens the current multi-plan design without duplicating calibration or tracking logic.

## Benchmark / acceptance gates

Before any heavier native calibration backend becomes mandatory, compare the current CAY baseline against an absolute-anchor + short propagation experiment on representative C.A. Yenne footage.

Measure at minimum:

- valid metric coverage (% and seconds);
- absolute-anchor coverage vs propagated coverage;
- median/p95 reprojection or pitch-line residual;
- false metres accumulated for a known stationary field point/player interval;
- trajectory discontinuity at anchor refresh;
- invalid samples leaked across cuts/plan changes (target: 0);
- `INDISPONIBLE` correctness when evidence disappears (target: 100% fail-closed);
- processing time per video minute and calibration refresh cost.

An integration is accepted only if it increases defensible metric coverage or reduces calibration cost without worsening cut isolation, false movement, identity guards, bench/spectator exclusion or the CAY 11-player invariant.

## Expected acceleration

Estimated work avoided: **0.5–1.5 engineering days** of designing the anchor/propagation/refresh strategy and its observability from scratch.

Expected impact: faster path to stable trajectories/heatmaps and later distance/speed on moving-camera footage, with lower drift risk than unbounded optical-flow propagation.

## Status

**Studied / architecture adapted / runtime code rejected for direct reuse where it depends on vendored GPL-2.0 PnLCalib.**

The top-level MIT portions remain eligible for future file-by-file review, but nothing should be imported merely because the repository root is MIT. Each imported file and dependency must have a verified compatible provenance boundary first.
