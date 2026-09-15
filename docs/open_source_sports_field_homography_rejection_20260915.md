# OSS audit — darkAlert/sports-field-homography

Audit date: 2026-09-15

## Provenance

- Project: `darkAlert/sports-field-homography`
- Source: https://github.com/darkAlert/sports-field-homography
- Upstream architecture: UNet pitch/court segmentation followed by a Spatial Transformer Network (ResNet34 backbone) regressing a 3x3 homography; exposes a homography consistency score and point mapping utilities.
- Upstream repository state inspected: public repository, 20 commits visible during audit.

## License decision

- License displayed by upstream: **GPL-3.0**.
- CAY-STABLE decision: **REJECTED FOR CODE/WEIGHT INTEGRATION** under the current permissive-reuse policy. No source code, weights, dataset, configuration, or generated artifact from this project is copied into CAY-STABLE.
- Rationale: direct reuse would introduce GPL-3.0 copyleft obligations that are not currently accepted for CAY-STABLE.

## Technically useful idea only

The useful architectural idea is to expose calibration confidence/consistency together with the homography and make publication depend on that evidence, rather than treating every estimated matrix as equally trustworthy. CAY-STABLE already has calibration confidence and fail-closed metric publication primitives, so this is a comparison/reference only and must not create duplicate runtime logic.

## What it could have replaced

If licensing were compatible, the project could have replaced part of a hand-built learned pitch-segmentation + homography-regression prototype. Because CAY-STABLE already owns calibration/homography logic, no replacement is justified today.

## Estimated work avoided / impact

- Potential prototype effort avoided if a compatible equivalent is found: roughly **2–4 engineering days** for a first segmentation-to-homography baseline plus confidence output.
- Expected measurable impact of the *idea*, if a compatible implementation is benchmarked later: fewer metrically published frames when homography consistency is weak; compare reprojection error, calibration coverage, and downstream metric availability before/after.

## Status

**Studied / rejected for integration.**

## Risks / dependencies

- GPL-3.0 incompatibility with the current reuse policy.
- PyTorch/Kornia/ResNet34 runtime and GPU cost.
- Trained checkpoint provenance and dataset rights require separate audit even if source-code licensing were acceptable.
- Architecture is generic sports-field homography and must not be assumed robust to C.A. Yenne amateur footage, camera cuts, benches, spectators, or multi-plan transitions without benchmark evidence.
