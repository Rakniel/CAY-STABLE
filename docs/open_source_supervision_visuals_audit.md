# Open-source audit — Roboflow Supervision visual traces

## Source
- Project: `roboflow/supervision`
- Upstream repository: https://github.com/roboflow/supervision
- Release inspected: `0.28.0` (2026-04-30)
- License: MIT

## Useful upstream ideas
Supervision exposes mature visualization primitives for tracked-object traces and heatmaps. The useful architectural lesson for CAY-STABLE is to keep a camera/image-space visualization layer separate from pitch-metric analytics. A trace can be useful to a coach before calibration, while distance, speed, sprint and pitch-position metrics must remain unavailable until image-to-pitch geometry is validated.

## CAY-STABLE adaptation
No Supervision source code is copied and no Python/OpenCV runtime dependency is added. `observed_image_visuals_v1.js` is a browser-first CAY implementation over the existing normalized `fullPath` tracking evidence.

It produces:
- per-player trajectory runs in `IMAGE_NORMALIZED` coordinates;
- camera-frame occupancy heatmaps based on observed detections;
- explicit cuts on segment changes, invalid points and excessive time gaps;
- explicit `physicalMetricsAllowed:false` metadata.

`stable_metric_visuals_runtime_v1.js` attaches this as `observedVisuals` independently of `metricVisuals`. Therefore a coach can inspect tracking coverage/trajectory immediately, while pitch heatmaps and physical metrics continue to return `INDISPONIBLE` when calibration is not defensible.

## What it replaces
Previously the report exposed trajectory/heatmap information only through validated pitch-metric projection. With calibration unavailable, the visual layer was entirely absent even when player tracking itself was working. This adaptation fills that usability gap without pretending camera coordinates are pitch coordinates.

## Expected gain
- estimated implementation/plumbing avoided: 0.5–1 day;
- first useful player trajectory/heatmap evidence becomes available without waiting for metric calibration;
- no new heavy runtime dependency;
- no weakening of metric publication guards.

## Risks / constraints
Camera-space occupancy cannot be compared across pans/zooms as a tactical pitch heatmap. UI labels must therefore keep the distinction visible. It must never feed distance, speed, sprint, possession-position or other physical pitch metrics.

## Status
Integrated as design-pattern reuse under MIT-compatible provenance; no upstream code copied.
