# Open-source audit — Simo-03/football-player-detection

Audit date: 2026-09-26
Upstream: https://github.com/Simo-03/football-player-detection
Pinned revision: `c0c305d4763819f0e0f28e6557bd443d2b3fc973`
Repository license: MIT (`LICENSE`, copyright 2025 Selim Sherif)
CAY-STABLE status: **reference/benchmark ideas accepted; no upstream runtime code or weights imported**.

## Why this is useful

This is a compact football-specific end-to-end reference covering player/GK/referee tracking, a dedicated ball detector, pitch-keypoint homography, team assignment, possession, pass/turnover detection, distance/speed, heatmaps, trajectories, match reports and pass networks. It also exposes both BoT-SORT and ByteTrack configurations.

The most useful design pattern for CAY-STABLE is its explicit homography acceptance policy around RANSAC: keypoint confidence/minimum-point gating, diagnostics, bounded stale-transform reuse, plus downstream trajectory products. This is useful as a comparison target for CAY's existing multi-plan calibration/coverage contracts; it does **not** justify copying a single-view stale-homography policy into CAY.

## Reuse decision

Do not create a parallel analytics pipeline. CAY already has calibration, coverage, tracking, trajectory/heatmap, physical-metric and candidate-promotion boundaries. Reuse only ideas that strengthen those boundaries:

- benchmark homography candidates on inlier count/ratio, pitch span and reprojection error;
- make stale calibration duration explicit and bounded rather than silently projecting forever;
- keep heatmaps/trajectories/reporting downstream of accepted pitch-space coordinates;
- compare ByteTrack and BoT-SORT behind CAY's existing promotion gate rather than changing output contracts;
- keep possession/pass logic unavailable until ball and player association evidence is defensible.

No upstream source file has been copied or modified in this audit.

## License/dependency boundary

The repository source is MIT, but that does not automatically license external dependencies, model architectures, downloaded weights, training datasets or match footage. In particular, the upstream README describes YOLO-based player/GK/referee, pitch-keypoint and ball models whose weights are not committed in the repository. Those artifacts must receive separate provenance/license audits before any CAY-STABLE integration.

CAY must not infer that an MIT wrapper makes a model/runtime dependency permissive. If an upstream dependency imposes AGPL/commercial terms or a weight/dataset has missing/unclear terms, reject it or isolate it until explicitly approved.

## Expected gain

Estimated engineering avoided: **1–3 days** of rediscovering football-specific homography diagnostics and post-processing sequencing. Expected measurable impact is primarily benchmark quality: fewer accepted geometrically weak projections and clearer unavailable/coverage states. No runtime accuracy or speed gain is claimed until a CAY implementation passes existing regression and promotion gates.

## CAY-specific acceptance constraints

Any adapted implementation must preserve all stricter CAY rules: multi-plan boundaries, validated cross-segment identity continuity, explicit coverage, fail-closed metrics (`INDISPONIBLE` when unsupported), no bench/spectator contamination, maximum 11 simultaneous on-field players, roster/substitution support, zero false CAY caused by yellow details, and no fabricated continuity through cuts. The official C.A. Yenne logo/identity is unrelated to this upstream project and must remain untouched.
