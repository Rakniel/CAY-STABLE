# Open-source audit — Roboflow Supervision speed estimation

Date inspected: 2026-09-01

## Source
- Project: Roboflow Supervision
- Repository: https://github.com/roboflow/supervision
- Inspected file: `examples/speed_estimation/yolo_nas_example.py`
- Inspected blob: `b64a3eebb2e7f9c661fedc3fb6d52227cff7f93e`
- License: MIT for Supervision analytics/examples. The example also demonstrates third-party model dependencies; CAY-STABLE does **not** import those detector/model dependencies here.

## Useful upstream pattern
The example does not display a speed as soon as two observations exist. It keeps a temporal history per tracker and waits until enough history is available before presenting speed. It also performs the calculation after perspective transformation into a metric target space.

## CAY-STABLE adaptation
No upstream code was copied. CAY-STABLE already had validated pitch-metre projection, local trajectory smoothing, calibration-confidence weighting and hard rejection of implausible speeds. This change extends the existing `metric_publication_guard_v1.js` instead of creating another speed implementation.

The publication guard now additionally requires:
- at least 3 seconds of **continuous** valid speed evidence;
- successive speed evidence gaps <= 1 second;
- identical metric/camera segment across the continuous evidence run;
- existing defendable score >= 0.80 and existing minimum metric coverage/duration gates.

A camera-plan / metric-segment transition therefore breaks the speed evidence window instead of allowing scattered observations to accumulate into a misleading publishable distance/speed/sprint result.

## What this replaces / work avoided
This reuses the mature temporal-window principle rather than adding a separate bespoke speed estimator or duplicating the existing metric engine. Estimated design/plumbing avoided: **0.25–0.5 day**.

## Expected measurable impact
- Fewer false `FIABLE` physical-stat publications when metric evidence is fragmented across camera cuts or long gaps.
- Existing partial/raw diagnostic values remain auditable, but published distance, average/max speed and sprint count become `INDISPONIBLE` when continuity is insufficient.
- No new Python, OpenCV, GPU or model dependency is added to the browser-first STABLE runtime.

## Risks / limits
- The 3-second continuity threshold is a conservative CAY product gate, not an official Supervision threshold.
- This does not improve detector/tracker accuracy by itself; it improves the defensibility of published physical metrics.
- Real C.A. Yenne footage is still required to tune the threshold against actual camera cadence and validated calibration coverage.
