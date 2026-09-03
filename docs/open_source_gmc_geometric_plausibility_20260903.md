# Open-source adaptation: guarded GMC geometric plausibility (2026-09-03)

## Sources inspected

- OpenCV robust affine / homography estimation and RANSAC-family model validation concepts.
  - Source: https://github.com/opencv/opencv
  - License: Apache-2.0.
- BoT-SORT global motion compensation architecture.
  - Source: https://github.com/NirAharon/BoT-SORT
  - License: MIT.

## What was reused

No upstream source code, model, weight or runtime dependency was copied. CAY-STABLE adapts the mature design principle that a camera-motion transform must be validated as a geometric model, not accepted only because an estimator reports high confidence/inlier support.

## CAY-STABLE implementation

`metric_camera_motion_projector_v1.js` now performs an additional short-horizon transform plausibility gate before propagating a validated pitch calibration through camera motion. The gate rejects:

- orientation flips / reflections;
- degenerate or implausibly large scale changes;
- excessive anisotropy;
- excessive shear;
- excessive projective distortion when frame dimensions are available.

Existing evidence gates remain mandatory: confidence, support, inlier ratio, residual, age and segment-break checks. Passing the new geometric gate does not create metric evidence by itself; it only permits propagation from an already validated absolute calibration anchor.

## What this replaces

Previously a numerically valid matrix with high confidence/support and low residual could still be accepted even if it represented an extreme zoom, reflection or pathological projective warp. That could corrupt pitch trajectories while looking statistically strong at the motion-estimator level.

## Tests

`tests/metric_camera_motion_projector_nonregression.js` now covers:

- valid translation and moderate zoom remain accepted;
- mirrored transform is rejected;
- extreme zoom is rejected;
- extreme perspective is rejected when frame geometry is known;
- all previous age/confidence/support/residual/segment guards remain intact.

## License and dependency impact

- OpenCV reference: Apache-2.0.
- BoT-SORT reference: MIT.
- Code copied: none.
- New runtime dependencies: none.
- Distribution obligations added to CAY-STABLE: none beyond existing project obligations.

## Expected impact

The change closes a failure mode where a bad GMC model could contaminate metric trajectories despite strong estimator diagnostics. Expected benefit is fewer false pitch jumps and fewer physically impossible distance/speed spikes during pans/zooms, while preserving `INDISPONIBLE` whenever calibration or propagation evidence is insufficient.
