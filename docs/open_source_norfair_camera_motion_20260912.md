# Norfair camera-motion evidence adaptation — 2026-09-12

## Upstream
- Project: `tryolabs/norfair`
- Audited revision: `e517b4236f6b67a6ecf342f5df1fccb7788dbc54`
- Upstream version at that revision: 2.3.0
- License: BSD-3-Clause
- Source: https://github.com/tryolabs/norfair
- Relevant design reference: `norfair/camera_motion.py` / MotionEstimator and homography/translation transformation getters.

## Useful upstream ideas
Norfair's camera-motion estimator samples strong image points, supports a mask so moving detections/players and static overlays can be excluded from camera-motion estimation, and keeps a reference frame until too few reference points remain matched. The homography getter exposes a configurable proportion-of-points-used threshold before the reference must be refreshed.

These ideas are especially relevant to football: without excluding players, a sparse optical-flow estimator can accidentally explain coordinated player movement as camera movement. Likewise, a stale reference image can make a numerically plausible transform unreliable during a pan/zoom sequence.

## CAY-STABLE adaptation
No Norfair source code is copied.

New clean-room module: `camera_motion_background_evidence_guard_v1.js`.

The module sits in front of the already-existing `camera_motion_artifact_provider_v1.js` contract and requires explicit evidence before an external camera-motion artifact is accepted by the guarded provider:
- `backgroundMaskApplied === true` on every motion sample;
- `matchedReferencePointRatio` is finite and in `[0,1]`;
- default minimum retained reference-point ratio is `0.75` (configurable; not claimed as an accuracy optimum before C.A. Yenne benchmarks);
- optional `referenceAgeFrames` can be capped by the caller;
- the existing CAY provenance/license guard remains authoritative and unchanged.

The guarded provider delegates actual sample lookup and metric propagation to the existing provider/projector. It therefore does not duplicate homography, motion plausibility, segment isolation, freshness or physical-metric logic.

## What this replaces / avoids
It avoids a future backend-specific collection of ad-hoc checks such as "did this OpenCV/Norfair/BoT-SORT producer mask the players?" or "is the optical-flow reference still sufficiently supported?". Any permissively licensed native/offline producer can satisfy one small CAY evidence contract instead.

Estimated implementation work avoided: roughly 0.5–1 day of duplicated backend-specific validation/plumbing once multiple GMC producers are benchmarked.

## Expected measurable impact
Expected, not yet claimed as measured on C.A. Yenne footage:
- fewer false camera-motion transforms dominated by player motion;
- fewer stale-reference propagations during long pans;
- cleaner comparison of camera-motion backends because background-mask and retained-reference support become explicit audit fields.

No accuracy percentage is claimed until representative club video benchmarks are available.

## Risks / dependencies
- Norfair itself is **not** added as a mandatory runtime dependency.
- OpenCV/Python are **not** added to the browser build.
- A producer can truthfully set `backgroundMaskApplied` only if its own implementation actually excluded the configured moving-object regions; this remains an auditable provenance obligation.
- `0.75` is a conservative CAY contract default, not a copied Norfair constant and not a validated optimum for C.A. Yenne footage.

## Status
Integrated as a clean-room evidence contract and non-regression test. Upstream code/weights/data copied: none.
