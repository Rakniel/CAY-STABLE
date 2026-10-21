# Ayan-OP/Soccer-Analytics audit

- Source: https://github.com/Ayan-OP/Soccer-Analytics
- Audited revision: `3a1da67d523573fec5c109e37fc2bfd2d600eee7`
- License: MIT (copyright Ayan Basak, 2024)
- Audit date: 2026-09-16
- Status: studied / design and benchmark reference; no upstream source code, model weights, datasets, or configuration copied into CAY-STABLE.

## Useful pattern

The project combines player/ball tracking with explicit camera-movement estimation before speed/distance estimation. That sequencing is useful as an independent reference for CAY-STABLE's existing architecture: camera motion must be treated as evidence affecting geometry before physical movement is published, rather than being mistaken for player displacement.

## What this can replace or avoid

CAY-STABLE already has `camera_motion_artifact_provider_v1.js`, `metric_camera_motion_projector_v1.js`, calibrated pitch projection, and fail-closed physical-metric contracts. Therefore importing this project would duplicate existing logic. The useful acceleration is a benchmark/reference case for validating CAY's existing camera-motion -> pitch projection -> distance/speed ordering, not a new runtime dependency.

Estimated work avoided: roughly 0.5-1 day of exploratory pipeline design and sequencing review.

## Expected measurable impact

No accuracy gain is claimed from this audit alone. A future representative C.A. Yenne benchmark should compare camera-motion-aware versus uncompensated physical metrics using:

- stationary-player false distance during pans;
- distance error over manually checked pitch trajectories;
- speed spikes around pans/cuts;
- metric coverage retained after camera-motion evidence guards;
- `INDISPONIBLE` rate when geometry evidence is insufficient.

## License/dependency boundary

The repository code is MIT, but its runtime references Ultralytics/YOLO, OpenCV, Supervision and other packages/models. Their exact package versions, model weights and dataset licenses are separate obligations and are **not inherited from the repository's MIT license**. CAY-STABLE must audit those artifacts independently before any future import or bundled backend.

## Decision

Keep as a permissively licensed benchmark/design reference only. Do not import the implementation because CAY already has stronger fail-closed geometry, roster identity, bench/spectator exclusion and metric-coverage contracts. Reuse would only become justified if a measured C.A. Yenne benchmark demonstrates a concrete advantage over the existing CAY modules.