# Open-source audit — metric foot-point projection

Date inspected: 2026-09-07

## Reference project
- Project: BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline
- Revision inspected: `9876ed6509cc3c6f8dc5241c53d6079d50ac60b9`
- Project license: MIT (repository commit explicitly adds the MIT project license)
- Relevant design: tracked people/referees are projected to the pitch from the **bottom-center** of the image bounding box (foot point), while the ball is projected from the **box center**. The project also uses guarded homography / camera-motion logic before distance and speed analytics.

## CAY-STABLE reuse boundary
No MatchVision source code, model, weights, dataset, configuration or assets are copied.

CAY-STABLE adapts only the geometric convention to its existing MOT/TrackLab artifact adapter:
- team / goalkeeper / opponent / referee / unknown person-like detections: `bbox_bottom_center`;
- ball: `bbox_center`;
- anchor convention is explicit in each track/detection and in artifact policy metadata.

This replaces the previous generic bbox-center anchor for player tracks. That previous convention could project a player's torso rather than ground contact, biasing pitch trajectories under perspective and then contaminating distance, speed and heatmaps.

## Expected impact
- Directly improves the semantic correctness of image→pitch projection before any metric is published.
- The vertical correction equals half a person bbox in image space; the resulting metric correction depends on perspective/homography and must be measured on calibrated real footage.
- No accuracy percentage is claimed until real-video metric validation exists.

## Work avoided
Estimated **0.25–0.5 day** avoided by adopting a mature sports projection convention instead of inventing/tuning a CAY-specific bbox anchor heuristic.

## Risks / dependencies
- Bounding boxes with truncated feet can still produce a biased bottom-center point; downstream pitch-membership / trajectory plausibility guards remain mandatory.
- Ball center is retained separately because a bottom edge is not a ground-contact estimate for a small moving ball.
- This change does not license or import any detector/tracker weights from MatchVision or its dependencies.

## Status
**Integrated on validation branch; merge only after syntax + non-regression CI is green.**
