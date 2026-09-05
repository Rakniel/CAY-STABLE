# Kloppy time-aware tracking reference

- Upstream project: https://github.com/PySport/kloppy
- Upstream version inspected: v3.19.0 (`99f76f0`, released 2026-06-07)
- License: BSD-3-Clause
- CAY-STABLE status: design/data-contract principle adapted; no Kloppy source code copied and Kloppy is not a runtime dependency.

## Useful upstream principle
Kloppy treats football tracking as timestamped tracking data rather than an unordered cloud of positions. This matters for CAY heatmaps because detector/tracker output can be sampled irregularly across blur, occlusion, frame skipping, or multi-plan edits.

## Local adaptation
`metric_pitch_heatmap_v1.js` keeps the observation-count grid for audit/backwards compatibility, but trustworthy heatmap publication is based on temporal evidence. When trustworthy consecutive timestamps exist it computes occupancy in seconds and makes the normalized heatmap time-weighted.

A time interval is counted only when:
1. timestamps are finite and strictly increasing;
2. both observations belong to the same tracking segment/camera plan;
3. the interval does not exceed `maxDwellGapSec` (default 1 s), preventing long missing-video gaps from becoming invented occupancy;
4. both endpoints project successfully through a validated pitch calibration.

For accepted intervals, CAY distributes dwell time over every pitch-grid cell crossed by the straight metric segment between the two validated projected anchors. Cell-boundary intersection fractions determine how much of the interval is assigned to each crossed cell. This replaces the older start-cell-only allocation, which could overheat the departure zone whenever a player crossed one or more heatmap cells between observations. The trajectory output itself remains un-interpolated (`interpolation: NONE`); this interpolation is restricted to occupancy-time allocation between two already validated anchors and is exposed as `timeAllocation: LINEAR_PITCH_SEGMENT`.

If no defensible timed interval exists, the observation-density grid remains available only as diagnostic evidence (`heatmapBasis: OBSERVATIONS`, `timeAllocation: NONE`). It never manufactures seconds and, since the 2026-09-05 fail-closed refinement, it cannot be published as a defensible pitch heatmap without temporal evidence.

### 2026-09-05 quality refinement
For a `TIME_SECONDS` heatmap, publication quality includes the amount of eligible time actually covered by accepted projected intervals:

`defendableScore = metricCoverage × avgCalibrationConfidence × temporalCoverage`

The previous two-factor score remains exposed as `observationDefendableScore` for audit. This prevents a time-weighted heatmap with perfect point projection/calibration but a large tracking gap from being labelled `FIABLE`. Example non-regression: 1.0 s of accepted dwell over 3.5 s eligible time keeps `observationDefendableScore = 1.0`, but produces `temporalCoverage = 0.2857`, `defendableScore = 0.2857`, and publication `INDISPONIBLE` when the configured temporal-coverage threshold is not met.

A second fail-closed guard now requires temporal evidence to exist at all. Metric-valid positions with missing timestamps, or positions separated only by camera-plan cuts, can no longer pass the heatmap publication gate merely because their point coverage and calibration confidence are high. With no same-segment positive-duration interval, `temporalCoverage = null`, `defendableScore = 0`, quality is `INDISPONIBLE`, and the reason explicitly reports missing temporal evidence. This closes the former observation-only publication bypass while preserving observations for audit and preserving the independent trajectory contract.

## Exposed evidence
- `timeCells`
- `normalizedTimeCells`
- `normalizedObservationCells`
- `heatmapBasis`
- `timeAllocation`
- `eligibleIntervalSeconds`
- `projectedIntervalSeconds`
- `temporalCoverage`
- `observationDefendableScore`
- `defendableScore`
- `qualityPolicy`
- `temporalPolicy`

## Replaced weakness
The first adaptation removed sampling-density bias by weighting heatmaps with time. The 2026-08-30 extension removed a second bias: an accepted interval is no longer assigned entirely to its starting cell when the player demonstrably crosses pitch-grid boundaries before the next observation. The first 2026-09-05 refinement prevents temporal holes from disappearing from the quality score. The latest refinement removes the remaining bypass where zero temporal evidence could be treated as automatically sufficient and allow an observation-only pitch heatmap to be published.

## Validation
`tests/metric_pitch_heatmap_nonregression.js` covers irregular sampling, exact multi-cell dwell allocation, excessive temporal gaps, camera-segment cuts, calibrated partial coverage, strict coverage rejection and temporal-quality degradation when accepted dwell covers only part of eligible time. `tests/metric_pitch_heatmap_temporal_evidence_required_nonregression.js` adds explicit fail-closed coverage for missing timestamps and cut-only observations, plus a positive same-plan timed control. Tests assert that allocated cell seconds conserve the full accepted interval duration.

## Dependency / legal impact
Zero new runtime dependency. BSD-3-Clause design/data-contract reference only; no external code incorporated. The grid-boundary dwell allocator and temporal publication contract are CAY-specific JavaScript written for STABLE.

## Work avoided / expected impact
Reusing the mature time-indexed tracking principle avoids inventing a second heatmap evidence model and keeps the correction inside the existing CAY metric artifact. Estimated design/plumbing avoided: **0.1–0.25 day**. The measurable regression target is binary: a fixture with perfect metric point coverage and calibration but no valid temporal interval changes from potentially publishable to `INDISPONIBLE`, while a normal same-segment timed sequence remains `FIABLE`.

## Risks / limits
This is intentionally conservative. Sparse or cut-heavy footage can leave pitch heatmaps unavailable even when isolated projected positions look plausible. CAY keeps those observations diagnostic rather than presenting them as time occupancy. Threshold relaxation should only follow benchmark evidence on real C.A. Yenne footage.
