# RUN90 — Camera motion evidence gate (2026-10-19)

## Scope
Extends existing `camera_motion_artifact_provider_v1.js` on the STABLE PR branch; no new engine.

## Before / after
16 malformed quality-evidence variants were accepted by the original validator. The revised validator rejects all 16, including booleans, arrays, empty strings, nonfinite values, negative support/error and confidence/inlier ratios outside [0,1]. It also rejects duplicate (segment, anchorTime, time) transforms that could compete for the same frame.

## Regression evidence
Three independent passes over the 16 invalid inputs, distinct transforms and legitimate boundary values: 69 checks passed using the actual provider and dependencies. The existing provider and calibration tests remain required by CI. Real-video accuracy is not established by this gate.

## Provenance / license
This is original CAY code adapting an existing CAY module. No upstream source, weights, models or datasets imported. Existing permitted dependency contracts are unchanged. Roboflow Trackers 2.6.1 (Apache-2.0) remains benchmark-only; optional detector/model licensing is separate.

## Follow-up
Validate the change in GitHub CI and on real C.A. Yenne video. Never publish physical metrics from malformed or ambiguous camera-motion evidence.
