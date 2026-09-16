# OSS audit — two-point PTZ sports calibration — 2026-09-16

## Candidate

- Project: `lood339/two_point_calib`
- Source: https://github.com/lood339/two_point_calib
- Upstream purpose: implementation of **A Two-point Method for PTZ camera Calibration in Sports** (WACV 2018).
- Audited revision: `b4b861429c92368e8e4accecc986272070fb19bc`.
- Revision date: 2020-01-03.
- License: **BSD-2-Clause**, verified from the repository `LICENSE` at the audited revision.
- Upstream dependencies declared by the project: OpenCV, Eigen, FLANN and matio.

## Why this is useful to CAY-STABLE

CAY-STABLE already has validated per-segment homography, robust manual correspondences, camera-motion evidence and strict metric fail-closed guards. The useful additional idea here is specifically the **low-correspondence PTZ recovery path**: when a camera pan/tilt/zoom changes the view but only a small number of reliable pitch landmarks remain visible, a PTZ-aware camera model can potentially recover a candidate camera pose from fewer correspondences than a fresh generic four-point homography.

This is relevant to amateur C.A. Yenne footage where the operator may pan quickly and where four clean field landmarks are not continuously visible.

## Reuse decision

**Status: studied / legally admissible for benchmark / not integrated into STABLE runtime.**

No upstream source code, trained forest/data, configuration or dependency is copied by this audit. BSD-2-Clause is compatible with the current permissive CAY policy provided copyright/license notices are preserved if code is later redistributed.

The existing browser-first calibration remains authoritative. This candidate must not create a parallel metric projector. If prototyped, it must emit a candidate transform through the existing CAY calibration/segment contracts and then pass the same independent reprojection, geometry, segment, camera-motion and metric-publication guards already used by STABLE.

## What it could replace

If validated, the method could replace part of the current **full recalibration after PTZ movement** workflow for intervals where only two strong pitch correspondences plus a trustworthy prior camera model are available. It must not replace robust multi-point calibration when enough independent landmarks are visible.

Estimated engineering work avoided versus designing a PTZ-specific low-correspondence solver from scratch: **about 1–3 days** for algorithm exploration and prototype geometry, excluding native/browser porting and dataset/model audit.

## Required CAY benchmark

Before promotion, compare against the current segment calibration on representative C.A. Yenne clips containing static shots, pans, tilt, zoom and cuts. Measure:

1. median and p95 pitch reprojection error in metres on independent landmarks;
2. recovery delay after pan/tilt/zoom;
3. percentage of eligible video seconds with defensible metric calibration;
4. false recovery across hard cuts or unrelated camera plans;
5. downstream stationary-player false distance during camera motion;
6. downstream trajectory discontinuity and speed spikes around recovery;
7. runtime cost and setup burden for educators.

Promotion requires a measurable gain without increasing false calibration acceptance. Any ambiguous or weakly evidenced candidate remains `INDISPONIBLE`.

## Risks and dependency boundary

- The upstream project is old and its native dependency stack is unsuitable as a mandatory browser dependency.
- The regression-forest/data assets must be audited separately before reuse; repository code licensing does not automatically establish rights for every external dataset/model artifact.
- A two-point solution relies on camera-model assumptions and priors; wrong priors can produce plausible-looking but metrically wrong transforms.
- Hard cuts must never be treated as PTZ continuation.
- CAY must preserve the existing multi-plan isolation and independent validation requirements.

## Recommended integration shape

Treat this as an **optional calibration backend candidate**, not a new projector. A future prototype should output transform + camera parameters + support landmarks + residuals + confidence + source revision/license provenance into existing CAY contracts. The current fail-closed publication path then decides whether trajectories, heatmaps, distance, speed or sprints are defensible.
