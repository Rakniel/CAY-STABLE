# MovingPandas speed-outlier cleaning adaptation — 2026-09-06

## Provenance
- Project: MovingPandas
- Source: https://github.com/movingpandas/movingpandas
- Upstream revision inspected: `3cf16573d70b980df62cca402639839c2dfe45b6`
- Upstream package version at that revision: `0.23.0`
- License: BSD-3-Clause
- Upstream reference: `movingpandas/trajectory_cleaner.py`, `OutlierCleaner`.

## Idea adapted
MovingPandas' speed-based cleaner rejects a trajectory point whose transition exceeds a speed threshold and, importantly, does not advance the previous accepted anchor to that rejected point. CAY-STABLE adapts that principle for already-projected football-pitch coordinates.

No MovingPandas source code is copied. The CAY implementation is browser/Node JavaScript and uses its own data contracts and safety policy.

## CAY-STABLE implementation
- Local module: `metric_trajectory_outlier_cleaner_v1.js`
- Test: `tests/metric_trajectory_outlier_cleaner_nonregression.js`
- Coordinates must be finite metric pitch coordinates supplied by an already validated calibration chain.
- Cleaning never crosses a plan/segment change.
- Cleaning never crosses a temporal gap larger than the configured threshold (default 1 s).
- Default raw-speed ceiling: 55 km/h, aligned with the existing CAY raw-spike plausibility guard.
- Rejected points are not interpolated and are never used as a new anchor.
- The module exposes rejected-point evidence and acceptance coverage instead of silently modifying evidence.

## What this replaces / improves
The current adjacent-pair spike guard can reject both transitions around one isolated bad coordinate because the bad point remains the next pair's anchor. The new utility can preserve the last accepted anchor, allowing the following valid observation to reconnect when the total gap remains within the evidence window.

On the committed deterministic synthetic regression fixture, the old adjacent-pair policy retains 2.0 m from a 4.0 m ground-truth path around one isolated spike; the cleaner retains the full 4.0 m without interpolation. This is a synthetic capability result, not a claim about real-match accuracy.

## Status and promotion rule
Status: **INTEGRATED_UTILITY / NOT_YET_RUNTIME_DEFAULT**.

It is intentionally not wired into published player distance/speed/sprint metrics in the same change. Promotion requires representative C.A. Yenne footage showing lower distance undercount around isolated projection spikes without increasing false distance, plus the existing metric coverage and `INDISPONIBLE` safeguards remaining intact.

## Estimated development gain
Adapting this mature trajectory-cleaning pattern avoids roughly 0.5 day of designing a bespoke spike-recovery policy and its edge-case semantics from scratch.

## Risks / dependencies
- A threshold that is too permissive can retain bad projected points; too strict can remove legitimate explosive motion.
- Reconnecting to the last accepted anchor can only be used when the time gap remains short and calibration/segment provenance is unchanged.
- No new runtime dependency is introduced; MovingPandas, GeoPandas and Python are not required by CAY-STABLE.
