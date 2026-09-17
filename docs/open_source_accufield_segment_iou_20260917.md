# AccuField segment-aware calibration audit — 2026-09-17

## Source and legal boundary

- Project: `gbreyt/AccuField`
- Upstream: https://github.com/gbreyt/AccuField
- Audited default branch: `main` on 2026-09-17.
- License status: **NO EXPLICIT LICENSE FOUND** in the audited repository root. Root contains `GUI.py`, `ReadMe.md`, `classes/`, and `requirements.txt`; no `LICENSE`/`COPYING` file was present.
- CAY-STABLE decision: **concept study only**. No upstream source code, assets, data, or configuration are copied or imported.

## Useful idea

AccuField's accompanying research description highlights a failure mode relevant to CAY-STABLE calibration validation: a single whole-pitch overlap/accuracy score can hide locally poor calibration. It proposes evaluating the visible pitch as distinct field segments and averaging segment-level IoU rather than trusting only one global area score.

CAY-STABLE already has robust homography, pitch geometry, multi-plan provenance, calibration confidence and fail-closed metric publication. The useful adaptation is therefore not another calibration pipeline; it is an **independent segment-aware validation signal** layered onto the existing calibration quality gate.

## Proposed CAY adaptation

For each accepted calibration/keyframe, partition only the currently visible, semantically known pitch into meaningful regions (for example penalty-area/goal-area/centre/side regions where observable). Compute validation evidence per observable region, then expose both:

1. existing global residual/quality evidence; and
2. a segment-aware worst/aggregate quality signal.

Fail closed when too few independent regions are observable. Never infer quality for invisible regions. Never carry segment evidence across a scene/plan break.

This is especially useful for amateur footage where one side of the pitch can align well while the far side is distorted by perspective, imperfect manual anchors, zoom, or camera-motion propagation.

## What it replaces / avoids

Avoids designing a local calibration-quality diagnostic from scratch and reduces the risk of promoting a homography because a global score masks a locally bad region. It extends the existing `pitch_geometry_guard_v1.js`, `metric_homography_projector_v1.js`, calibration benchmark and publication guards rather than duplicating them.

Estimated engineering/research time avoided: **0.5–1 day**.

## Measurable acceptance targets for a future implementation

Compare baseline vs segment-aware gate on the same C.A. Yenne clips and synthetic fixtures:

- global reprojection residual median/p95;
- per-visible-segment residual or overlap score;
- worst visible segment score;
- valid metric coverage retained/lost;
- false metres on stationary anchors/players;
- trajectory discontinuity after calibration refresh;
- number of frames rejected because global quality looked acceptable but one observable region was locally invalid;
- **0 metric samples published across scene/plan breaks or rejected calibration windows**.

No fixed threshold is imported from AccuField; thresholds must be calibrated on CAY footage and synthetic ground truth.

## Status

**Studied / idea adapted / upstream code rejected pending explicit compatible license.**

Risks: segment definitions can be under-observed in tight camera views; an average can still hide one catastrophic region, so CAY should retain both aggregate and worst-region evidence. This audit adds no dependency and changes no runtime behavior.
