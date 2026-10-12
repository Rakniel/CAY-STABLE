# OSS audit — JSFeat for browser homography (2026-10-11)

- Upstream: https://github.com/inspirit/jsfeat
- Version: 0.0.8 (`package.json`); inspected commit `4c7b336bbeeb26e6cd4cdf3c7d414abe273846f3` (master, 2018-03-03).
- License: MIT; copyright Eugene Zatepyakin (2012), upstream `LICENSE`.
- Functions relevant to CAY: Homography2D motion kernel, RANSAC/LMEDS estimators, ORB descriptors and Lucas–Kanade optical flow.
- Comparison: OpenCV 4.5+ (Apache-2.0) is more actively maintained but heavier in WebAssembly; Kornia (Apache-2.0) targets PyTorch/Python. JSFeat is browser-oriented and lightweight, but the upstream repository has not been updated since 2018.
- Existing CAY modules to extend instead of duplicating: `automatic_pitch_calibration_v1.js`, `camera_motion_artifact_provider_v1.js`, `metric_camera_motion_projector_v1.js` and existing homography tests.
- Potential replacement: bespoke browser-side feature matching / robust homography estimation, **only if** a controlled benchmark shows improved camera-motion support over the existing calibration logic.
- Potential development time avoided: ~1–2 days of experimental RANSAC/ORB prototyping; estimate only, not realized.
- Measurable acceptance: held-out pitch-point reprojection error (metres/pixels), false-valid homography rate, per-frame processing latency, multi-plan transition reliability, and strict INDISPONIBLE on insufficient evidence.
- Status: **STUDIED; NOT INTEGRATED**. No JSFeat source copied, no package installed, no runtime dependency, no model weights imported.
- Risks: maintenance staleness, older JS conventions, insufficient robustness on blurry amateur footage, need for attribution/license preservation if imported later. Import must be separately approved after dependency and performance review.

This audit is documentation only. The concurrent coverage fix reuses CAY's existing strict `duration()` validator; no external source was used in the runtime patch.
