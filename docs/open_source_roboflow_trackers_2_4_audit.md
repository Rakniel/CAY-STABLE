# Open-source audit — Roboflow Trackers 2.4

Date inspected: 2026-09-01

## Source and license
- Project: https://github.com/roboflow/trackers
- Upstream package version observed: 2.4.0.
- License: Apache-2.0.
- Runtime dependencies declared upstream include NumPy, Supervision, SciPy, OpenCV, Rich and Requests.
- Relevant trackers exposed upstream include ByteTrack, BoT-SORT, OC-SORT, SORT, C-BIoU and McByte.
- Upstream documentation recommends ByteTrack as a strong default for variable-confidence detections and BoT-SORT as a lightweight option when camera motion is important.
- Upstream evaluation tooling reports identity-aware MOT metrics including HOTA, IDF1 and MOTA.

## CAY-STABLE use in this change
No upstream implementation code is copied. The mature evaluation and tracker-selection principles are adapted into the existing CAY promotion gate.

`tracking_backend_candidate_registry_v1.js` now records upstream version 2.4.0 and refuses to promote an optional external backend solely because its short-term ID-switch rate improves. A candidate must also preserve or improve persistent player identity on annotated CAY footage containing real occlusions/re-entry opportunities and, when present, camera/segment transitions.

Required validation evidence now includes:
- >= 300 representative annotated frames;
- a strictly lower ID-switch rate than the current baseline;
- >= 3 genuine re-identification opportunities;
- persistent ReID recovery rate not worse than baseline;
- failed re-identification count not worse when both counts are supplied;
- cross-segment recovery not worse when segment-transition opportunities exist;
- completed transitive dependency/license audit.

## What this replaces / work avoided
This extends the existing backend promotion registry instead of creating a second tracker-selection mechanism. It reuses the identity evaluator already integrated into CAY-STABLE and avoids roughly **0.25–0.5 day** of duplicate benchmark/promotion plumbing.

## Expected measurable impact
The change does not claim a runtime accuracy gain by itself. It prevents a misleading upgrade where a tracker reduces short-term ID switches while worsening the club requirement that the same player retain the same identity after occlusion or a camera-plan change. Future ByteTrack/BoT-SORT comparisons are therefore judged on both local tracking quality and persistent player identity.

## Status
- Roboflow Trackers 2.4.0: **studied / optional backend candidate**.
- Apache-2.0 license: **compatible in principle**, subject to transitive dependency/model-weight audit.
- Direct Python runtime import: **not enabled** in the browser-first STABLE build.
- CAY promotion-gate adaptation: **integrated on validation branch**, pending CI before merge.

## Risks / dependencies
The Python/OpenCV/SciPy stack is heavier than the current browser-first runtime. Model weights and any optional detector/ReID dependencies must be licensed separately. A benchmark on synthetic or easy continuous footage is insufficient; promotion requires representative CAY clips with actual occlusions and camera changes.
