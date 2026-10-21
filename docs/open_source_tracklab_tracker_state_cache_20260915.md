# TrackLab tracker-state cache audit — 2026-09-15

## Provenance
- Project: TrackingLaboratory/tracklab
- Source: https://github.com/TrackingLaboratory/tracklab
- Audited revision: `5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2`
- Upstream version at that revision: `1.3.24`
- License: MIT (`LICENSE`, copyright 2022 bstandaert)
- Integration status: studied / architecture pattern candidate; no upstream code, model, weight or dataset copied.

## Useful pattern
TrackLab persists a **Tracker State** containing intermediate tracking predictions such as detections, bounding boxes, ReID embeddings, jersey-number evidence and track IDs. The state can be loaded again so later evaluation or downstream modules do not have to recompute expensive detector/ReID stages.

## CAY-STABLE adaptation target
Do not import TrackLab's Python runtime into the browser-first STABLE build. Instead, reuse the architectural idea behind the existing CAY analysis-artifact contracts:

1. cache immutable, provenance-tagged intermediate analysis artifacts after expensive detector/tracker/ReID stages;
2. key cache compatibility by video fingerprint, CAY pipeline/schema version, detector/tracker/ReID configuration and model/weight provenance;
3. invalidate rather than silently reuse when any compatibility key changes;
4. allow heatmap/trajectory/metric/UI iterations to consume validated cached tracking evidence without rerunning detection;
5. never cache a publication decision as truth: current CAY coverage, calibration and `INDISPONIBLE` guards must still run on each derived result.

This extends existing CAY artifact contracts instead of creating a second tracking representation.

## What this can replace
Repeated full detector + tracking + ReID recomputation while tuning downstream trajectories, heatmaps, metric publication or UI. It does **not** replace persistent player identity logic, calibration validation, bench/spectator exclusion or the 11-player on-field invariant.

## Expected acceleration
- Estimated engineering work avoided by reusing the proven state/cache architecture: ~0.5–1 day of cache-contract design.
- Expected runtime impact after implementation: downstream-only iterations should avoid the detector/tracker/ReID portion of reruns when the cache compatibility key is unchanged. No percentage is claimed until measured on representative C.A. Yenne footage.
- Measurement target: wall-clock cold run vs compatible cached rerun, plus byte size and cache-hit/miss reason.

## Legal/dependency boundary
TrackLab itself is MIT, but its optional plugins, models, datasets and weights may have independent licenses. MIT status of the framework must never be used as a blanket approval for transitive components. Any imported producer/model must retain its own source, exact revision/version, license and weight provenance.

## Risks
- stale embeddings or tracks if cache invalidation is incomplete;
- large artifacts for long matches;
- privacy/storage implications for persisted player crops or embeddings;
- Python/PyTorch dependency creep if TrackLab is imported directly rather than keeping the CAY artifact boundary.

## Promotion gate
Only implement persistent caching after a non-regression proves: exact cache invalidation on configuration/provenance changes, no cross-video reuse, identical downstream outputs between cold and cached evidence, explicit cache provenance, and no weakening of metric publication guards.
