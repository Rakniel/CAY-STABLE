# MOTChallenge / TrackLab interchange — indexed temporal query

Date: 2026-10-08. Status: integrated on review branch; **not merged into main/STABLE**.

## Upstream and license boundary

- TrackingLaboratory/tracklab — MIT; audited revision `5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2` (TrackLab 1.3.24). https://github.com/TrackingLaboratory/tracklab
- FoundationVision/ByteTrack — MIT; MOTChallenge-compatible export concept only. https://github.com/FoundationVision/ByteTrack
- NirAharon/BoT-SORT — MIT; MOTChallenge-compatible export concept only. https://github.com/NirAharon/BoT-SORT
- roboflow/trackers — Apache-2.0, release 2.6.1 (2026-09-25), candidate for an **optional offline** tracker. https://github.com/roboflow/trackers

No upstream source code, model weights, Python package, or extra runtime dependency has been copied/imported. CAY's own `motchallenge_tracking_artifact_adapter_v1.js` remains the single ingestion boundary. Future offline producer/model weights must be audited independently, including their exact license and revision.

## Local modification and what it replaces

The existing per-query O(n) linear scan of all video frames in `detectionsAt` is replaced with O(log n) binary search of sorted frame timestamps plus comparison of the two neighbors. The earlier frame still wins a midpoint tie; freshness and 11-player fail-closed guards are unchanged. Null/blank/non-numeric timestamps now explicitly return `TRACKING_TIME_INVALID` instead of accidentally matching frame zero.

This improves the existing adapter instead of duplicating a TrackLab/ByteTrack/BoT-SORT importer. It does not improve detection, IDF1, HOTA, or metric accuracy by itself.

## Synthetic performance and checks

On the isolated JavaScript runner: 25,000 frames, 1,500 temporal queries, baseline ~2,800 ms, indexed <10 ms (>280x on this run); 2,500 valid-query comparisons had identical outputs. Results are environment-specific; no claim of real-video speedup or end-to-end STABLE readiness.

Tests: `tests/motchallenge_tracking_artifact_temporal_query_nonregression.js`, existing MOT artifact and embedding tests. Test coverage includes midpoint ties, freshness, invalid timestamps, 11-player cap, no implicit team assignment and long recordings.

## Risks / next step

The binary search relies on the timestamp ordering guaranteed by `createArtifact`; do not pass arbitrary unsorted `frames` objects as trusted artifacts. Validate an actual C.A. Yenne recording, compare an external tracker against the browser tracker, and keep distance/speed/sprints `INDISPONIBLE` without metric calibration evidence.
