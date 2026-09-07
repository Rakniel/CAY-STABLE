# OSS acceleration — pitch-keypoint artifact bridge — 2026-09-07

## Source studied
- Project: `rustyneuron01/Real-Time-Football-Detection` (Score Vision)
- Repository licence: MIT.
- Reused concept: inference produces structured per-frame pitch-keypoint artifacts behind a small validation boundary, instead of coupling model inference and geometry into one monolith.
- CAY adaptation: architecture/interface idea only. No upstream source code, model weights, datasets or configs copied.

## CAY-STABLE adaptation
`pitch_keypoint_artifact_provider_v1.js` implements the provider contract already consumed by `stable_runtime_tracking_v2.js` (`inferPitchKeypoints`, provenance, freshness and confidence). It does not add a second homography/calibration path.

The adapter:
- accepts only `CAY_PITCH_KEYPOINT_ARTIFACT_V1`;
- requires source, licence and revision/weightId/sha256 provenance;
- rejects AGPL/GPL provenance;
- accepts pixel or normalized 0..1 coordinates;
- isolates samples by camera/tracking segment;
- performs nearest-frame lookup only inside an explicit freshness window (default 0.4 s);
- never interpolates missing/stale keypoints;
- requires finite confidence and unique semantic indices 0..31;
- exposes keypoints to the existing semantic calibration / validated homography / metric pipeline.

## Existing CAY components reused
The runtime already has a fail-closed semantic provider verdict and calls `CAYPitchKeypointProvider.inferPitchKeypoints(...)`; accepted observations then flow into the existing semantic calibration and metric runtime. This new module is therefore an input adapter, not a duplicate solver.

## What this replaces / avoids
This avoids building model-specific calibration plumbing for every mobile/native/offline keypoint engine. Estimated avoided work: **~1–2 engineering days per future producer/backend**.

Expected impact: once an approved keypoint producer is connected, CAY can benchmark real metric coverage for trajectories/heatmaps/distance while browser-native model selection remains independent. Frames without fresh same-segment evidence remain `INDISPONIBLE`.

## Licence / dependency boundaries
- New runtime package: none.
- Copied upstream code: none.
- Copied external weights/models/data: none.
- External producer provenance remains mandatory for every artifact.
- Repository-level MIT licensing is not treated as proof of the licence of separately referenced model weights.

## Rejected references retained from the audit
- `vaila-multimodaltoolbox/vaila`: AGPL-3.0 — code reuse rejected.
- `kushaldabbe/footyvision`: no usable repository licence found during the audit — code reuse rejected.

## Status
Provider primitive added on current `main` lineage with non-regression coverage. Runtime HTML promotion is intentionally separate: the provider must be inserted through the existing canonical runtime manifest rather than introducing a second HTML integrator.