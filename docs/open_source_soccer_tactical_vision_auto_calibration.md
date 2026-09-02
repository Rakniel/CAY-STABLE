# Open-source provenance — automatic pitch calibration acceptance

## Upstream reference

- Project: `rafaelsouza-tech/soccer-tactical-vision`
- Audited revision: `4c557534c624948f3bfe3db956859c7ea3b442fa`
- License: MIT (repository license verified at the audited project)
- Relevant upstream area: robust soccer-pitch homography validation on SoccerNet calibration frames.

## Idea adapted in CAY-STABLE

CAY-STABLE keeps its own dependency-free homography engine and does not import the upstream Python, RF-DETR, NumPy, OpenCV, SoccerNet data, model weights or training code.

The useful design insight adapted clean-room is the ground-plane sanity rule used after homography fitting: for broadcast football, the top image corners can legitimately contain stands/sky and are not reliable planar-ground sanity probes. The near-field bottom image corners are therefore the appropriate image-border sanity evidence for a planar pitch homography.

`automatic_pitch_calibration_v1.js` combines that idea with existing CAY-STABLE modules:

1. at least six valid image↔pitch correspondences are required;
2. two spatially distant observations are held out for independent reprojection validation;
3. the remaining observations are fitted by the existing `metric_homography_projector_v1.js` robust consensus implementation;
4. a candidate is accepted only after the independent validation succeeds;
5. only the two bottom image corners are used for broad ground-plane sanity;
6. source keypoint confidence may optionally veto a weak candidate;
7. accepted output is explicitly marked `ACCEPTED_AUTOMATIC`; failure never manufactures a metric projector.

## What this replaces / avoids

This is the first explicit auto-first acceptance layer between pitch keypoint/line detection and the existing metric projector. It avoids adding another homography implementation and prepares the normal user flow to bypass manual calibration when sufficient automatic evidence exists.

Estimated work avoided: roughly 0.5–1 day versus designing and validating a separate camera sanity scheme from scratch.

## Expected measurable impact

- higher automatic-calibration completion on broadcast frames where top corners contain non-ground content;
- fewer false rejections caused by planar projection of stands/sky;
- zero reduction in metric publication safety because two observations remain independent validation evidence and the existing CAY reprojection limits still apply;
- manual calibration remains a fallback only when automatic evidence is insufficient or rejected.

## Risks / dependencies

- No new runtime package dependency.
- No external model or dataset is bundled.
- Actual completion-rate improvement must be measured on C.A. Yenne footage before changing production thresholds.
- The broad bottom-corner margins are a sanity veto, not proof of calibration quality; independent reprojection validation remains mandatory.
