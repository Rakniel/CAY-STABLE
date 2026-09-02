# Norfair camera-motion design adaptation

- Source: https://github.com/tryolabs/norfair
- Upstream release inspected: v2.3.0 (published 2025-04-30)
- License: BSD-3-Clause
- Upstream file inspected: `norfair/camera_motion.py`
- Status in CAY-STABLE: design principle adapted clean-room; no Norfair source code copied and Norfair/OpenCV are not runtime dependencies.

## Useful upstream principle

Norfair's camera-motion estimator samples strong image features and explicitly supports masking moving tracked objects / overlays so that camera motion is estimated from evidence that better represents the global scene rather than one local moving group. It also provides translation and homography coordinate-transform abstractions.

## CAY-STABLE adaptation

CAY-STABLE remains browser-first and currently estimates global camera motion from already-tracked footballers plus existing camera/field geometry signals. Importing Norfair's Python/OpenCV stack would be disproportionate at this stage.

The useful robustness principle is adapted as an additional spatial-support guard in `tracking_two_stage_runtime_patch_v1.js`: even if at least three player/detection pairs agree on the same similarity transform, the inlier tracks must cover a minimum normalized-image span before their motion is accepted as global camera motion. A tight cluster of nearby players moving together is therefore rejected as insufficient evidence for a pan/zoom.

The accepted estimate now records `supportSpan` in camera-compensation provenance.

## What this replaces / avoids

Without this guard, a coherent local movement by three nearby players can resemble a camera translation and shift every active track before association. The new check reuses the existing robust similarity-consensus path instead of adding a second GMC subsystem.

## Expected impact

- fewer false global-motion compensations caused by one compact player group;
- lower risk of induced ID switches / false player displacement after such a compensation;
- no new Python, OpenCV, GPU or native dependency;
- approximately 0.25-0.5 day of bespoke robustness experimentation avoided by adapting a mature scene-motion principle.

## Tests

`tests/camera_motion_consensus_nonregression.js` now covers:

- accepted spatially distributed camera pan;
- accepted distributed similarity/zoom case;
- rejected three-player clustered motion with explicit `insufficient_spatial_support` reason;
- preservation of `supportSpan` in compensation provenance.

## Risks / limitations

The current support-span threshold is a conservative normalized-image heuristic, not a substitute for background optical flow. It must be validated on representative C.A. Yenne footage before being tuned. A future optional pixel-level GMC backend may use background masks/feature flow, but it must feed the same conservative CAY evidence contract rather than bypass it.
