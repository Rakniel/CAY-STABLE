# SoccerNet TrackEval audit — 2026-09-25

## Decision
Use **SoccerNet/sn-trackeval** as an external evaluation oracle for CAY-STABLE tracking exports. Do not duplicate its metrics implementation inside the browser runtime.

## Provenance
- Project: SoccerNet/sn-trackeval
- Upstream: fork of JonathonLuiten/TrackEval adapted for SoccerNet MOT and Game State Reconstruction.
- License observed upstream: MIT.
- Version policy: pin an exact upstream commit before any CI/container integration; never depend on a floating branch.

## What CAY already has
CAY-STABLE already contains TrackEval/MOTChallenge export adapters and tracking-specific non-regression infrastructure. Therefore the useful reuse boundary is evaluation, not another tracker or another HOTA implementation.

## Reuse/adaptation
No upstream source is copied into the CAY browser runtime. The intended integration is an optional offline/CI validation lane:
1. export CAY predictions through the existing TrackEval/MOT adapters;
2. run pinned `sn-trackeval` externally;
3. ingest only evaluation artifacts/results;
4. compare HOTA/IDF1/identity continuity against the previous accepted baseline.

This replaces writing and maintaining a bespoke HOTA/IDF1 evaluator and gives CAY a benchmark aligned with SoccerNet tracking/game-state conventions.

## CAY acceptance gates
An upstream metric gain is never sufficient by itself. A candidate tracker/configuration is accepted only if it does not regress CAY invariants:
- maximum 11 simultaneous on-field CAY players, while roster/substitutions may exceed 11;
- no automatic identity merge from ReID alone;
- zero false CAY caused by yellow details/accessories;
- bench/spectator exclusion;
- persistence across short occlusion/re-entry where evidence is sufficient;
- hard reset/segmentation across incompatible camera plans/cuts;
- manual boxes remain authoritative and robust;
- metric publication remains fail-closed (`INDISPONIBLE`) when calibration/coverage/evidence is insufficient.

## Licensing / data boundary
MIT applies to the evaluator code, not automatically to SoccerNet datasets, annotations, model checkpoints or third-party dependencies. Dataset access/terms and every model/checkpoint license must be audited independently before redistribution or bundling. No SoccerNet media, labels or weights are added by this audit.

## Expected impact
- Avoided work: approximately 2–4 engineering days versus implementing/debugging HOTA/IDF1 evaluation ourselves.
- Measurable impact: future tracking changes can be compared with standard HOTA/IDF1 plus CAY-specific false-positive, re-entry, multi-plan and 11-player gates.
- Runtime impact: none; evaluator stays outside the production browser bundle.

## Status
**AUDITED / APPROVED AS EXTERNAL ORACLE; NOT YET WIRED INTO CI.**

Next implementation gate: pin an exact `sn-trackeval` commit, create a reproducible offline runner around the existing CAY export, run it on a legally usable fixture, and commit only if syntax/non-regression checks plus the CAY gates pass.
