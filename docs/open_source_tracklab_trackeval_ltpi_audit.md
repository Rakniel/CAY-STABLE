# Open-source audit — TrackLab / TrackEval / LTPI identity evaluation

Date inspected: 2026-09-01

## TrackLab
- Source: https://github.com/TrackingLaboratory/tracklab
- Version inspected: `1.3.24` from upstream `pyproject.toml`.
- License: MIT.
- Relevant capability: modular tracking pipeline, saved tracker states, ReID-oriented evaluation workflows and integration with tracking benchmarks.
- CAY-STABLE use: evaluation architecture reference only in this change. No TrackLab source code was copied.
- Why not imported into runtime: current TrackLab dependency graph includes Python/PyTorch and Ultralytics, which is substantially heavier than the browser-first STABLE runtime and must be license/dependency audited transitively before any direct integration.

## TrackEval
- Source: https://github.com/TrackingLaboratory/TrackEval (fork of the established TrackEval toolkit).
- License: MIT as declared by the TrackingLaboratory repository.
- Relevant capability: mature MOT evaluation methodology focused on detection and association/identity quality.
- CAY-STABLE use: evaluation goal adapted in clean-room JavaScript; no upstream implementation code copied.
- Local change: `tracking_identity_episode_eval_v1.js` adds explicit recovery measurements after visibility gaps and camera/segment changes so tracker/ReID changes can be compared before promotion.

## LTPI benchmark
- Source: https://github.com/FrontierSport/ltpi-benchmark
- Snapshot inspected: public repository state on 2026-09-01.
- License: CC BY-NC 4.0 for code; dataset has separate non-commercial research terms.
- Relevant capability: long-term player identification from single-camera football video, including jersey/OCR/ReID-oriented evaluation.
- CAY-STABLE status: **reference/benchmark concept only; rejected as runtime code dependency** because the non-commercial restriction is not acceptable as a silent product constraint.
- No LTPI code or dataset content is copied into CAY-STABLE.

## SoccerNet Game State Reconstruction note
- Source: https://github.com/SoccerNet/sn-gamestate
- License: GPL-3.0.
- Status: reference/evaluation only unless CAY-STABLE deliberately accepts GPL-compatible distribution obligations. No implementation code copied here.

## Local adaptation and modifications
`tracking_identity_episode_eval_v1.js` is original CAY-STABLE code. It reuses the existing local IoU matching contract and records:
- ReID opportunities after a visibility gap;
- same-ID recovery rate;
- long-gap recovery rate with an explicit frame threshold;
- cross-segment/camera-plan recovery rate;
- failed re-identification count;
- per-episode provenance for debugging.

The evaluator deliberately returns `INDISPONIBLE` when the annotated fixture contains no real re-identification opportunity. This avoids displaying a misleading 100% identity score on an easy continuous clip.

## What this replaces / work avoided
Without this reuse of mature MOT evaluation concepts, CAY-STABLE would need a separate bespoke long-term identity benchmark design before safely comparing ByteTrack, BoT-SORT or future ReID backends. Estimated avoided design/plumbing effort: **0.5–1 day**.

## Expected measurable impact
No runtime accuracy claim is made by this change. The measurable impact is on validation quality: future tracker/ReID candidates can now be blocked when they improve short-term MOTA but regress persistent identity after occlusions or camera-plan changes.

## Risks / dependencies
- The local metric is not claimed to be official HOTA/IDF1/LTPI scoring; it is a CAY-specific promotion guard.
- Quality depends on representative annotated football clips containing actual occlusions and camera/segment transitions.
- Direct TrackLab/TrackEval/LTPI imports remain disabled until transitive licenses, model weights and deployment cost are explicitly accepted.
