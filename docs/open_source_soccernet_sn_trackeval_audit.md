# SoccerNet sn-trackeval audit

Audit date: 2026-09-25

## Provenance

- Project: SoccerNet TrackEval (`SoccerNet/sn-trackeval`)
- Source: https://github.com/SoccerNet/sn-trackeval
- Audited revision: `9c25232f6f2b56c9f203f1eb55784ff1e97df683`
- Upstream role: SoccerNet-maintained fork of Jonathon Luiten's TrackEval, extended for SoccerNet MOT and SoccerNet Game State Reconstruction.
- License: MIT (`LICENSE`, copyright Jonathon Luiten). Preserve the MIT notice if source is later vendored or redistributed.

## Useful mature capability

The audited revision exposes the standard TrackEval metric families, including HOTA/DetA/AssA/LocA, CLEAR MOT and identity metrics (IDF1/IDP/IDR), and adds SoccerNet-specific evaluation entry points. This is a better fit for CAY-STABLE tracker bake-offs than inventing local definitions of HOTA or IDF1.

## CAY-STABLE reuse decision

Status: **accepted as an offline evaluation-backend candidate; no source code copied in this audit**.

CAY-STABLE already has its own runtime tracking, confidence cascade, GMC evidence, conservative ReID, MOT-style export/evaluation boundary and club-specific non-regression rules. Therefore sn-trackeval must not become a second runtime tracker. It should sit outside the browser application and consume frozen predictions/ground truth in CI or an offline benchmark job.

This replaces future bespoke implementation/maintenance of generic HOTA, CLEAR MOT and identity metric formulas. CAY-specific invariants remain separate acceptance gates because generic MOT scores cannot express them completely.

## Planned benchmark contract

For each frozen detection set and ground-truth sequence:

1. run current CAY-STABLE and every permissively licensed candidate backend on identical detections;
2. export predictions through the existing CAY evaluation boundary;
3. evaluate generic MOT quality with pinned sn-trackeval;
4. record at minimum HOTA, DetA, AssA, LocA and IDF1 plus ID-switch/fragmentation evidence where available;
5. independently run CAY non-regressions for false CAY caused by yellow details, bench/spectator exclusion, maximum 11 simultaneous on-field CAY players, cut/multi-plan isolation, re-entry identity and fail-closed coverage;
6. reject any candidate that improves a generic score by weakening a CAY invariant or by publishing unsupported statistics.

## License and dependency boundary

The repository code at the audited revision is MIT. That does **not** automatically license SoccerNet datasets, model weights, tracker outputs, detector weights or any separately downloaded assets. Each remains independently auditable before distribution or runtime use.

Because the proposed use is an offline evaluator, no Python dependency is added to the canonical browser runtime. If the evaluator is later pinned in CI, its Python package versions and the exact revision must be recorded in the CI environment/lockfile.

## Expected impact

- Work avoided: approximately 1-3 days versus implementing and validating HOTA/IDF1/CLEAR MOT calculations locally, plus ongoing maintenance risk.
- Measurement improvement: tracker comparisons gain standard association-sensitive metrics rather than relying on detection counts or ad-hoc continuity scores.
- Runtime impact: none; this is intentionally offline evaluation tooling.
- Main risk: optimizing only HOTA/IDF1 could hide club-specific failures. The independent CAY gates above are therefore mandatory and cannot be traded for a higher aggregate score.

## Modification record

No upstream code, tests, datasets, weights or assets were copied or modified in this audit. Only the evaluation architecture and acceptance contract were documented for future integration.