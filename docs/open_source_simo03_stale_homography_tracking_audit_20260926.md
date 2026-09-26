# OSS audit — Simo-03/football-player-detection

Date: 2026-09-26
Upstream: https://github.com/Simo-03/football-player-detection
Pinned revision: `c0c305d4763819f0e0f28e6557bd443d2b3fc973`
Upstream code license: MIT (copyright 2025 Selim Sherif)
Status in CAY-STABLE: methodology/reference accepted; no upstream runtime code, model, weight or dataset imported.

## Why it is useful to CAY-STABLE

The project independently implements a football pipeline with player/GK/referee tracking, a dedicated small-ball detector, 32 pitch keypoints, homography, physical movement metrics, heatmaps, trajectories and pass/possession estimates. Its most useful contribution for CAY-STABLE is not another pipeline implementation but an independently reported set of failure controls and measurable coverage diagnostics around homography and tracking.

At the pinned revision, upstream documents these engineering choices:

- homography candidates estimated with RANSAC and gated by inlier count, inlier ratio, pitch span and median reprojection error;
- a previously valid homography may be reused only for a bounded stale window (`homography-max-stale-frames`, default documented as 60 frames);
- projected player-position jumps are clamped before smoothing;
- BoT-SORT uses global camera-motion compensation and a finite track buffer;
- upstream explicitly states that ReID is disabled in its committed default configuration, so it does not over-claim persistent identity;
- heatmaps, trajectories and reports are post-processing products built from stored tracking/pitch results rather than requiring detection to be rerun.

Upstream reports, on its own 750-frame test clip, valid homography projection on 693/750 frames (92.4%) plus 15 fallback frames (2.0%). These are upstream measurements only and MUST NOT be presented as CAY-STABLE performance.

## CAY-STABLE adaptation

Keep the existing CAY calibration, multi-plan, tracking, identity and publication gates. Do not replace them with upstream code.

Use the upstream design as an independent regression checklist:

1. Every propagated/stale homography sample used by a physical metric must expose its age and source (`absolute` vs `propagated`).
2. A bounded propagation window is mandatory; expiry must become unavailable rather than silently extending stale geometry.
3. Calibration diagnostics should retain inlier support, pitch-span/support evidence and reprojection residual where available.
4. Heatmap/trajectory rendering should consume validated stored artifacts so presentation changes never require rerunning detector/tracker inference.
5. Tracker benchmarks must distinguish camera-motion compensation from ReID and must never claim ReID when appearance matching is disabled.
6. Upstream possession/pass counts are heuristic references only; CAY ball-player/event evidence remains authoritative and fail-closed.

This complements the existing MatchVision anchor/flow audit: MatchVision motivates absolute-anchor recovery from accumulated flow drift, while this source provides an independent bounded-stale-homography pattern and a useful separation between stored analysis artifacts and presentation post-processing.

## Expected gain

Estimated engineering work avoided: 1–2 days of rediscovering stale-homography diagnostics and post-processing separation patterns.

Expected measurable impact after implementation/benchmarking: fewer physical-metric samples emitted from over-aged geometry; explicit stale-calibration coverage; faster regeneration of heatmaps/trajectories from validated artifacts without rerunning inference.

## License boundary

The repository LICENSE grants MIT rights to the upstream software subject to preservation of the copyright/license notice. This audit does not copy upstream implementation code.

The repository README references Ultralytics YOLO/BoT-SORT and downloadable `.pt` model weights. Those dependencies, model weights, training datasets, videos and annotations are separate artifacts and are NOT relicensed by the repository's MIT LICENSE. Their individual terms must be audited before any future import or distribution. No such artifact is imported by this change.

## CAY non-negotiable gates

Nothing in this reference may weaken: maximum 11 simultaneous CAY players; larger roster/substitution support; persistent identity proof; yellow-detail false-CAY veto; bench/spectator exclusion; multi-plan reset/continuity controls; explicit coverage; manual-frame robustness; or `INDISPONIBLE` whenever a statistic is not defensible.
