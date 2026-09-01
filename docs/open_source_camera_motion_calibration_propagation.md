# Open-source audit — guarded camera-motion calibration propagation

Date inspected: 2026-09-01

## OpenCV
- Source: https://github.com/opencv/opencv
- Release family inspected for CAY-STABLE: OpenCV 4.14.0 / 4.x documentation.
- License: Apache-2.0 for OpenCV >= 4.5.
- Relevant mature primitives: sparse pyramidal Lucas-Kanade optical flow, feature matching, affine/homography estimation and global image motion estimation.
- CAY-STABLE status: algorithmic/design reference only in this change. No OpenCV source code copied and OpenCV is not a required browser runtime dependency.

## BoT-SORT
- Source: https://github.com/NirAharon/BoT-SORT
- Revision inspected: `251985436d6712aaf682aaaf5f71edb4987224bd`.
- License: MIT.
- Relevant design: compensate camera motion before using motion-based associations; upstream exposes VideoStab/files, sparse optical flow, ORB and ECC camera-motion methods.
- CAY-STABLE status: design reference only. No BoT-SORT implementation code copied.

## Local adaptation
`metric_camera_motion_projector_v1.js` is original clean-room CAY-STABLE JavaScript. It accepts a validated absolute image-to-pitch homography and a separately estimated global image-motion transform mapping the anchor image into the current image. It then composes:

`H_current = H_anchor × inverse(M_anchor_to_current)`

This lets downstream metric code consume a short-lived propagated projector without duplicating the homography solver.

Strict promotion guards require by default:
- anchor calibration already validated;
- propagation age <= 0.35 s;
- no segment/camera cut;
- motion confidence >= 0.78;
- support >= 20 motion correspondences;
- motion inlier ratio >= 0.72;
- normalized residual <= 0.02;
- propagated confidence >= 0.45.

If any condition fails, projection is unavailable rather than extrapolated.

## What this replaces / work avoided
This avoids implementing a second calibration solver for every frame and creates one common contract that future OpenCV/ORB/ECC/optical-flow or native-browser motion estimators can feed. Estimated avoided architecture/plumbing work: **0.5–1 day**.

## Expected measurable impact
No real-video accuracy claim is made yet. The synthetic non-regression test proves exact translation/scale composition and verifies rejection of stale, weak, low-support, high-residual and segment-break propagation. On C.A. Yenne footage the intended measurable outcome is higher metric-coordinate coverage during short camera pans without increasing reprojection error beyond promotion thresholds.

## Risks / dependencies
- A global-motion matrix derived mainly from moving players can be biased. Production promotion should prefer field/background features or independently validated GMC output.
- Repeated chained propagation is intentionally not implemented here; cumulative drift must not silently extend an old calibration.
- OpenCV/BoT-SORT remain optional references. Any direct dependency or model/backend import requires a separate transitive license and deployment audit.
