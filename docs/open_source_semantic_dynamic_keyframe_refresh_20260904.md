# OSS audit — semantic dynamic calibration keyframe refresh (2026-09-04)

## Why this change

CAY-STABLE already had a strict per-segment metric calibration registry and temporal projection between trustworthy calibration keyframes. The missing integration point was accepting a projector that had already passed the semantic pitch-keypoint validation pipeline as a new keyframe without rebuilding a second calibration path or weakening the existing validation boundary.

## References audited

### rafaelsouza-tech/soccer-tactical-vision
- Revision audited: `4c557534c624948f3bfe3db956859c7ea3b442fa`
- License: MIT
- Relevant mature idea: separate semantic field registration, validation and projection; refresh trustworthy calibration estimates over time rather than treating a moving broadcast camera as one static homography.
- Code copied into CAY-STABLE: **none**.
- Adaptation in CAY-STABLE: a separately validated projector can now be registered as a timestamped keyframe in the existing `metric_segment_registry_v1.js` temporal projector.

### MM4SPA/tvcalib
- Revision audited: `1222c5230af2742395d74918ed6f34eb2b9bf7f9`
- License: MIT
- Relevant mature idea: calibration is a camera/geometry estimate that must be evaluated and refreshed as the view changes; metric publication must remain tied to a valid calibration state.
- Code copied into CAY-STABLE: **none**.
- Adaptation in CAY-STABLE: prevalidated keyframes retain explicit confidence and exact timestamps, and only keyframes with confidence >= `0.5` can support metric publication.

## CAY-STABLE implementation

Changed component: `metric_segment_registry_v1.js` `1.3.1 -> 1.4.0`.

New API: `registerValidatedKeyframe(segment, time, projector, options)`.

The API:
- requires an existing exact segment;
- requires `validated === true`, a projection function and an explicit confidence in `[0,1]`;
- converts the previous static calibration into an absolute anchor when its timestamp is known;
- inserts/replaces the refresh by exact timestamp;
- reuses the existing temporal interpolation and freshness policy instead of implementing a second smoother;
- keeps validated-but-weak keyframes as diagnostic evidence while excluding them from the metric temporal projector;
- keeps segment invalidation fail-closed.

`addCalibrationKeyframe` now delegates storage/temporal-state mutation to the same new function after creating and validating its homography. This removes duplicated keyframe mutation logic.

## Tests and expected gain

Added `tests/metric_prevalidated_dynamic_keyframe_nonregression.js` covering:
- static anchor -> validated semantic refresh;
- output-space interpolation between two trustworthy keyframes;
- stale-calibration rejection;
- confidence `0.49` exclusion without trajectory pull;
- rejection of a malformed projector without registry mutation;
- immediate publication stop after segment invalidation.

Estimated engineering work avoided: **0.5–1 day** versus creating a parallel semantic-calibration timeline and duplicating interpolation/freshness logic.

Expected measurable impact once a legal keypoint backend feeds accepted semantic projectors: more frames can retain defendable pitch coordinates under pan/zoom while stale or weak calibration remains `INDISPONIBLE`.

## License/dependency boundary

No upstream source code, model weights or runtime dependency were added. The implementation is CAY-specific and clean-room. Model-weight licensing remains a separate gate: permissive repository code does not imply permissive weights.
