# SoccerNet Game State / GS-HOTA — licence boundary audit (2026-09-26)

## Provenance

- Project: SoccerNet Game State Reconstruction (`SoccerNet/sn-gamestate`)
- Upstream revision audited: `1c958345067218297d221e45e1a6405f975f83e0` (2026-05-02)
- Upstream code licence: GNU GPL v3 (`LICENSE` at repository root)
- Dataset referenced by upstream: SoccerNet GameState, current README dataset version 1.3. Dataset/media rights are a separate boundary and are **not** inherited from the repository licence.
- Framework referenced by upstream: TrackLab 1.3.24. TrackLab and every model/weight/dependency keep their own licence and admission decision.

## What is technically useful to CAY-STABLE

The project is a mature football-specific reference for game-state reconstruction from a single moving broadcast camera. Its useful independent benchmark concepts are:

1. evaluate tracking and identification together rather than accepting detector-only gains;
2. retain pitch/minimap coordinates in the evaluation state, not only image-space boxes;
3. explicitly test temporal consistency of pitch athlete locations (the upstream dataset 1.3 specifically improved this);
4. use GS-HOTA / TrackEval-style evaluation as an offline research reference for tracker + identity + pitch-position bake-offs;
5. persist intermediate tracker states during experiments so detector/tracker/ReID/calibration variants can be compared without recomputing unrelated stages.

These concepts are references for independently authored CAY tests/contracts only. No upstream implementation is copied, translated, vendored or linked into the CAY runtime.

## Licence decision

**Runtime integration: REJECTED.** The upstream repository is GPL-3.0. CAY-STABLE must not vendor, translate, derive from, or link this GPL code into its current runtime unless the project deliberately accepts the GPL obligations. It currently does not.

**Offline benchmark/reference use: CONDITIONAL.** Public metric definitions/paper-level ideas may guide independently authored evaluation. Any execution of upstream code remains isolated outside the CAY deliverable. Dataset, videos, annotations, pretrained weights and model downloads require separate rights/licence checks before use.

## Existing CAY overlap / no duplication

CAY already has tracking promotion gates, re-entry/cross-segment guards, calibration/coverage evidence, roster binding and pitch-space trajectory/metric contracts. Therefore this audit does **not** create a parallel tracker, minimap model or evaluator. The useful delta is to keep future tracker/ReID bake-offs football-specific and jointly score identity continuity plus defensible pitch-space location.

## Expected acceleration

Estimated avoided work: **2–4 days** of inventing a football-specific combined tracking/identity/pitch-position benchmark vocabulary and experiment-state workflow. No runtime speed or accuracy gain is claimed from this documentation-only change.

## Risks / dependencies

- GPL-3.0 code boundary: hard runtime rejection under current CAY policy.
- SoccerNet dataset/media rights are separate from repository code licensing.
- TrackLab, TrackEval fork, calibration modules, ReID models and all downloaded weights must each be audited independently.
- Upstream benchmark performance must not be treated as CAY performance; CAY promotion still requires its own false-CAY-yellow, bench/spectator, <=11 on-field, multi-plan/cut, coverage and `INDISPONIBLE` regressions.

## CAY modification record

No external code or asset imported. This file records provenance, licence, accepted research concepts, rejected runtime boundary and intended benchmark use only.
