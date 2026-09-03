# Open-source provenance — GMC frame displacement guard (2026-09-03)

## Sources inspected

### OpenCV
- Project: `opencv/opencv`
- Source: https://github.com/opencv/opencv
- License: Apache-2.0 (repository SPDX metadata verified 2026-09-03).
- Release inspected: OpenCV 5.0.0, published 2026-06-06.
- Role as design reference: robust geometric motion/homography estimation and explicit validation of an estimated transform before consuming it downstream.

### BoT-SORT
- Project: `NirAharon/BoT-SORT`
- Source: https://github.com/NirAharon/BoT-SORT
- License: MIT (repository SPDX metadata verified 2026-09-03).
- Upstream revision inspected: `251985436d6712aaf682aaaf5f71edb4987224bd`.
- Role as design reference: compensate camera motion before object association; upstream exposes camera-motion compensation based on VideoStab / sparse optical flow / ORB / ECC.

## What CAY-STABLE changed

No OpenCV or BoT-SORT source code, model, weight or runtime dependency is copied into CAY-STABLE.

`metric_camera_motion_projector_v1.js` already rejected a camera-motion estimate when confidence, support, inlier ratio, residual, orientation, scale, anisotropy, shear or perspective were unsafe. One important physical case remained: a transform could have excellent estimator statistics and a benign linear part while translating the entire image by a cut-like amount.

CAY-STABLE now evaluates the actual displacement of the image centre under the estimated transform when frame dimensions are available. The displacement is normalized by the frame diagonal. The default short-horizon limit is `0.45` frame diagonals and is configurable through `maxFrameDisplacementRatio`.

If the centre displacement exceeds that limit, the transform is rejected with `MOTION_DISPLACEMENT_TOO_HIGH`; metric calibration propagation is not performed. Missing frame dimensions preserve previous behaviour rather than inventing a scale.

## What this replaces

Before: statistical validity + transform-shape plausibility could still accept a huge pure translation.

After: statistical validity + shape plausibility + short-horizon whole-frame displacement plausibility.

This extends the existing projector instead of creating another calibration or GMC subsystem.

## Safety / metric publication impact

- A cut-like transform cannot create a fake pitch jump through short-horizon calibration propagation.
- Rejection never fabricates coordinates: downstream distance, speed, sprint and metric heatmaps remain unavailable for that interval until valid calibration evidence exists.
- Legitimate moderate pans remain accepted; the regression test includes a 320 px horizontal / 80 px vertical move on a 1920×1080 frame.
- The limit is intentionally generous because C.A. Yenne footage may contain fast amateur camera pans. A false rejection costs coverage; a false acceptance can corrupt physical statistics, so the failure mode remains conservative.

## Tests

`tests/metric_camera_motion_projector_nonregression.js` now covers:
- normal pan accepted;
- cut-like translation rejected despite 0.99 confidence, 100 supports, 0.98 inlier ratio and 0.001 residual;
- custom displacement limit respected;
- all pre-existing orientation / zoom / perspective / age / confidence / support / residual guards unchanged.

## Estimated engineering gain

Adapting the mature GMC/robust-geometry validation pattern instead of designing a new motion subsystem avoids roughly 0.5 day of bespoke design/debugging. No new dependency, bundle weight or backend service is introduced.

## Status

Integrated as a CAY-specific clean-room guard. License dependency: none at runtime. Reference licenses: OpenCV Apache-2.0; BoT-SORT MIT.
