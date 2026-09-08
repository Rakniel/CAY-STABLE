# OSS audit — TrackEval tracking benchmark export — 2026-09-08

## Source audited
- Project: `JonathonLuiten/TrackEval`
- Repository: https://github.com/JonathonLuiten/TrackEval
- Revision inspected: `12c8791b303e0a0b50f753af204249e622d0281a`
- License: MIT
- Upstream role: official/reference evaluation implementation for multi-object tracking metrics including HOTA/DetA/AssA and Identity metrics IDF1/IDP/IDR, with MOTChallenge support.

## CAY-STABLE decision
CAY-STABLE does **not** reimplement HOTA or IDF1 and does not vendor TrackEval into the browser runtime. Instead, `tracking_trackeval_export_v1.js` provides a small clean-room MOTChallenge interchange seam so CAY tracking outputs can be evaluated externally by the official mature evaluator.

No TrackEval Python source, metric implementation, dataset, benchmark data or dependency is copied into CAY-STABLE.

## Local adaptation
The exporter consumes frame-level assignments already returned by the CAY tracking core/runtime. Each assignment must carry:
- the persistent CAY `trackId`;
- an explicit source detection `bboxPx`;
- a CAY player category (`team` or `goalkeeper`);
- optional detection confidence.

It produces standard 10-column MOTChallenge tracker rows:
`frame,id,left,top,width,height,confidence,-1,-1,-1`.

The exporter is deliberately fail-closed:
- it never synthesizes a box from a point trajectory;
- complete bbox evidence is required by default;
- more than 11 simultaneous CAY player assignments makes the frame unavailable;
- ball/opponent/referee records are not silently mixed into the CAY-player benchmark;
- partial export exists only as an explicit diagnostic option and reports bbox-evidence coverage.

## What this replaces / work avoided
Without this seam, CAY would need either a bespoke HOTA/IDF1 implementation or one-off conversion scripts for every tracker experiment. The shared MOTChallenge boundary lets ByteTrack, BoT-SORT, TrackLab and the current CAY association layer be compared with one established evaluator.

Estimated engineering work avoided: **1–2 days** for a home-grown tracking evaluator plus roughly **0.25–0.5 day per tracker experiment** of bespoke conversion/metric plumbing.

## Expected measurable impact
This change does not claim an accuracy improvement by itself. It creates the measurement path needed before changing tracking/ReID policy:
- HOTA / DetA / AssA can quantify detection-vs-association trade-offs;
- IDF1 / IDP / IDR can quantify persistent identity quality;
- future ByteTrack/BoT-SORT/ReID changes can be compared before/after on the same annotated C.A. Yenne clips;
- a change that improves raw detections but worsens identity persistence can be rejected before merge/promotion.

## Dependencies / risks
- TrackEval remains an **external/offline benchmark dependency**, not a STABLE browser dependency.
- A meaningful HOTA/IDF1 number still requires synchronized ground-truth bounding boxes and identity annotations for representative C.A. Yenne footage.
- The exporter can only benchmark observations whose original bbox survives in the frame assignment snapshot. It intentionally reports `INDISPONIBLE` rather than reconstructing missing geometry.
- Dataset/annotation licensing is separate from TrackEval's MIT license and must be documented for any benchmark set used.

## Status
Integrated on validation branch. Merge only after CAY JavaScript syntax, STABLE integration/non-regression and calibration V2 guards are green.
