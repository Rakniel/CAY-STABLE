# Open-source pitch-keypoint licence boundary — 2026-09-04

## Sources audited

### roboflow/sports
- Role studied: semantic soccer-pitch keypoint topology and keypoint → homography workflow.
- Repository code licence: MIT.
- CAY use: architecture/topology reference only. No upstream source file is vendored and no pretrained weight is bundled.
- Important boundary: permissive licensing of repository code does **not** automatically make every referenced/downloadable trained weight permissive. The ready-made YOLO pitch-keypoint path discussed by current open-source audits can bring AGPL obligations through its model/runtime lineage. CAY therefore does not import that weight/runtime into STABLE without a separate explicit licence approval.
- Current CAY implementation: `pitch_semantic_calibration_v2.js`, clean-room 32-landmark mapping over the CAY 105×68 canonical geometry.

### rafaelsouza-tech/soccer-tactical-vision
- Role studied: stage separation `pitch keypoints → robust homography → validation → temporal smoothing → projection in metres` and strict rejection of geometrically starved frames.
- Licence: MIT.
- CAY use: architecture/validation ideas only; no upstream source copied.
- CAY implementation: `automatic_pitch_calibration_v1.js`, `metric_segment_registry_v1.js`, `pitch_semantic_calibration_v2.js`.

## Integration in this change

A validated result produced by `pitch_semantic_calibration_v2.js` can now be registered directly into the **same** segment-aware metric registry consumed by STABLE reports. The registry accepts an upstream projector only when all of these are true:

1. the segment id is explicit and valid;
2. `validated === true`;
3. a projection function exists;
4. calibration confidence is explicit, finite and within `[0,1]`.

Rejected/insufficient semantic evidence never creates a metric projector. Exact segment binding remains mandatory, and no image-space or grass-mask fallback is introduced.

## Provenance / modification record

- External code copied: none.
- External model/weight bundled: none.
- Runtime licence dependency added: none.
- CAY files changed: `metric_segment_registry_v1.js`, `stable_metric_visuals_runtime_v1.js`.
- CAY test added: `tests/stable_semantic_calibration_registry_nonregression.js`.
- Expected work avoided: roughly 0.5–1 day of duplicate calibration/registry plumbing and a later cleanup of a second metric state store.
- Expected impact: semantic calibration that is already geometrically validated can reach trajectories/heatmaps/distance/speed consumers through one fail-closed segment contract instead of being recomputed or silently discarded.

## Risks still open

- A legally compatible and sufficiently accurate **keypoint inference backend/weight** is still required for fully automatic real-video population of the 32 landmarks.
- Soccer broadcast close-ups/behind-goal plans can remain under-constrained; CAY must continue returning `INDISPONIBLE` rather than forcing a homography.
- Real C.A. Yenne video benchmarks remain mandatory before promoting any keypoint detector/model into STABLE.
