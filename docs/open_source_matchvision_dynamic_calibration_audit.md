# Open-source audit — MatchVision dynamic calibration strategy

Date inspected: 2026-09-01

## Source
- Project: `BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline`
- Upstream commit inspected: `9876ed6509cc3c6f8dc5241c53d6079d50ac60b9`
- Project license: MIT.
- License file independently verified in the upstream repository.
- Important upstream boundary: the repository vendors PnLCalib separately and explicitly states that vendored PnLCalib remains under its own upstream license. CAY-STABLE does **not** copy or import PnLCalib code.

## Useful architecture found
The upstream football pipeline documents a practical failure mode that matters directly to CAY-STABLE: long-running cumulative optical-flow calibration can drift badly. Its production architecture therefore refreshes absolute pitch calibration periodically and permits optical-flow propagation only over short guarded intervals.

The upstream README gives a concrete example where cumulative optical flow reached 43.29 px pitch-line error while a fresh absolute calibration on the same frame reduced the error to 9.07 px. CAY-STABLE treats this as an architecture/validation insight only; no upstream implementation code is copied.

## CAY-STABLE adaptation
Local file modified: `metric_segment_registry_v1.js`.

Original clean-room CAY behavior added:
- a segment can now be explicitly marked `dynamicCamera`;
- validated calibration keyframes are stored with timestamp, confidence, source and kind;
- metric projection on a dynamic segment uses only the nearest validated calibration keyframe;
- a strict maximum calibration age is enforced (`0.35 s` default, configurable);
- when no validated calibration is fresh enough, the projector returns `null`, which propagates naturally to `INDISPONIBLE` physical metrics through the existing player-statistics guards;
- invalid calibration refreshes are rejected and never restore metric availability;
- segment invalidation clears temporal calibration evidence;
- static-camera behavior remains backward compatible and does not receive an arbitrary expiry.

No homography interpolation is invented. No stale calibration is silently stretched through a long pan. This is intentionally conservative until a validated optical-flow/ECC propagation backend exists.

## What this replaces / work avoided
This extends the existing metric-segment registry rather than creating a separate camera-calibration service or a parallel metric pipeline. Estimated avoided architecture/plumbing work: **0.5–1 day**.

## Expected measurable impact
- Prevents stale same-segment homographies from silently producing defensible-looking but wrong distance/speed/heatmap values during camera motion once the segment is marked dynamic.
- Makes calibration freshness explicit and testable.
- Creates a legal, dependency-free contract that a future OpenCV/optical-flow propagator can feed without changing player-statistics code.

No claim is made that runtime accuracy improves until representative C.A. Yenne footage supplies real calibration refreshes and the before/after metric coverage/error is measured.

## Dependencies and risks
- Zero new runtime dependency.
- No PnLCalib code, weights or GPL component imported.
- The current change is a freshness guard and keyframe contract, not an automatic optical-flow implementation.
- If a moving-camera segment is marked dynamic but keyframes are too sparse, metric coverage will intentionally fall and may become `INDISPONIBLE`; this is safer than publishing stale metres/km/h.
