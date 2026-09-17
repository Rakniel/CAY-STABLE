# Ayan-OP/Soccer-Analytics — speed/distance window audit (2026-09-17)

## Provenance
- Source: https://github.com/Ayan-OP/Soccer-Analytics
- Audited revision: `3a1da67d523573fec5c109e37fc2bfd2d600eee7`
- Relevant upstream file: `speed_and_distance_estimator/speed_and_distance_estimator.py`
- License: MIT, verified from upstream `LICENSE` (copyright 2024 Ayan Basak).
- Upstream dependencies include Ultralytics/OpenCV/Supervision; their code, models and weights are **not** imported by this audit and retain separate licenses.

## Useful pattern
The upstream estimator does not derive speed from adjacent video frames. It samples a player position over a short fixed frame window, computes displacement over elapsed time, converts m/s to km/h, and accumulates distance from those interval displacements. This is a useful simple baseline because it suppresses some frame-to-frame localisation jitter and makes the time basis explicit.

## CAY-STABLE comparison
CAY-STABLE already has a substantially stricter physical-metric chain (`metric_window_duration_guard_v1.js`, `metric_motion_plausibility_v1.js`, trajectory smoothing/outlier guards, `player_stats_v1.js`, roster metric pipelines and evidence-coupling tests). Therefore importing the upstream implementation would duplicate and weaken existing logic.

The reusable value is instead a **benchmark invariant** for the imminent distance/speed phase: compare CAY's guarded metric output against a simple fixed-window displacement baseline on the exact same validated pitch-coordinate samples and valid duration. Large disagreement is a diagnostic signal for calibration drift, timestamp errors, smoothing bias or rejected-gap handling; it is never grounds to publish the simpler estimate.

## CAY adaptation / safety rules
- Use actual timestamps/durations; never assume upstream's fixed 24 fps.
- Only compare samples already accepted by CAY calibration, pitch bounds, identity/roster, bench/spectator, camera-segment and motion-plausibility guards.
- Never bridge a rejected interval, missing timestamp, substitution/identity discontinuity or camera-plan cut.
- Preserve CAY coverage accounting; rejected time contributes zero metres and is reported as unavailable coverage, not interpolated distance.
- Speed/distance remain `INDISPONIBLE` whenever the existing publication/evidence gates reject them.
- No upstream runtime source is copied; this is an independently described validation baseline.

## Expected benefit
Estimated 0.25–0.75 day of benchmark design/debugging avoided. Expected measurable impact is earlier detection of unit/timebase/calibration regressions before distance and speed are exposed in player cards. Candidate comparison metrics: absolute/relative distance delta per player, median/p95 speed delta, valid-duration parity and number of intervals rejected by CAY but accepted by the naive baseline.

## Status
**Studied / benchmark idea adapted / runtime not integrated.** No external dependency, model, dataset or weight added.
