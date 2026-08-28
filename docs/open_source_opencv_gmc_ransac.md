# OpenCV robust affine/RANSAC GMC design reference

- Upstream project: `opencv/opencv`
- Source: https://github.com/opencv/opencv
- Upstream family inspected: OpenCV 4.x documentation/source available in August 2026.
- License: Apache License 2.0 for current OpenCV 4.x releases (license change effective from OpenCV 4.5-pre onward).
- Upstream capability used as a design reference: robust partial-affine/similarity estimation with inlier consensus (for example `estimateAffinePartial2D` with RANSAC-style robust fitting).
- Code reuse status: **no OpenCV source code copied** into CAY-STABLE. OpenCV is not added as a runtime dependency.

## CAY-STABLE adaptation

Local implementation extended: `tracking_two_stage_runtime_patch_v1.js`.

The previous BoT-SORT-inspired camera-motion compensation already fitted a bounded similarity transform from player correspondences, but the first weighted least-squares fit could still be pulled away from the true camera motion by one appearance-plausible bad correspondence.

The 2026-08-28 adaptation keeps the existing CAY tracker and adds a small deterministic robust-consensus stage instead of creating another tracking path:

1. build the same conservative one-to-one appearance candidate set already used by CAY;
2. enumerate bounded two-correspondence similarity hypotheses (maximum 11 on-field players keeps this cheap);
3. reject unsupported scale/rotation immediately;
4. score each hypothesis against all correspondences with the existing normalized residual gate;
5. require at least three inliers;
6. select the strongest consensus, then refit the final similarity transform on inliers only;
7. expose `candidates` and `rejectedPairs` in camera-compensation provenance;
8. preserve all existing segment-break, geometry-change, zoom and confidence guards.

No player ID is created or merged by this stage. Historical `fullPath` evidence remains untouched. Only active association state is compensated before matching.

## What this replaces

It replaces the fragile "fit all unique appearance pairs first, then try one residual cleanup" behavior inside the existing GMC path. The rest of the tracker is unchanged.

## Validation

Added test: `tests/camera_motion_outlier_consensus_nonregression.js`.

The test injects one spatially wrong but appearance-plausible player correspondence among four coherent camera-motion correspondences and verifies that CAY recovers the correct pan, rejects the outlier, records the rejection and applies the transform to active tracks.

Existing camera-motion and full non-regression tests remain mandatory through `.github/workflows/cay-stable-integration.yml`.

## Expected impact / cost

- Expected impact: fewer identity breaks and false player-motion spikes when one detector/ReID association is temporarily wrong during a camera pan/zoom.
- Runtime cost: bounded pair-hypothesis enumeration over at most 11 on-field CAY players (<=55 minimal hypotheses before existing gates), negligible compared with detection/model inference.
- New dependencies: none.
- License risk: low. Apache-2.0 design reference only; no upstream implementation copied or vendored.
