# OSS audit — Reco Video Stitcher (2026-09-17)

## Source
- Project: reco-project/video-stitcher
- URL: https://github.com/reco-project/video-stitcher
- Audited branch: `main` on 2026-09-17.
- License: **AGPL-3.0-only**, explicitly declared by upstream.
- Upstream also maintains `THIRD_PARTY_NOTICES.md` and uses `cargo deny check` for supply-chain/license gates.

## Useful engineering ideas
Reco separates its sports video stack into reusable calibration, detection, I/O, core and auto-camera modules. Its calibration path uses AKAZE feature matching, while its tracking path supports ROI filtering and smoothed motion. The useful CAY-STABLE lesson is architectural rather than source-code reuse: keep camera/background evidence isolated from player/ball evidence, and make calibration/motion outputs explicit artifacts consumed downstream.

For CAY-STABLE this reinforces the existing `camera_motion_artifact_provider_v1.js`, `camera_motion_background_evidence_guard_v1.js`, calibration contracts and multi-plan publication gates. It should not create a parallel motion/calibration pipeline.

## License decision
**No Reco source code is imported or copied.** AGPL-3.0-only is treated as incompatible with the current conservative reuse policy unless the project explicitly accepts the resulting obligations. Only independently implemented architectural ideas are considered.

## Adaptation target
Extend existing CAY contracts, when justified by benchmark data, so camera-motion evidence records:
- background-only feature support;
- confidence/inlier support;
- validity interval and plan/shot identity;
- explicit invalidation on cuts or weak support;
- no propagation into metric publication when calibration is unavailable.

This is especially relevant to the requirement that trajectories, heatmaps, distance and speed never bridge camera cuts or rejected calibration intervals.

## Expected gain
Estimated design/debug work avoided: **0.5–1 day** by reusing the proven separation-of-concerns idea rather than inventing another camera-motion architecture.

Expected measurable impact after implementation/benchmarking:
- fewer player-motion features contaminating camera-motion estimation;
- lower false metric displacement on pans/zooms;
- zero metric samples crossing a detected plan change;
- clearer coverage accounting because rejected motion/calibration intervals remain unavailable.

## Status
**Studied / idea adapted / code rejected due to AGPL-3.0-only boundary.**

No dependency, model, weight, configuration or runtime code is added by this audit.