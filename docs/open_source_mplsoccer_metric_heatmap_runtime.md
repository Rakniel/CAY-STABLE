# mplsoccer metric heatmap runtime adaptation

## Provenance
- Upstream project: `andrewRowlinson/mplsoccer`
- Source: https://github.com/andrewRowlinson/mplsoccer
- License: MIT
- Upstream revision inspected for this integration: `ad40c4ccbade56263ccd1d038ad49044fa9928d8` (2026-07-31)
- CAY-STABLE files involved: `metric_pitch_heatmap_v1.js`, `player_stats_v1.js`, `tests/metric_pitch_heatmap_nonregression.js`, `tests/player_card_metric_heatmap_integration_nonregression.js`

## What is reused
CAY-STABLE reuses the mature football-analytics principle of binning player locations in pitch coordinates rather than camera/image coordinates. No mplsoccer source code is copied and mplsoccer is not a runtime dependency.

## CAY adaptation
- Player cards now consume `CAYMetricPitchHeatmap.build(...)` instead of presenting the historical normalized-image heatmap as the football heatmap.
- Only positions projected by an explicitly validated per-segment pitch projector are accepted.
- Minimum metric coverage remains 35% for displaying a pitch heatmap.
- Invalid/unavailable segment calibration, failed projections and out-of-pitch positions do not fall back to image coordinates.
- The old image-coordinate binning is retained only as `observedImageHeatmap` audit evidence and is explicitly tagged `IMAGE_NORMALIZED`; it is not the player pitch heatmap.
- `quality.heatmap` is now inherited from the metric-pitch heatmap quality contract.

## Replaced behavior
Before this integration, `metric_pitch_heatmap_v1.js` existed and had dedicated tests, but `player_stats_v1.js` still populated `player.heatmap` from normalized image coordinates. This meant camera pans/zooms could influence the heatmap shown in player cards. The integration removes that mismatch.

## Expected measurable impact
- Pitch heatmaps become invariant to camera framing when calibration is valid.
- Heatmap metric coverage is explicit and auditable per player.
- Uncalibrated footage cannot silently produce a pitch heatmap.
- No new Python, PyTorch, OpenCV or GPU dependency is introduced.

## Risks / limits
- Quality still depends on per-plan calibration and tracking-anchor accuracy.
- A 35% coverage threshold yields `PARTIEL`; club-facing UI must keep coverage visible and must not imply full-match coverage.
- Pitch dimensions currently default to 105 x 68 m unless explicitly configured.
