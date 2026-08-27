# Open-source reference — SportVision speed/distance analytics

## Source studied
- Project: `MohibShaikh/sportvision`
- Version/reference: `0.3.1`, commit `ba96e1a3b82a95777bb7068594a69f0b866c47c1` (2026-08-27)
- Relevant files: `src/sportvision/analytics/speed.py`, `src/sportvision/analytics/distance.py`, homography/analytics pipeline
- License: Apache-2.0

## What is reused
No SportVision source code is copied into CAY-STABLE. We adapt the mature architecture principle that speed and distance must be computed from field-space positions and elapsed time rather than raw image-pixel displacement.

CAY-STABLE keeps its stricter metric pipeline:
- only explicitly validated per-segment projectors may produce metres;
- no connection across camera/segment cuts;
- median-3 jitter guard before distance/speed aggregation;
- physical rejection above 45 km/h;
- metric quality remains coverage × calibration-confidence based;
- missing evidence remains `INDISPONIBLE` rather than guessed.

## CAY-specific modification added in this integration
The previous CAY sprint counter could increment from a single >=25 km/h sample. That is unsafe on real club footage because one short residual projection spike may look like a sprint even after smoothing.

A sprint episode now requires at least 1.0 continuous second at >=25 km/h inside the same valid metric run. Any segment cut, invalid/rejected pair, temporal gap, or below-threshold interval resets the candidate episode. The threshold and minimum duration are exported in the metric result so the UI/report can remain auditable.

## What this replaces
- Replaces the old one-sample sprint trigger in `metric_quality_guard_v1.js`.
- Avoids adding SportVision/Numpy/Python as a runtime dependency.

## Expected impact
- Fewer false sprint counts caused by isolated speed spikes.
- More defensible per-player sprint statistics before exposing them in STABLE.
- Estimated engineering work avoided by using the established field-coordinate/time architecture as reference: ~0.5–1 day.

## Tests
`tests/metric_quality_guard_nonregression.js` now verifies:
- normal walking/running does not create a sprint;
- a sustained 28.8 km/h run creates one episode;
- a sub-second high-speed spike creates zero sprint;
- two sustained runs separated by low speed create two episodes;
- camera/segment cuts do not bridge distance.

## Status
Integrated on feature branch pending CI/non-regression validation.