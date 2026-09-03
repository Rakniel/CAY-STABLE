# mplsoccer metric heatmap runtime adaptation

## Provenance
- Upstream project: `andrewRowlinson/mplsoccer`
- Source: https://github.com/andrewRowlinson/mplsoccer
- License: MIT
- Upstream revision inspected for this integration: `ad40c4ccbade56263ccd1d038ad49044fa9928d8` (2026-07-31)
- CAY-STABLE files involved: `metric_pitch_heatmap_v1.js`, `player_stats_v1.js`, `tests/metric_pitch_heatmap_nonregression.js`, `tests/metric_pitch_heatmap_missing_confidence_nonregression.js`, `tests/player_card_metric_heatmap_integration_nonregression.js`

## What is reused
CAY-STABLE reuses the mature football-analytics principle of binning player locations in pitch coordinates rather than camera/image coordinates. No mplsoccer source code is copied and mplsoccer is not a runtime dependency.

## CAY adaptation
- Player cards consume `CAYMetricPitchHeatmap.build(...)` instead of presenting the historical normalized-image heatmap as the football heatmap.
- Only positions projected by an explicitly validated per-segment pitch projector are accepted.
- Minimum metric coverage remains 35% for displaying a pitch heatmap.
- Calibration confidence must now be explicitly present and numeric for every projected observation contributing to a publishable heatmap; missing/blank/invalid confidence remains unknown (`null`) instead of being promoted to a synthetic confidence of `1.0`.
- `calibrationConfidenceCoverage` and `calibrationConfidenceObservations` expose whether confidence evidence is complete. If confidence evidence is incomplete, `avgCalibrationConfidence`, `defendableScore` and heatmap quality stay unavailable and the club-facing pitch heatmap status is `INDISPONIBLE`.
- An explicit measured confidence of `0` remains distinct from missing confidence and is preserved as a real zero.
- Invalid/unavailable segment calibration, failed projections and out-of-pitch positions do not fall back to image coordinates.
- The old image-coordinate binning is retained only as `observedImageHeatmap` audit evidence and is explicitly tagged `IMAGE_NORMALIZED`; it is not the player pitch heatmap.
- `quality.heatmap` is inherited from the metric-pitch heatmap quality contract.

## Replaced behavior
Before the runtime integration, `metric_pitch_heatmap_v1.js` existed and had dedicated tests, but `player_stats_v1.js` still populated `player.heatmap` from normalized image coordinates. That mismatch was removed earlier. A later audit found a second inconsistency: `player_stats_v1.js` correctly kept missing calibration confidence unavailable, while `metric_pitch_heatmap_v1.js` still defaulted missing/invalid projector confidence to `1.0`. The 2026-09-03 hardening removes that false-perfect-confidence path.

## Expected measurable impact
- Pitch heatmaps remain invariant to camera framing when calibration is valid.
- Heatmap metric coverage and calibration-confidence coverage are explicit and auditable per player.
- A validated projector with missing confidence metadata can no longer publish a precise-looking pitch heatmap as defensible evidence.
- Uncalibrated or insufficiently evidenced footage cannot silently produce a club-facing pitch heatmap.
- No new Python, PyTorch, OpenCV or GPU dependency is introduced.

## Risks / limits
- Quality still depends on per-plan calibration and tracking-anchor accuracy.
- A 35% metric coverage threshold can yield partial evidence; club-facing UI must keep coverage visible and must not imply full-match coverage.
- Older/custom projector adapters that omitted `confidence` will now produce `INDISPONIBLE` pitch heatmaps until they supply explicit confidence. This is intentional fail-closed behavior.
- Pitch dimensions currently default to 105 x 68 m unless explicitly configured.
