# Open-source audit — metric anchor provenance

Date inspected: 2026-09-07

## MatchVision
- Source: `BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline`
- Revision already audited by CAY-STABLE: `9876ed6509cc3c6f8dc5241c53d6079d50ac60b9`.
- License: MIT.
- Relevant design already adapted in CAY-STABLE: person-like detections use bounding-box bottom-center for pitch projection while the ball uses bounding-box center.
- This change copies no MatchVision source code, models, weights, datasets or assets. It only preserves CAY-STABLE's own `anchorKind` metadata after that convention has been applied by the MOT artifact adapter.

## SportsLabKit
- Source: `AtomScott/SportsLabKit`.
- Repository metadata inspected on 2026-09-07.
- License: GPL-3.0.
- Relevant concepts: sports tracking records separated from pitch-coordinate / calibration representations.
- CAY-STABLE status: **rejected for code reuse** under the current permissive-component policy. No SportsLabKit source code, model, asset or configuration is copied or imported. Conceptual comparison only.

## Local adaptation
`tracking_core_v1.js` previously reduced each accepted detection to `{x,y,time,segment}`. This silently discarded the metric-anchor provenance supplied by `motchallenge_tracking_artifact_adapter_v1.js`.

The tracking core now carries forward only a small allow-listed provenance set when present:
- `anchorKind` — e.g. `bbox_bottom_center`;
- `sourceTrackId` — external tracker identifier for audit/debugging;
- `detectionScore` — normalized source detection confidence.

Legacy detections remain compatible and no anchor kind is invented when the upstream detector/tracker did not provide one.

## What this replaces / work avoided
This removes a hidden metadata break between external MOT/TrackLab-style artifacts and CAY metric trajectories. It avoids implementing a parallel metric-tracking path merely to preserve geometric semantics.

Estimated avoided debugging/plumbing work: **0.25–0.5 day**, with larger downstream value because distance/speed/heatmap investigations can now verify the image anchor used for every stored observation.

## Expected measurable impact
- No direct accuracy percentage is claimed from metadata preservation alone.
- Metric outputs can now be audited against the exact per-observation anchor convention.
- Future validation can stratify distance/speed errors by anchor type instead of treating every image point as semantically identical.

## Risks / dependencies
- Preserving `anchorKind` does not make an incorrect bounding box correct; truncated feet or poor detections can still bias the anchor.
- Metric publication remains governed by existing calibration, coverage, trajectory and plausibility guards.
- GPL-3.0 SportsLabKit remains reference-only unless project licensing policy changes explicitly.
