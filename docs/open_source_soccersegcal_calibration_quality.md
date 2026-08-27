# Spiideo soccersegcal — calibration quality/completeness adaptation

## Provenance
- Project: `Spiideo/soccersegcal`
- Source: https://github.com/Spiideo/soccersegcal
- Upstream revision inspected: `378a4729a92fb513c1f7365299ec8515e934cc1b` (2023-08-03)
- License: MIT, copyright Spiideo AB (2023).
- Upstream role: SoccerNet 2023 camera-calibration challenge contribution using pitch segmentation plus camera estimation.

## Reused idea
The project/SoccerNet evaluation reports calibration accuracy together with completeness and a combined metric instead of treating coverage alone as quality. CAY-STABLE adapts that general evaluation principle to its already-existing validated-projector contract: a physical metric should not become `FIABLE` merely because it covers a large fraction of a player's observations if the underlying camera calibration confidence is only marginal.

No upstream source code, model weights, SoccerNet footage, annotations, PyTorch3D code or training artifacts are copied into CAY-STABLE.

## CAY-STABLE changes
- `metric_quality_guard_v1.js`
  - keeps the existing median-3 jitter filter;
  - adds time-weighted mean calibration confidence;
  - adds `defendableScore = metricCoverage × avgCalibrationConfidence`;
  - derives distance/speed/sprint quality from that combined evidence score;
  - propagates calibration confidence into speed samples;
  - downgrades team instantaneous metric quality when a validated calibration is marginal.
- `metric_pitch_heatmap_v1.js`
  - records mean calibration confidence and the same combined defendable score;
  - refuses a pitch heatmap below the configured minimum calibration confidence (default `0.5`);
  - preserves the existing no-image-coordinate-fallback policy.
- `tests/calibration_confidence_quality_nonregression.js`
  - proves that 100% metric coverage with 50% calibration confidence is `PARTIEL`, not `FIABLE`;
  - proves that a 30% calibration-confidence heatmap is `INDISPONIBLE`;
  - preserves strong-calibration behavior.

## What this replaces
Previously, CAY-STABLE quality labels were driven primarily by coverage once a projector was marked `validated`. A projector at the low end of the accepted confidence range could therefore make a 100%-covered distance/heatmap appear as `FIABLE`. The new policy keeps coverage explicit but separates it from evidential strength.

## Expected impact
- Fewer over-confident distance, speed, sprint and heatmap labels.
- Better alignment with the requirement that doubtful statistics remain partial/unavailable rather than being presented as certain.
- Zero new runtime dependency and no change to the 11-player, identity, bench/spectator or multi-plan guards.

## Risk / dependency
The combined score is a CAY policy, not SoccerNet's official metric formula. Thresholds (`0.8` for `FIABLE`, `0.5` minimum heatmap calibration confidence) must be validated on representative C.A. Yenne footage before being relaxed. The adaptation adds no Python, PyTorch, GPU or network dependency.
