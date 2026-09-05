# ByteTrack motion prior adaptation for ball candidate continuity — 2026-09-06

## Source and license
- Upstream: `FoundationVision/ByteTrack`
- Upstream revision inspected: `d1bf0191adff59bc8fcfeaa0b33d3d1642552a99`
- Relevant upstream file inspected: `yolox/tracker/kalman_filter.py`
- License: MIT (declared by the upstream repository)
- Upstream principle: predict the next state under a constant-velocity motion model before association.

## CAY-STABLE adaptation
No ByteTrack source code, model weights, Python package or SciPy dependency is copied or imported.

`ball_candidate_continuity_v1.js` already kept a short observed-ball history but ranked candidates mainly against the recent centroid. That centroid necessarily lags a ball moving in one direction and can favor a high-confidence false candidate left near old positions.

CAY now derives a browser-native constant-velocity anchor from the two latest same-space, timestamped observations. The prediction is used only inside the existing observation-gap and segment continuity window. The existing recent-centroid distance remains available as a conservative admission fallback and for diagnostics; camera/segment changes and long blackouts still reset the prior.

New audit fields on a selected candidate:
- `motionAnchor`: `constant_velocity_prediction`, `recent_centroid`, or `none`
- `distanceToMotionAnchor`
- `distanceToRecentCentroid` remains exposed

## What this replaces
It extends the existing CAY ball continuity selector; it does not add a second tracker or event engine. The motion-aware anchor replaces centroid-only ranking when enough safe temporal evidence exists.

## Validation and measured effect
`tests/ball_candidate_continuity_nonregression.js` adds a controlled linear-motion case: observations at 0 m, 2 m and 4 m are followed by a true 6 m ball candidate at confidence 0.72 and a centroid-near distractor at 2.4 m with confidence 0.99. The new motion anchor selects the true moving ball and exposes a near-zero prediction residual, whereas centroid-only ranking is biased toward the stale distractor.

Existing tests continue to cover continuity breaks, long observation blackouts, segment changes, confidence rejection and image-space operation.

Estimated engineering work avoided: 0.25–0.75 day versus introducing a separate Kalman dependency or a second ball tracker.

## Risks / constraints
- A sudden ball direction change can make a constant-velocity prediction temporarily wrong. To limit this, prediction is short-lived, segment-scoped and gap-bounded, and the existing centroid remains an admission fallback.
- This is a candidate-selection prior, not proof of possession/pass/shot. Downstream event evidence and coverage gates remain unchanged.
- No physical metric is inferred from this predictor alone.

Status: **integrated on feature branch, pending full CI before merge**.
