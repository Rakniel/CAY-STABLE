# RUN92 — strict imported MOT evidence (2026-10-19)

Scope: extend the existing `motchallenge_tracking_artifact_adapter_v1.js` rather than creating a second tracking importer.

## Reproduced defect
On a synthetic input containing five invalid detections (one entirely outside the frame; four with out-of-range, nonfinite or boolean scores), the old adapter accepted **5/5**. The same importer also accepted infinite image dimensions and FPS. These cases could generate misleading player anchors at image edges or falsely high detector confidence.

## Change
- Reject detections whose bounding box is wholly outside the video frame; preserve partly visible players.
- Reject invalid score types and scores outside [0,1], instead of clamping or silently replacing them with 1.
- Require finite positive width, height and FPS.
- Preserve the existing 11-CAY-on-field cap, unknown-class default, no team inference, provenance/weights license checks and metric evidence policy.
- No model, tracker, third-party source code, data or weights added.

## Tests
`node tests/mot_tracking_artifact_strict_inputs_run92.js`; `node tests/motchallenge_tracking_artifact_nonregression.js`; syntax check `node --check motchallenge_tracking_artifact_adapter_v1.js`. Existing repository CI must also pass before this change is considered integrated. Synthetic tests do not prove real-match detection quality.

## Open source provenance
This is original CAY adapter code. MOTChallenge is an interchange format, not imported source code. Upstream tracker options already documented in `OPEN_SOURCE_COMPONENTS.md` (ByteTrack MIT; BoT-SORT MIT; Roboflow Trackers Apache-2.0) remain optional and **not imported** by RUN92. Future external MOT artifacts still require explicit tracker **and model weights** source, license and revision. Unlicensed/AGPL/GPL artifacts remain blocked by the current adapter policy.
