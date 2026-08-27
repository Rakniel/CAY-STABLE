# OpenCV robust homography consensus adaptation

## Provenance
- Upstream project: OpenCV
- Source: https://github.com/opencv/opencv
- License reference: OpenCV 4.5.0 and higher are Apache-2.0.
- Upstream concept used: robust homography estimation with RANSAC-style minimal hypotheses + inlier consensus, analogous to `findHomography(..., RANSAC)`.
- CAY-STABLE files: `metric_homography_projector_v1.js`, `tests/robust_homography_consensus_nonregression.js`.

## What is reused
Only the mature algorithmic principle is adapted. No OpenCV source code is copied, OpenCV is not bundled, and no native/Python dependency is introduced.

## CAY adaptation
- Existing 4-point exact homography remains unchanged for exactly four correspondences.
- With more than four manual correspondences, CAY-STABLE evaluates deterministic 4-point hypotheses and scores every point in pitch metres.
- A default 2 m inlier threshold and 70% minimum consensus reject calibrations dominated by bad clicks.
- Rejected correspondence indices, inlier ratio and number of tested hypotheses are exposed for audit/UI feedback.
- At least two independent validation points are still mandatory before the projector is usable for distance, speed, sprints or pitch heatmaps.
- No fallback to guessed metric coordinates is permitted.

## Replaced behavior
Previously `metric_homography_projector_v1.js` required exactly four fit points. One badly placed point could poison the whole calibration, while adding extra manual landmarks was impossible. The robust multi-point path allows redundant landmarks and can reject isolated bad clicks without weakening independent validation.

## Expected impact
- Faster, more forgiving manual calibration on real club footage.
- Lower chance that a single inaccurate landmark invalidates an otherwise good camera plan.
- Better auditability through explicit consensus/inlier metadata.
- No additional runtime dependency or license obligation beyond documentation of the design reference.

## Limits / risks
- This is a deterministic lightweight browser-first consensus estimator, not a full OpenCV RANSAC/USAC implementation.
- Hypotheses are capped (default 70) to bound browser cost; very large correspondence sets are therefore not exhaustively sampled.
- Thresholds must be tuned on representative C.A. Yenne footage before being relaxed.
- Independent validation remains the final gate; robust fitting alone never marks a calibration valid.
