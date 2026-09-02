# OSS provenance — automatic calibration geometric support gate

Date: 2026-09-03

## Source studied
- Project: `rafaelsouza-tech/soccer-tactical-vision`
- Revision audited: `4c557534c624948f3bfe3db956859c7ea3b442fa`
- License: MIT
- Relevant area: `src/soccervision/calib/homography.py` and SoccerNet calibration benchmark notes.

## Idea adapted
Real-footage calibration should not be accepted merely because a homography can be numerically fitted. Frames with too few or too spatially concentrated pitch keypoints are calibration-starved and should be rejected rather than forced into a plausible-looking projection.

CAY-STABLE implements its own JavaScript support gate before its existing robust homography engine. It measures convex-hull coverage and horizontal/vertical spans in both image space and pitch space. No third-party source code was copied.

## CAY modification
- `automatic_pitch_calibration_v1.js` version 1.1.0
- Adds `geometricSupport()`.
- Automatic homography is rejected with `AUTO_CALIBRATION_GEOMETRIC_SUPPORT_TOO_WEAK` when correspondence support is too narrow/clustered.
- Existing RANSAC-like consensus, independent reprojection validation, bottom-corner sanity and publication guards remain unchanged.

## Expected impact
- Prevents compact clusters of line/keypoint detections from producing false automatic field calibrations.
- Keeps image-space tracking independent: rejection only makes metric projection unavailable.
- Avoids manual correction cascades caused by accepting geometrically underconstrained frames.

## Estimated work avoided
Approximately 0.5–1 engineering day versus designing and validating a support-quality gate from scratch.

## Risks / dependencies
Thresholds are conservative defaults and must be measured on C.A. Yenne real footage. No new runtime dependency is introduced.
