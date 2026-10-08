# 2026-10-09 — MOT off-image anchor safety

- **Source studied:** [TrackingLaboratory/tracklab](https://github.com/TrackingLaboratory/tracklab), version 1.3.24 at commit `5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2`, root LICENSE MIT (verified 2026-10-09). MOTChallenge is used as an interchange convention; ByteTrack and BoT-SORT are compatible export/tracking references, not imported implementations.
- **External material imported:** none. No upstream code, model weights, dataset, or dependency copied. CAY adapter remains an independently maintained browser/Node module.
- **Existing CAY module extended:** `motchallenge_tracking_artifact_adapter_v1.js`. Replaces clamping off-image player-foot/ball-centre anchors to [0,1] with rejection and `rejectedGeometry` audit; rejects infinite frame dimensions. No parallel geometry module.
- **Expected impact:** eliminate artificial border detections and their false CAY slots. Synthetic cases: 5 off-image person/ball cases and 1 partially clipped foot-outside case rejected; legitimate in-image and boundary anchors retained. No real-video accuracy claim.
- **Estimated work avoided:** 0.5–1 day versus a second downstream filter (estimate, not measured).
- **Status:** tested in isolated JS regression harness; GitHub CI and real C.A. Yenne video still required before STABLE promotion.
- **Risks:** partially clipped players whose chosen foot anchor lies outside the image are excluded conservatively, reducing observed coverage. Imported class labels are not proof of club membership; downstream roster/field/identity gates remain mandatory.
