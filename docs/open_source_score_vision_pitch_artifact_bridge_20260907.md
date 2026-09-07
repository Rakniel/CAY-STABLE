# OSS acceleration — pitch-keypoint artifact bridge — 2026-09-07

## Goal

Unblock real CAY-STABLE metric tests before a browser-native pitch-keypoint weight is legally and technically promoted. The change does **not** add a second calibration engine. It adds one optional input adapter:

`validated mobile/offline/native keypoint artifact -> CAYPitchKeypointProvider -> existing pitch_semantic_calibration_v2 -> existing validated homography/segment registry -> trajectories / heatmaps / metrics`

## Source studied

### rustyneuron01/Real-Time-Football-Detection (Score Vision)

- Repository licence: MIT.
- Repository state observed 2026-09-07: public, created 2024-06-04; 73 stars / 24 forks at audit time.
- Relevant architecture: inference nodes emit structured per-frame detections and pitch keypoints; a lightweight validation layer checks keypoint stability, plausibility and reprojection rather than coupling inference and geometry into one monolith.
- CAY adaptation: architecture/interface idea only. No source code, model code, model weights, dataset or configuration copied.
- Weight boundary: the repository references YOLO/HRNet/OSNet/custom football weights. Repository MIT licensing is **not** treated as proof that each external/fine-tuned weight is MIT. CAY artifacts therefore carry exact source + licence + revision/weight hash and are rejected when provenance is absent or clearly GPL/AGPL.

### Rejected references during the same audit

- `vaila-multimodaltoolbox/vaila`: AGPL-3.0 repository -> code reuse rejected.
- `kushaldabbe/footyvision`: no repository licence found -> code reuse rejected.

## CAY implementation

New `pitch_keypoint_artifact_provider_v1.js`:

- accepts only `CAY_PITCH_KEYPOINT_ARTIFACT_V1` artifacts;
- requires source, licence and revision/weightId/sha256 provenance;
- rejects AGPL/GPL provenance before an artifact provider can be created;
- supports pixel coordinates or normalized 0..1 coordinates;
- isolates samples by tracking segment so one camera plan cannot calibrate another;
- uses nearest-frame lookup only inside an explicit maximum sample age (default 0.4 s);
- performs no interpolation across missing/stale samples;
- requires finite per-keypoint confidence and unique semantic landmark indexes 0..31;
- converts normalized coordinates to the exact runtime frame dimensions;
- exposes the already-existing provider contract (`inferPitchKeypoints`, provenance, freshness, confidence) rather than adding homography logic.

The optional integration helper loads the adapter before `stable_runtime_tracking_v2.js`. No backend, network call or model download is added. A mobile/native/offline producer can explicitly call `CAYPitchKeypointArtifactProvider.installAsDefault(artifact)` after loading a locally produced artifact.

## What this replaces / avoids

This replaces the need to build a second model-specific calibration path for each native/mobile inference engine. The existing semantic calibration, geometry validation, dynamic keyframes and fail-closed metric publication remain authoritative.

Estimated work avoided: **~1–2 days per external/mobile calibration backend**, plus reduced integration risk because all backends converge on one small artifact contract.

Expected measurable impact: once one approved native/mobile/offline keypoint producer exists, CAY can benchmark real metric coverage immediately while the browser model remains optional. Frames without a fresh same-segment sample remain `INDISPONIBLE`; no metric coverage is fabricated.

## Risks / dependencies

1. This adapter does not create keypoints by itself; it requires an upstream producer.
2. Exact upstream model/weight licence and revision remain mandatory for every artifact.
3. Imported keypoints still must pass the existing semantic-calibration support, geometry and reprojection guards before metrics become eligible.
4. Timestamp alignment between exported keypoints and the analysed video must be verified on real C.A. Yenne footage before club use.
