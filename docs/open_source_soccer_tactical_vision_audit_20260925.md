# Open-source audit — soccer-tactical-vision

Date: 2026-09-25
Upstream: https://github.com/rafaelsouza-tech/soccer-tactical-vision
Upstream license: MIT (LICENSE present at repository root; copyright 2026 Rafael Souza)
Audit scope: architecture/benchmark ideas only. No upstream source code, model weights, media, dataset or trained artifact is copied into CAY-STABLE by this commit.

## Why this project is useful to CAY-STABLE

The project independently converges on several constraints already important to STABLE: pitch-metre coordinates, RANSAC homography, explicit homography validity/completeness, shot-boundary handling, ByteTrack, heatmaps, deterministic synthetic ground truth, and separation of expensive GPU stages from deterministic CPU stages.

Most useful acceleration target: its evaluation strategy rather than its runtime. The upstream project reports the SoccerNet calibration protocol with JaC@5/10/20 and completeness rate separately, and explicitly distinguishes real-frame calibration evidence from synthetic evidence for the remaining pipeline. That matches CAY-STABLE's rule that coverage must never be confused with accuracy and that unavailable evidence must remain INDISPONIBLE.

## Clean-room adaptations accepted

1. Add/retain separate calibration quality and calibration coverage measurements. A method that returns more homographies must not be considered better if reprojection quality falls.
2. Keep synthetic deterministic oracles for geometry/trajectory/heatmap regressions, while reserving real-footage claims for licensed C.A. Yenne footage or legally usable benchmark data.
3. Prefer smoothing canonical projected anchor points rather than naively averaging raw homography matrix entries. This is an evaluation/design principle only; no upstream implementation is copied.
4. Preserve stage boundaries so detector/tracker/calibration candidates can be benchmarked against frozen upstream artifacts without changing downstream metrics.
5. Treat planar homography as a ground-plane model: goal-frame/non-ground-plane structures must not be used to claim player-ground metric accuracy.

## Explicitly not imported

- RF-DETR backend or weights
- ByteTrack wrapper
- SigLIP/team-clustering code
- Kalman/RTS implementation
- SoccerNet frames or NDA-governed video
- Roboflow dataset/images or trained keypoint weights
- PnLCalib contrib adapter
- tactical xT/pitch-control implementation

Each of those requires a separate dependency, model and/or data-license audit before any future integration.

## Upstream evidence recorded at audit time

README states:
- repository code MIT;
- RF-DETR Apache-2.0;
- no AGPL/GPL runtime dependencies by design;
- optional PnLCalib adapter isolated in contrib;
- deterministic CPU synthetic demo and test suite;
- SoccerNet calibration benchmark reports JaC and completeness independently;
- real end-to-end broadcast-video tracking remains unvalidated upstream.

These are upstream claims, not CAY-STABLE performance claims.

## CAY-STABLE impact

Replaces: ad-hoc future calibration comparisons that could accidentally reward coverage at the expense of accuracy.
Estimated work avoided: 1–3 engineering days for benchmark design and failure-mode taxonomy.
Expected measurable impact: future calibration candidates can be compared on at least (a) accepted-frame coverage, (b) reprojection/field-alignment error, (c) downstream metric availability, and (d) false metric continuity across cuts/gaps.
Runtime impact: none in this commit.
Status: studied; evaluation principles adapted; runtime not integrated.
Risk/dependencies: upstream is young and real-video end-to-end tracking is not yet benchmarked; model/data licenses must be audited independently; SoccerNet footage restrictions remain separate from label/code licensing.
