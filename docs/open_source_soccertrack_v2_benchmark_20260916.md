# SoccerTrack v2 — benchmark/provenance audit (2026-09-16)

## Source and legal boundary
- Project: AtomScott/SoccerTrack-v2
- Source: https://github.com/AtomScott/SoccerTrack-v2
- Audited upstream revision: `6f5c47cd3a5c38b074c44e9c98dfba48daa230d3` (2026-08-11)
- Code licence: MIT. Upstream `LICENSE` explicitly applies MIT to source code in `src/`, `scripts/`, `notebooks/`, `shell_scripts/`, `configs/` and docs.
- Dataset licence: CC BY 4.0. Upstream `LICENSE-DATA` separately covers panoramic videos plus GSR/BAS/MOT annotations and requires attribution and indication of changes.
- CAY-STABLE status: studied / benchmark candidate. No SoccerTrack v2 source code, videos, annotations, model weights or third-party dependencies are copied by this change.

## Why it is useful to CAY-STABLE
SoccerTrack v2 provides a football-specific validation target spanning the exact stages CAY needs to harden: persistent player identity (MOT), metric pitch positions / game-state reconstruction (GSR), and ball-action spotting (BAS). It therefore offers more value as an independent benchmark contract than as another runtime implementation.

The upstream project also exposes a useful failure lesson: its 2026-08-11 revision documents and fixes real format seams between the written GSR specification and shipped annotations, and adds identity/self-tests for GS-HOTA and BAS mAP. CAY should adopt the principle, not the code: every external benchmark importer must validate its schema before scoring, and every scorer must have a perfect-identity fixture that proves its plumbing can return the theoretical maximum before CAY results are trusted.

## What this replaces / avoids
- Avoids inventing a CAY-only benchmark format for persistent football identity, pitch-space tracking and later ball actions.
- Avoids treating visual overlays as proof that tracking is correct.
- Avoids silently accepting an upstream annotation schema merely because documentation says it is correct.
- Reuses the existing CAY contracts rather than adding a second tracking, calibration or event pipeline.

Estimated work avoided: 1–3 engineering days of benchmark-format and evaluation-design exploration, before any dataset download or adapter implementation.

## Proposed CAY benchmark seam
A future optional/offline adapter may translate legally obtained SoccerTrack v2 annotations into existing CAY evidence contracts. It must remain outside the browser-first STABLE runtime unless measurements justify otherwise.

Required gates before accepting a benchmark result:
1. Pin dataset/code revision and record licence provenance.
2. Validate actual input schema and coordinate convention before conversion.
3. Run an identity/self-test for each scorer; expected perfect fixture score must be exactly the scorer maximum.
4. Preserve sequence/half/camera boundaries; never associate identities across an undocumented cut.
5. Feed pitch positions only through CAY metric/calibration validity contracts; do not bypass `INDISPONIBLE` publication rules.
6. Report coverage alongside every metric so missing annotations cannot improve apparent quality.
7. Keep CAY-specific false-positive gates (yellow details, bench, spectators, <=11 simultaneous on-field CAY players) as separate acceptance criteria even when the external benchmark does not model them.

## Measurements to compare before/after
Immediate STABLE phase:
- persistent identity: HOTA/IDF1 or compatible MOT score, ID switches per player-minute, recovery after occlusion/re-entry;
- pitch trajectories: median/p95 metric position error where ground truth exists, invalid/out-of-field projection count, usable metric coverage;
- heatmaps: cell-distribution divergence computed only on covered metric samples;
- robustness: scorer/schema self-test pass/fail and explicit unavailable rate.

Later ball/event phase:
- BAS mAP or class-specific precision/recall for pass, header, cross, shot, throw-in and related actions;
- timestamp error median/p95;
- false events per 10 minutes;
- event coverage and `INDISPONIBLE` rate.

## Risks / dependencies
- Dataset download is large and must not become a mandatory STABLE dependency.
- CC BY 4.0 attribution obligations apply if dataset material is redistributed or adapted.
- Code MIT does not automatically license every third-party model/weight/dependency used by upstream baselines; those require separate audits before reuse.
- Upstream repository metadata reports the licence as `NOASSERTION`, so CAY must rely on the explicit `LICENSE` and `LICENSE-DATA` files rather than GitHub's metadata field.
- Upstream itself documents shipped-format inconsistencies; adapters must be schema-driven and fail closed.

## Decision
Use SoccerTrack v2 as a high-priority optional benchmark/evaluation source for the STABLE tracking -> pitch trajectory -> heatmap chain, then later for ball-action events. Do not import its runtime stack into CAY-STABLE at this stage. First implementation should be a small format adapter plus self-tests, only after representative C.A. Yenne video tests and storage/runtime constraints are defined.
