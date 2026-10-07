# Open-source audit — MatchVision AI (2026-10-07)

- Source: https://github.com/BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline
- Audited revision: `9876ed6509cc3c6f8dc5241c53d6079d50ac60b9`
- Project license: MIT (verified from upstream LICENSE).
- Status: studied / architecture evidence retained; no upstream runtime code, weights, datasets or media copied.
- Scope: YOLO detection, ByteTrack, team-label temporal stabilization, PnLCalib keyframe calibration, guarded optical-flow propagation, metric pitch projection, trajectories and physical metrics.

## Useful architecture evidence

MatchVision runs an absolute semantic pitch calibration periodically and uses optical flow only between those anchors. Flow updates are gated by forward/backward feature consistency, RANSAC inliers, plausible pitch geometry, pitch-line alignment error and frame-to-frame projection-change limits. A fresh accepted absolute calibration overrides accumulated flow.

The upstream README documents a concrete drift example: at frame 7699, cumulative optical flow reached 43.29 px pitch-line alignment error, while a fresh PnLCalib estimate on the same frame reduced it to 9.07 px. This is upstream evidence only; it is not a C.A. Yenne benchmark.

Distance accumulation also rejects physically implausible jumps, reducing inflation caused by identity switches or temporary homography failures.

## CAY-STABLE adaptation decision

Do not introduce a second calibration or trajectory stack. CAY-STABLE already has automatic/manual calibration, camera-motion evidence, metric homography projection, trajectory plausibility and fail-closed publication contracts.

Retain these validation rules for the existing integration points:

1. absolute calibration anchors remain authoritative over propagated camera-motion estimates;
2. propagated transforms require explicit quality evidence and must expire/fail closed;
3. physical metrics must not accumulate across implausible jumps, stale calibration or invalid coverage;
4. player pitch position uses a ground-contact/foot point, not the box centre;
5. no MatchVision accuracy claim transfers to C.A. Yenne footage without a controlled local benchmark.

## License and provenance boundary

The repository-level MIT license does not automatically relicense transitive dependencies, model weights, datasets, demo media or vendored code. Upstream explicitly states that vendored PnLCalib remains subject to its own license. CAY-STABLE must continue to audit PnLCalib, Ultralytics/YOLO code and weights, datasets and other assets independently before distribution or runtime integration.

## Expected value

Estimated 1–2 days of calibration/metric guard design avoided by reusing the proven anchor-plus-guarded-propagation pattern as benchmark guidance. Expected impact is lower drift and fewer inflated distance/speed samples during pans, zooms and cuts. Runtime impact is zero in this audit commit.
