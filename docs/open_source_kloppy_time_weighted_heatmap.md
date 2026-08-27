# Kloppy time-aware tracking reference

- Upstream project: https://github.com/PySport/kloppy
- Upstream version inspected: v3.19.0 (`99f76f0`, released 2026-06-07)
- License: BSD-3-Clause
- CAY-STABLE status: design/data-contract principle adapted; no Kloppy source code copied and Kloppy is not a runtime dependency.

## Useful upstream principle
Kloppy treats football tracking as timestamped tracking data rather than an unordered cloud of positions. This matters for CAY heatmaps because detector/tracker output can be sampled irregularly across blur, occlusion, frame skipping, or multi-plan edits.

## Local adaptation
`metric_pitch_heatmap_v1.js` now keeps the existing observation-count grid for audit/backwards compatibility, but when trustworthy consecutive timestamps exist it also computes occupancy in seconds and makes the normalized heatmap time-weighted.

A time interval is counted only when:
1. timestamps are finite and strictly increasing;
2. both observations belong to the same tracking segment/camera plan;
3. the interval does not exceed `maxDwellGapSec` (default 1 s), preventing long missing-video gaps from becoming invented occupancy;
4. both endpoints project successfully through a validated pitch calibration.

If no defensible timed interval exists, the module falls back explicitly to observation-density and reports `heatmapBasis: OBSERVATIONS`. This fallback never manufactures seconds.

## Exposed evidence
- `timeCells`
- `normalizedTimeCells`
- `normalizedObservationCells`
- `heatmapBasis`
- `eligibleIntervalSeconds`
- `projectedIntervalSeconds`
- `temporalCoverage`
- `temporalPolicy`

## Replaced weakness
Previously every projected sample contributed the same weight. A player region sampled 10 times in one second could therefore look hotter than a region sampled twice over several seconds. The new output is invariant to that sampling-density artifact when timestamps are available.

## Validation
`tests/metric_pitch_heatmap_nonregression.js` now covers irregular sampling, excessive temporal gaps, camera-segment cuts, calibrated partial coverage, strict coverage rejection and legacy observation fallback.

## Dependency / legal impact
Zero new runtime dependency. BSD-3-Clause design reference only; no external code incorporated.
