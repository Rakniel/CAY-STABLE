# Roboflow Trackers — tentative track confirmation adaptation

- Upstream project: `roboflow/trackers`
- Upstream URL: https://github.com/roboflow/trackers
- Upstream capability inspected: ByteTrack `minimum_consecutive_frames` / tentative-track activation policy
- Upstream version context: `trackers` 2.4.0 was the current packaged version explicitly visible during the 2026-08 review; repository documentation was also inspected on 2026-08-28.
- License: Apache License 2.0
- Code reuse status: **no upstream source code copied** into CAY-STABLE. The behavioral idea is independently adapted to the existing browser JavaScript tracker.

## Why this is useful for CAY-STABLE

Roboflow Trackers documents `minimum_consecutive_frames` as the number of consecutive detections required before a new ByteTrack track is confirmed, with 2–3 frames recommended to remove single-frame false positives. That directly addresses CAY-STABLE's strict requirement not to turn a transient CAY-like/yellow-detail detection, spectator artefact or detector glitch into an immediately visible player identity.

## CAY-STABLE adaptation

Local file: `tracking_two_stage_adapter_v1.js`.

1. The existing two-stage ByteTrack-style association remains the only tracking path; no duplicate tracker is introduced.
2. A new high-confidence candidate is kept internally as **tentative** so it can be matched on the next processed frame, but its ID is not exposed to trajectories, cards or stats yet.
3. Default confirmation requires **2 consecutive strong detections**.
4. A miss or weak-only recovery before confirmation resets the strong-evidence streak.
5. Once confirmed, the identity remains confirmed through normal low-confidence recovery/occlusion handling.
6. Established identities remain compatible with the existing ReID and manual-merge guards.
7. `minimumConsecutiveFrames: 1` remains an explicit diagnostic/legacy override.
8. Tentative tracks still consume an internal on-field slot, so a transient candidate cannot be used to silently exceed the 11-player invariant.

## Validation

Targeted test: `tests/tentative_identity_confirmation_nonregression.js`.

Covered cases:
- one-frame high-confidence false positive is suppressed;
- two consecutive strong detections expose exactly one stable ID;
- an observation gap resets tentative confirmation;
- explicit one-frame override remains possible for controlled diagnostics.

## Dependency and license impact

No new runtime dependency, Python package, model weight or external service is added. Apache-2.0 is compatible with CAY-STABLE's reuse policy. Provenance is recorded here even though the implementation is a clean adaptation rather than copied upstream code.
