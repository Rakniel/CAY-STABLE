# Sadball temporal shot evidence — CAY-STABLE adaptation

## Upstream
- Project: `maarcoscuesta18/Sadball`
- Source inspected: `logic/shot_detector.py` and repository README
- License: MIT
- Upstream concept used: shot detection should rely on temporal, multi-signal evidence; no single frame should define a shot.
- Code copied: none.
- Models/weights copied: none.

## CAY-STABLE adaptation
`shot_temporal_evidence_v1.js` is an independent clean-room implementation designed for the existing CAY metric/ball pipeline. It does not import Sadball, YOLO, MediaPipe, PyTorch or ONNX models.

A shot candidate requires, within the same continuity segment/plan:
- sufficiently confident metric ball coordinates;
- explicit kick/contact evidence supplied by the existing CAY pipeline;
- ball speed above a conservative threshold;
- positive ball acceleration above threshold;
- repeated strong evidence on at least two frames inside a short temporal window.

The output is deliberately `SHOT_CANDIDATE`, `A_VERIFIER`, `publishable:false` with policy `NEVER_AUTO_PUBLISH`. This module therefore cannot silently create a confirmed shot statistic.

## Why this replaces future duplicated logic
CAY already owns ball continuity, metric projection and kick evidence. This module combines those existing signals instead of adding a second detector/tracker/event engine. It provides the temporal validation layer needed before future goal-direction/shot-target evidence is added.

## Tests
`tests/shot_temporal_evidence_nonregression.js` covers:
- valid repeated multi-signal candidate;
- rejection of a single strong frame;
- rejection of ball motion without kick evidence;
- rejection across plan/segment boundaries;
- rejection of low-confidence ball observations.

## License handling
MIT is compatible with the intended use. No upstream source, model, dataset, weights or dependency is vendored. Provenance is documented because the behavioral design was inspired by Sadball's multi-frame/multi-signal architecture.

## Expected impact
- prevents premature single-frame shot counting;
- prepares the ball/passes/possession/tirs phase without weakening `INDISPONIBLE` rules;
- no new runtime dependency;
- expected development avoided: roughly 0.25–0.5 day of temporal-event plumbing.
