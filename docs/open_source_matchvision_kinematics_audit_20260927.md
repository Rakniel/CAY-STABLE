# MatchVision AI kinematics audit — 2026-09-27

## Provenance
- Project: `BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline`
- Source: https://github.com/BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline
- Audited revision: `9876ed6509cc3c6f8dc5241c53d6079d50ac60b9`
- Repository license: MIT; upstream `LICENSE` copyright 2026 BlazeWild.
- Code copied into CAY-STABLE: none. The implementation below is a clean-room adaptation of generic metric-kinematics ideas already compatible with CAY's own metric trajectory contracts.

## Useful pattern
The upstream pipeline projects player foot points into pitch metres, accumulates distance only from accepted metric transitions, reports instantaneous/average/maximum speed, and rejects physically implausible jumps. It also keeps calibration/flow diagnostics visible instead of presenting all projected frames as equally trustworthy.

This is useful for CAY-STABLE because the existing `metric_pitch_heatmap_v1.js` already emits fail-closed, segment-aware, calibrated `PITCH_METERS` trajectory runs with coverage and calibration-confidence evidence. We therefore do not import the upstream Python/PyTorch/Ultralytics/PnLCalib runtime. We extend the existing CAY trajectory evidence instead.

## Local adaptation
- `metric_player_kinematics_v1.js` consumes only CAY metric trajectory runs.
- Distance and speed are computed only across same-run timed transitions accepted by the existing `metric_motion_plausibility_v1.js` guard.
- Gaps are not interpolated.
- Raw physical spikes are rejected rather than clamped into plausible values.
- Coverage and calibration confidence must pass explicit thresholds or every physical metric is `INDISPONIBLE`.
- Sprint intervals are contiguous above a configurable threshold and must satisfy a minimum duration. No missing interval is silently bridged.
- Output carries coverage/confidence/defendable-score evidence so UI publication can remain fail-closed.

## What this replaces / avoids
It avoids creating a separate Python analytics pipeline or duplicating homography/tracking logic merely to obtain distance/speed/sprint statistics. The module extends CAY's already validated metric trajectory evidence.

Estimated work avoided: about 0.5–1.5 engineering days versus designing another physical-metrics path and its failure policy from scratch.

## Expected impact
Immediate deterministic distance, average/max speed and sprint primitives become testable from already-calibrated CAY trajectories. This does **not** claim field accuracy until representative C.A. Yenne footage is benchmarked. The measurable acceptance targets remain: zero metric publication without sufficient calibration/coverage evidence, zero interpolation across cuts/gaps, and zero accumulation of transitions above the existing raw-spike plausibility threshold.

## License/dependency boundaries
The upstream repository's MIT license covers its repository code, but not arbitrary third-party weights, datasets, Ultralytics licensing, or the vendored PnLCalib subtree. None of those are imported by this CAY adaptation. If any upstream source code is copied later, the MIT copyright/permission notice must be preserved for that substantial portion and each transitive dependency/model must be audited separately.

## Status
`integrated as clean-room design adaptation / no upstream code copied / zero new runtime dependency`.
