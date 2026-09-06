# Calibration holdout selection — open-source provenance

## Source inspected
- Project: `rafaelsouza-tech/soccer-tactical-vision`
- Revision: `4c557534c624948f3bfe3db956859c7ea3b442fa`
- License: MIT
- Relevant upstream behavior: football pitch keypoints are filtered, fitted with robust homography estimation, then accepted only after explicit geometric/reprojection sanity checks. The project also documents that real broadcast frames can be rejected by overly naive sanity rules even when usable ground-plane evidence exists.

## CAY-STABLE adaptation
No upstream code, model weights or dataset are copied.

CAY-STABLE already required six correspondences so that four points could fit a homography and two could remain independent validation evidence. The previous split always held out the farthest image-space pair. That heuristic can accidentally remove the two anchors carrying most of the 2D geometric support and leave a degenerate or nearly collinear fit set.

`automatic_pitch_calibration_v1.js` now evaluates all possible two-point holdouts and selects the pair that primarily maximizes the geometric support retained by the fit set, with a smaller preference for keeping the two validation points spatially separated. The final homography, independent validation, bottom-corner sanity check, source-confidence gate and fail-closed `INDISPONIBLE` behavior are unchanged.

## Replaced behavior
- Before: validation pair = farthest pair in image coordinates.
- After: validation pair = best balance of retained image/pitch convex-hull support (85%) and validation-pair spread (15%).
- Fallback: legacy farthest-pair selection only when geometric scoring cannot be computed.

## Measured regression case
A six-point identity calibration was added where the two farthest points are the only diagonal anchors and the four remaining points are collinear. The previous split produces a degenerate four-point fit. The new split preserves essentially 100% of the available fit support and the same six observations produce an independently validated calibration.

## Expected impact
- fewer false automatic-calibration failures on partially visible broadcast plans;
- less manual intervention when six or more reliable field landmarks are visible;
- no relaxation of reprojection, pitch-boundary or metric publication thresholds;
- no new runtime dependency.

Estimated implementation/design work avoided through the upstream validation architecture reference: ~0.25–0.5 day.

## Risks
The heuristic is deterministic rather than a learned camera model. It can improve which observations are reserved for validation, but it cannot recover a frame with genuinely insufficient field geometry. Those frames remain rejected and require another keyframe or manual calibration.
