# OpenCV robust homography consensus adaptation

## Provenance
- Upstream project: OpenCV
- Source: https://github.com/opencv/opencv
- Official documentation reference checked: OpenCV 4.13/4.11 `findHomography` documentation.
- Upstream release family inspected for this design reference: OpenCV 4.x.
- License: Apache-2.0 for OpenCV 4.5.0 and higher.
- Upstream concepts used: robust homography estimation with RANSAC-style minimal hypotheses + inlier consensus, followed by refinement using inliers only.
- CAY-STABLE files: `metric_homography_projector_v1.js`, `tests/metric_homography_projector_nonregression.js`, `tests/robust_homography_consensus_nonregression.js`.

## What is reused
Only mature algorithmic principles are adapted independently. No OpenCV source code is copied, OpenCV is not bundled, and no native/Python dependency is introduced.

## CAY adaptation
- Existing 4-point exact homography remains unchanged for exactly four correspondences.
- With more than four manual correspondences, CAY-STABLE evaluates deterministic 4-point hypotheses and scores every point in pitch metres.
- A default 2 m inlier threshold and 70% minimum consensus reject calibrations dominated by bad clicks.
- After the best consensus is selected, all accepted inliers are now refit together with a lightweight linear least-squares solve instead of retaining the winning 4-point seed unchanged.
- The runtime exposes whether the refit was applied, the refit method, the seed mean reprojection error, final mean reprojection error, rejected correspondence indices, inlier ratio and number of tested hypotheses.
- At least two independent validation points are still mandatory before the projector is usable for distance, speed, sprints or pitch heatmaps.
- No fallback to guessed metric coordinates is permitted.

## Replaced behavior
The first robust CAY implementation correctly identified inliers/outliers but retained the homography estimated from the winning minimal four-point subset. That discarded useful information from additional valid landmarks. The new path keeps the robust consensus selection and then uses every accepted landmark for the final fit.

## Expected impact
- Lower reprojection noise when educators provide five or more valid terrain landmarks.
- More stable metric trajectories, distance and speed after manual multi-point calibration.
- Faster, more forgiving calibration on real club footage because redundant good landmarks now contribute to the final model rather than serving only as voters.
- Better auditability through explicit before/after fit metadata.
- No additional runtime dependency or license obligation beyond documentation of the design reference.

## Validation / acceptance
- Syntax and non-regression CI remain mandatory before merge.
- Dedicated non-regression covers five coherent noisy landmarks plus one gross bad click, verifies rejection of the outlier, verifies all-inlier refit, and ensures mean inlier error is not degraded versus the winning minimal seed.
- Independent validation points remain the final metric gate.

## Limits / risks
- CAY uses a deterministic lightweight browser-first linear least-squares refit, not OpenCV's Levenberg-Marquardt optimizer and not a full RANSAC/USAC implementation.
- Normal equations are adequate for the small normalized/manual calibration sets used here but are less numerically sophisticated than SVD-based normalized DLT. If real C.A. Yenne footage exposes conditioning issues, the next step is normalized-coordinate solving rather than relaxing validation thresholds.
- Hypotheses are capped (default 70) to bound browser cost; very large correspondence sets are therefore not exhaustively sampled.
- Thresholds must be tuned on representative C.A. Yenne footage before being relaxed.
- Independent validation remains the final gate; robust fitting alone never marks a calibration valid.
