# Open-source provenance — automatic pitch calibration acceptance

## Upstream reference

- Project: `rafaelsouza-tech/soccer-tactical-vision`
- Audited revision: `4c557534c624948f3bfe3db956859c7ea3b442fa`
- License: MIT (repository license verified at the audited project)
- Relevant upstream areas: SoccerNet-derived pitch-keypoint dataset generation, RF-DETR keypoint workflow, robust soccer-pitch homography validation and calibration metrics.

## Current upstream benchmark evidence

At the audited revision, the upstream project reports a real SoccerNet calibration validation benchmark for its fine-tuned pitch-keypoint approach. The reported numbers show that a learned semantic-keypoint model followed by planar homography already provides useful ground-plane calibration coverage, while close-up and behind-goal views remain key failure cases. CAY-STABLE treats those numbers only as upstream evidence: they are not claimed as C.A. Yenne accuracy until reproduced on CAY footage.

The upstream dataset builder generates 33 canonical keypoints from SoccerNet semantic line annotations. CAY-STABLE intentionally keeps its own 32-point 105 x 68 m semantic topology, so model indices must never be assumed compatible by position alone.

## Idea adapted in CAY-STABLE

CAY-STABLE keeps its own dependency-free homography engine and does not import the upstream Python, RF-DETR, NumPy, OpenCV, SoccerNet data, model weights or training code.

The useful design insights adapted clean-room are:

1. semantic pitch keypoints should be the interchange boundary between a learned detector and a validated homography engine;
2. model-specific keypoint topology must be translated explicitly before geometric calibration;
3. ground-plane sanity checks must not treat broadcast stands/sky as valid pitch evidence;
4. calibration quality remains independently validated after fitting.

`automatic_pitch_calibration_v1.js` combines those ideas with existing CAY-STABLE modules:

1. at least six valid image↔pitch correspondences are required;
2. two spatially distant observations are held out for independent reprojection validation;
3. the remaining observations are fitted by the existing `metric_homography_projector_v1.js` robust consensus implementation;
4. a candidate is accepted only after the independent validation succeeds;
5. only the two bottom image corners are used for broad ground-plane sanity;
6. source keypoint confidence may optionally veto a weak candidate;
7. accepted output is explicitly marked `ACCEPTED_AUTOMATIC`; failure never manufactures a metric projector.

`pitch_keypoint_artifact_provider_v1.js` now also accepts an optional explicit `keypointIndexMap` for foreign model topologies. The map translates external integer keypoint IDs to CAY's canonical IDs `0..31` before any semantic calibration is attempted. It is fail-closed:

- every accepted external point must appear explicitly in the map;
- every destination must be a valid CAY semantic ID;
- two external IDs may not map to the same CAY destination;
- unmapped foreign points are discarded rather than guessed;
- the original `sourceIndex` is preserved for audit/debugging;
- artifacts without a map retain the existing V1 behavior and accept only CAY-native IDs `0..31`.

No hard-coded 33→32 SoccerNet mapping is shipped because semantic equivalence must be established for the exact trained model/export rather than inferred from array position.

## License boundary

- `soccer-tactical-vision`: MIT — design/reference use is compatible.
- CAY does **not** bundle upstream code, SoccerNet data or model weights in this change.
- Ready-made Roboflow/Ultralytics weights discussed in upstream material are not assumed to inherit the repository's MIT license. GPL/AGPL artifacts remain rejected by the CAY provider/license guards unless an explicitly accepted licensing decision is made separately.
- Every external keypoint artifact must still provide source, license and revision/weight hash provenance before it can enter STABLE.

## What this replaces / avoids

This keeps one canonical calibration path while allowing models with different semantic output layouts to feed it. It avoids creating and maintaining one custom CAY JavaScript adapter for every 32/33/N-keypoint detector export.

Estimated work avoided: roughly **0.5–1 day per new pitch-keypoint backend/export**, plus reduced risk of silent semantic-index mismatch.

## Expected measurable impact

- faster integration of permissively licensed RF-DETR/SoccerNet-style keypoint producers;
- no regression for current CAY-native 32-keypoint providers;
- lower risk of geometrically plausible but semantically wrong homographies caused by mismatched point ordering;
- higher future automatic-calibration coverage once a licensed model/export is connected;
- zero reduction in publication safety: stale samples, cross-plan reuse, weak confidence and failed reprojection validation still result in `INDISPONIBLE`/rejection.

## Risks / dependencies

- No new runtime package dependency.
- No external model or dataset is bundled.
- A mapping file is metadata, not proof that the trained model learned the intended semantics; mappings must be audited against the exact model revision/export.
- Upstream benchmark values must be reproduced on C.A. Yenne footage before thresholds or reliability claims change.
- Manual calibration remains a fallback only when automatic evidence is insufficient or rejected.
