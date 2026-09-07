# Semantic calibration test harness — OSS reuse note (2026-09-07)

## Sources and licences
- `roboflow/sports` — MIT. Existing CAY adaptation: 32 semantic football-pitch landmark topology and keypoint-to-homography workflow.
- `rafaelsouza-tech/soccer-tactical-vision` — MIT. Existing CAY adaptation: separate landmark observation, validated homography and temporal calibration stages.
- OpenCV robust-homography principle — Apache-2.0, already adapted in `metric_homography_projector_v1.js`; no OpenCV source code or dependency copied.

## Change in this integration
`CAY_CALIBRATION_TEST.html` previously contained an independent linear solver and an independent homography implementation. That duplicated the production metric path and could report a calibration that STABLE itself would later reject.

The harness now only collects semantic landmark observations from a real video frame and delegates the verdict to `pitch_semantic_calibration_v2.js`, which in turn uses `automatic_pitch_calibration_v1.js` and `metric_homography_projector_v1.js`.

No upstream code, model weights, datasets or third-party runtime dependency were added. The C.A. Yenne red/black interface remains local.

## Expected gain
- Removes one divergent calibration implementation.
- Avoids roughly 0.5–1 day of maintaining/debugging two homography paths.
- Manual test and production now share the same >=6-landmark evidence floor, geometric-support gate, independent validation points, robust consensus, reprojection thresholds and fail-closed `INDISPONIBLE` policy.

## Risks
Manual landmark placement can still be inaccurate. The production validation gates remain authoritative; the harness never converts a rejected calibration into a metric result.
