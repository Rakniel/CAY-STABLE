# Open-source audit — Supervision metric anchor semantics

Date inspected: 2026-09-07

## Source
- Project: `roboflow/supervision`
- Upstream branch inspected: `develop`
- Revision inspected: `826b2bc70ef1d60164b45126cf781b33946cccbf`
- Released documentation family inspected: 0.30.x (latest documented release at inspection: 0.30.2)
- License: MIT
- Relevant upstream API: `Detections.get_anchors_coordinates(Position)` and the explicit `Position` anchor enum (`CENTER`, `BOTTOM_CENTER`, etc.).

## Legal boundary
CAY-STABLE does **not** copy Supervision Python source, models, weights, datasets or package code in this change. The upstream design concept is adapted clean-room in JavaScript: a tracked point used for physical pitch metrics carries an explicit semantic anchor, and the metric pipeline can reject an anchor that is geometrically inappropriate for the tracked role.

No Supervision runtime dependency is introduced. No model/weight license is inherited by this change.

## CAY-STABLE adaptation
New runtime: `metric_anchor_evidence_guard_v1.js`.

Policy:
- external person observations (`sourceTrackId` present) require an explicit ground-contact-compatible anchor such as `bbox_bottom_center`, `foot_point`, `ground_contact`, `pose_ankle_midpoint` or `mask_bottom_center`;
- external ball observations require a center-compatible anchor;
- explicit incompatible anchors fail closed for pitch heatmaps and physical metrics;
- an external observation with a missing `anchorKind` fails closed;
- legacy internal observations without external `sourceTrackId` remain backward compatible and are reported as `LEGACY_ANCHOR_UNSPECIFIED` rather than silently relabelled;
- existing projection, calibration-confidence, gap, raw-spike, smoothing and publication guards remain unchanged and are reused rather than duplicated.

The guard wraps existing projectors before calling the already-established CAY metric/heatmap implementations. Therefore rejected anchor evidence naturally reduces metric coverage instead of creating a parallel distance/speed implementation.

## What this replaces / work avoided
This replaces ad-hoc implicit interpretation of `{x,y}` when an external tracker feeds CAY-STABLE. It also avoids implementing per-backend anchor rules for MOTChallenge, TrackLab, ByteTrack, BoT-SORT or future native/offline providers.

Estimated avoided work: **0.5–1 day per additional external tracking backend**, plus reduced debugging risk for systematic metric bias caused by torso/box-center projection.

## Expected measurable impact
- Explicitly wrong external person anchors can no longer contribute to pitch heatmaps, distance, speed or sprint evidence.
- Existing MOT adapter output using `bbox_bottom_center` remains eligible.
- Anchor acceptance/rejection coverage becomes auditable in metric results.
- No numerical accuracy improvement is claimed until compared on real calibrated footage with reference trajectories.

## Risks / dependencies
- `bbox_bottom_center` is still only an approximation of foot contact when boxes are truncated or loose.
- More precise future anchors (pose ankles, mask/OBB ground contact) may improve geometry, but their detector/model and weights require separate provenance and license audits.
- Legacy internal points remain accepted without explicit anchor metadata for compatibility; their unspecified anchor status is exposed rather than upgraded to a false certainty.

## Status
Integrated on feature branch; promotion to `main` requires syntax, STABLE integration and calibration/non-regression CI to pass.
