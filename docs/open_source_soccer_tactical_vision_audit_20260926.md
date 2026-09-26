# Open-source audit — soccer-tactical-vision

Audit date: 2026-09-26
Upstream: https://github.com/rafaelsouza-tech/soccer-tactical-vision
Audited revision: `4c557534c624948f3bfe3db956859c7ea3b442fa`
Upstream package version: `0.1.0`
Root license: MIT (verified from upstream LICENSE at the audited revision)

## Why this is useful to CAY-STABLE

This project is a useful permissive reference for broadcast-football calibration because it combines RANSAC homography, explicit validation, temporal smoothing and a quantitative SoccerNet calibration benchmark. Its latest audited commit records an important planar-geometry failure mode: validating all four image corners can reject valid broadcast calibrations because upper image corners may lie above the pitch plane. Upstream changed its sanity gate to ground-relevant lower corners and added regression coverage.

The same commit reports, on 3,212 SoccerNet calibration-2023 validation frames, an empirical sweep leading to keypoint confidence 0.5 and RANSAC reprojection threshold 8 px, and reports JaC@5/completeness/score values. These numbers are benchmark evidence for upstream only; they are not adopted as CAY thresholds without CAY footage validation.

## Reuse decision

Status: **studied / methodology accepted for CAY benchmark design / no runtime code copied in this audit**.

CAY should adapt the following ideas rather than duplicate another calibration stack:

1. Validate homographies with ground-plane-aware checks; never invalidate a planar model merely because image regions known to be off-plane do not project sensibly.
2. Treat calibration quality as two dimensions: geometric accuracy and coverage/completeness. A high-quality estimate on a small subset must not silently imply full-match coverage.
3. Tune confidence and reprojection gates empirically on representative CAY footage rather than importing upstream constants.
4. Keep explicit fail-closed behavior: when geometry/coverage is not defensible, downstream metric state remains INDISPONIBLE.
5. Use temporal smoothing only inside a validated camera segment; it must not bridge an unvalidated cut or multi-plan boundary.

This complements the existing CAY multi-plan/calibration contracts rather than replacing them.

## Dependency boundary

The upstream core declares NumPy, OpenCV, Supervision, Typer, Pydantic, PyYAML, PyArrow, Pillow and Rich. GPU extras separately declare Torch/Torchvision, RF-DETR, Transformers, timm, scikit-learn and UMAP; evaluation separately declares SoccerNet. Dependency and model/dataset licenses are **not** inherited from the MIT root license and require their own admission checks before any CAY runtime use.

Upstream comments also note that its Supervision ByteTrack wrapper is expected to migrate to the standalone `trackers` package. CAY already audits tracker candidates separately; this audit does not admit Supervision, RF-DETR, SoccerNet media, pretrained weights or datasets.

## Provenance / modification record

No upstream source, model, weight, dataset or media was copied in this change. CAY only records independently applicable validation/benchmark methodology and provenance. If source is later reused, preserve the MIT notice and record exact files, revision and CAY modifications in the component ledger before promotion.

## Expected value

Estimated work avoided: **1–3 engineering days** of rediscovering calibration sanity/coverage failure modes and designing an initial benchmark protocol.

Expected measurable impact: fewer false calibration rejections on broadcast frames with off-plane upper regions, while preserving CAY's stricter coverage and multi-plan fail-closed rules. No runtime accuracy/speed gain is claimed by this documentation-only audit.
