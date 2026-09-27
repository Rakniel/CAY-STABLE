# Open-source audit — rafaelsouza-tech/soccer-tactical-vision

Date: 2026-09-27

## Source and revision

- Repository: https://github.com/rafaelsouza-tech/soccer-tactical-vision
- Audited revision: `4c557534c624948f3bfe3db956859c7ea3b442fa`
- Repository license: MIT (copyright Rafael Souza, 2026).
- License obligation for copied/substantial code: retain copyright and MIT permission notice.

## Relevant mature patterns

The project implements a football-specific staged pipeline with typed artifacts: detection, team classification, pitch keypoints, validated RANSAC homography, temporal smoothing, pitch-meter projection, ByteTrack, ball interpolation, heatmaps and SoccerNet calibration evaluation.

The most useful calibration design for CAY-STABLE is not to smooth raw homography coefficients. It validates per-frame homographies first (inliers, reprojection error and geometric sanity), then smooths canonical projected anchor points with Kalman/RTS before deriving the usable transform. This is directly relevant to CAY-STABLE multi-plan/camera-motion robustness and to keeping physical metrics fail-closed.

The upstream README reports deterministic CPU tests and a real SoccerNet calibration benchmark. It also explicitly separates synthetic evidence from real-video evidence instead of claiming unmeasured end-to-end quality. That evidence discipline matches CAY-STABLE's `INDISPONIBLE` policy.

## License/dependency boundary

The repository itself is MIT and is compatible for selective code adaptation provided notices are preserved. However, dependency/model/data rights remain separate:

- RF-DETR is described upstream as Apache-2.0 and must be audited at the exact version before runtime adoption.
- Optional PnLCalib is isolated upstream and must not be copied/imported until its own license is audited.
- SoccerNet labels/media and the cited CC BY 4.0 pitch-keypoint dataset have separate conditions; no dataset/media is imported by this audit.
- No upstream model weights or datasets are imported into CAY-STABLE by this change.

## CAY-STABLE mapping

CAY-STABLE already contains calibration, multi-plan, tracking, heatmap and metric-publication logic. Therefore this project must not be vendored wholesale and must not create a parallel pipeline.

Recommended selective adaptation target for a later validated integration:

1. Extend the existing calibration path with an explicit per-frame quality record (inlier count/ratio, reprojection error, geometry sanity and plan/segment provenance).
2. Smooth stable pitch anchor projections rather than raw homography matrix entries when temporal smoothing is needed.
3. Recompute/accept the transform only from validated smoothed anchors; otherwise publish calibration/physical metrics as `INDISPONIBLE`.
4. Benchmark before/after on identical C.A. Yenne frame/plan sets, including pans, zooms, close-ups and plan transitions; do not promote on synthetic-only gains.

No source code is copied in this audit commit. A future code adaptation must record exact upstream files/functions, revision, retained MIT notice, local modifications and before/after measurements.

## Estimated impact

- Code reused in this audit: none.
- Work avoided: approximately 1–2 engineering days of calibration-smoothing design and failure-mode discovery.
- Expected impact: fewer unstable pitch projections during camera motion, cleaner trajectory/heatmap geometry, and stronger justification for distance/speed publication once calibration coverage is sufficient.
- Status: **studied / MIT-compatible / selective adaptation candidate**.
- Risks: upstream real benchmark is calibration-only, not end-to-end real-video tracking; dependency/model/data licenses must be audited separately; CAY-STABLE must preserve its existing multi-plan and fail-closed contracts rather than adopting upstream defaults blindly.
