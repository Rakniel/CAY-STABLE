# Roboflow Trackers — MOT benchmark boundary

## Upstream
- Project: `roboflow/trackers`
- Inspected package version: `2.6.0`
- License: Apache-2.0
- Public scope inspected: clean-room SORT / ByteTrack / OC-SORT / BoT-SORT / C-BIoU implementations, tracker evaluation tooling, and public benchmark tables covering MOT17, SportsMOT, SoccerNet and DanceTrack.

## Useful upstream result
The upstream comparison reports default SoccerNet HOTA values of 84.0 for ByteTrack and 84.5 for BoT-SORT. That small gap is a strong reason not to replace CAY-STABLE tracking on architecture reputation alone: CAY needs representative club-video measurements before changing tracker policy.

The upstream evaluation path uses standard multi-object-tracking metrics such as HOTA, IDF1 and MOTA. CAY-STABLE previously had detector/event benchmark helpers but no direct exporter from runtime assignments to a standard MOTChallenge tracker file.

## CAY adaptation
`tracking_motchallenge_export_v1.js` is a clean-room adapter written specifically for CAY-STABLE. No Roboflow Trackers source code is copied and the Python package is not added as a runtime dependency.

The adapter:
- preserves CAY `trackId` as the benchmark identity;
- exports standard 10-column MOTChallenge tracker rows in image pixels;
- accepts existing pixel boxes (`x/y/w/h` or `x1/y1/x2/y2`);
- can reconstruct a box only when explicit normalized width/height are supplied alongside the existing normalized foot anchor;
- rejects rows without a defensible bounding box instead of inventing dimensions;
- preserves CAY identity safety by rejecting explicit bench, spectator, outside-field and yellow-detail-only assignments;
- is benchmark-only and does not change runtime association, ReID, metric publication or the 11-player invariant.

## What this replaces
This replaces future ad-hoc CSV conversion scripts for tracker evaluation. One exporter can feed compatible MOT evaluation tooling and external trackers for apples-to-apples comparisons.

## Expected gain
Estimated plumbing avoided: 0.5–1 day for the first objective tracker benchmark, then near-zero format work for later ByteTrack / BoT-SORT / C-BIoU comparisons.

Expected measurable impact: none on production tracking by itself. The measurable value is decision quality: tracker changes can be accepted only when CAY footage improves identity continuity (HOTA/IDF1 and CAY-specific ID-switch checks) without increasing false CAY detections.

## Dependency and license risk
- New CAY runtime dependency: none.
- Upstream code copied: none.
- Optional future evaluation dependency: `roboflow/trackers` 2.6.0 / Apache-2.0, only if the benchmark runner is deliberately added.
- Dataset licenses remain separate. In particular, benchmark datasets must be audited independently before redistribution or club use.

## Status
Integrated as a benchmark adapter candidate with non-regression tests. Production tracker selection remains unchanged until representative C.A. Yenne footage has been measured.
