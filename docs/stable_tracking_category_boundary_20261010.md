# STABLE — category boundary for persistent CAY tracks (2026-10-10)

## Why this change
The existing bridge normalized every category other than `goalkeeper` to `team`. This could turn `opponent`, `review`, `ball` or a missing category into a persistent CAY player ID when the bridge was called outside the main UI prefilter.

## Change
- Extended existing `stable_tracking_bridge_v1.js` (no parallel filter).
- `normalizeDetection` now rejects categories other than `team` and `goalkeeper`.
- `detectionEligibility` rejects those categories with auditable reason `non_cay_category`.
- Extended existing `tests/stable_tracking_bridge_nonregression.js`; no dependency added.
- The existing independent bench/spectator/yellow-detail guards remain in place.

## Reproducible synthetic validation
- Baseline: 4/4 unsupported categories normalized; 6/6 mixed detections assigned.
- Patched: 0/4 unsupported categories normalized; 2/6 mixed detections assigned (only team + goalkeeper).
- Original bridge regression and new assertions: 5/5 repeated in-memory executions passed; 11-player cap preserved.
- A synthetic 200,000-call microbenchmark is not a representative video-performance test. No runtime speed claim.
- Full CI and representative C.A. Yenne match videos still required.

## Open-source review (no external code imported)
| Project | Version/reference | License | CAY status | Dependency/risk |
|---|---|---|---|---|
| Roboflow Trackers | PyPI 2.6.1 (2026-09-25), https://github.com/roboflow/trackers | Apache-2.0 | Studied; offline ByteTrack/BoT-SORT comparator only | Python >=3.10; detector/model/data licenses separately |
| OpenCV | 4.5.0+ license boundary, https://opencv.org/license/ | Apache-2.0 | Studied; offline homography/GMC candidate | Python/native runtime; no mandatory browser dependency |
| SoccerNet sn-gamestate | upstream repository https://github.com/SoccerNet/sn-gamestate | GPL-3.0 | Rejected for direct code integration without GPL acceptance | Dataset/model terms separate |

The new CAY code is an extension of the existing project module, not copied from these sources. No new external component is bundled or modified. Reusing the existing category/eligibility path avoids a separate parallel classifier (rough engineering estimate 0.5–1 day; not measured). The change does not prove absence of all team-classification errors or readiness of physical metrics.
