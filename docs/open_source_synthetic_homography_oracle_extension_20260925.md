# OSS synthetic homography oracle extension — 2026-09-25

## Purpose

Extend the existing CAY-STABLE synthetic-oracle strategy without duplicating runtime calibration, tracking, metric heatmap, trajectory, or publication logic.

## Upstream references

### soccer-tactical-vision
- Source: https://github.com/rafaelsouza-tech/soccer-tactical-vision
- License: MIT for repository code (upstream README, checked 2026-09-25).
- Useful concept: deterministic CPU-only synthetic broadcast clip with full ground truth; calibration evaluation; RANSAC homography validation; temporal smoothing; pitch-metre projection.
- CAY use: benchmark/oracle concepts only. No upstream source code, weights, media, or dataset copied in this change.
- Separate assets: upstream documents RF-DETR/model and dataset provenance separately. Those assets are not imported by this change.

### Synthetic Metropolis Homography (SMH)
- Source: https://github.com/fkluger/smh
- License: BSD for source code; dataset CC BY 4.0 (upstream README, checked 2026-09-25).
- Useful concept: explicit camera intrinsics/extrinsics + plane parameters allow exact ground-truth homographies under randomized camera motion and multiple planes.
- CAY use: idea only, as an additional geometry stress-test family. No dataset, Blender assets, mesh, rendered image, or source code copied.

## Why this is additive rather than a rewrite

CAY-STABLE already has dedicated modules for automatic/semantic pitch calibration, camera-motion artifacts, metric homography projection, segment registry, trajectory smoothing, metric heatmaps and publication guards. The synthetic oracle must test those modules through their public artifacts rather than implement an alternate calibration or metric pipeline.

## New oracle cases to add to the CAY fixture suite

1. **Pure pan** — fixed pitch plane, camera yaw only. Assert metric player positions remain stable within the configured projection tolerance.
2. **Pan + zoom** — camera motion changes image scale. Assert GMC cannot silently convert zoom into player movement.
3. **Hard camera cut** — homography discontinuity must open a new metric segment; no trajectory line may bridge the cut.
4. **Temporary calibration starvation** — insufficient landmarks for N frames. Metrics must become `INDISPONIBLE` or retain only explicitly defensible observed coverage; no fabricated interpolation.
5. **Wrong-plane candidate** — plausible image homography inconsistent with pitch geometry. Validation must reject it before publication.
6. **Multiple planar hypotheses** — synthetic foreground/background plane distractor. Pitch membership and semantic calibration must select the football pitch plane or fail closed.
7. **Known-distance path** — player follows a ground-truth polyline in pitch metres. Compare CAY distance against exact path length.
8. **Known-speed path** — constant-speed and sprint segments. Validate speed/sprint publication only where temporal and metric coverage satisfy guards.
9. **Teleportation injection** — one bad projected observation. It must be cut/rejected and must not inflate distance, speed or heatmap mass.
10. **Re-entry after absence** — player leaves observable field then returns. Metric segments may resume, but no synthetic distance may be added across the unobserved gap.

## Required before/after measurements

For any calibration/GMC/projection change, record at minimum:
- accepted calibration ratio;
- image reprojection error;
- pitch-position error in metres against synthetic truth;
- false accepted wrong-plane count;
- segment count at true camera cuts versus false cuts;
- distance absolute/relative error;
- speed error on covered intervals;
- heatmap mass conservation on covered intervals;
- number of metrics correctly returning `INDISPONIBLE` under insufficient evidence.

A candidate is rejected if it improves completeness by publishing geometrically unsupported data, bridges a camera cut, increases false pitch-plane acceptance, or turns an `INDISPONIBLE` case into an unjustified numeric statistic.

## License boundary

This commit contains only CAY-authored documentation of test concepts. It does not vendor or redistribute external code, model weights, datasets, annotations, media, meshes, or generated frames. If SMH data is later used in CI, its CC BY 4.0 attribution requirements must be fulfilled separately. If soccer-tactical-vision code is later vendored, its exact revision and MIT notice must be recorded in `OPEN_SOURCE_COMPONENTS.md` before merge.

## Expected acceleration

A deterministic geometry oracle should avoid roughly 2–5 engineering days otherwise spent creating ad-hoc camera-motion clips and manually judging calibration regressions. More importantly, it turns calibration/GMC changes into measurable before/after gates rather than visual impressions.

## Status

**Studied / oracle design integrated. Runtime unchanged.**
