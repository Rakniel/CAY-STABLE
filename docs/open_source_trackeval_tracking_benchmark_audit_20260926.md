# Open-source audit — TrackEval

Date: 2026-09-26

## Source and version

- Project: JonathonLuiten/TrackEval
- Upstream: https://github.com/JonathonLuiten/TrackEval
- Audited revision: `12c8791b303e0a0b50f753af204249e622d0281a`
- Revision date: 2022-11-29
- License: MIT (`LICENSE`, copyright Jonathon Luiten, 2020)

## Why it matters to CAY-STABLE

TrackEval is the upstream reference implementation for HOTA and also exposes CLEAR MOT and identity metrics including HOTA/DetA/AssA/LocA, MOTA/MOTP/fragmentation and IDF1/IDP/IDR. This is directly useful for the CAY tracker-candidate promotion path because it provides an independent, mature evaluator instead of growing another local implementation of standard MOT metrics.

## Reuse decision

**Status: accepted as an external/offline benchmark candidate; not vendored into the browser/runtime.**

The preferred integration boundary is an offline Python benchmark job fed with a deterministic MOT-style export from the same labelled CAY evaluation sequences used by the existing promotion gate. TrackEval output is evidence for candidate comparison, not authority to bypass CAY-specific vetoes.

CAY-specific gates remain mandatory and authoritative for:

- zero false CAY caused by yellow details / kit confusion;
- bench and spectator exclusion;
- at most 11 simultaneous CAY players while allowing a larger roster/substitutions;
- unsafe identity carry-over across cuts / multi-plan segments;
- calibration and coverage sufficiency;
- defensive `INDISPONIBLE` publication when evidence is insufficient.

A candidate therefore cannot be promoted merely because TrackEval HOTA or IDF1 improves.

## Planned adapter contract

Do not copy or fork metric code unless there is a demonstrated need. Prefer a thin, replaceable offline adapter:

1. export GT and candidate tracks in MOTChallenge-compatible 2D-box form;
2. pin TrackEval to the audited commit (or re-audit a newer revision before changing the pin);
3. execute outside the CAY browser runtime;
4. ingest only machine-readable metric results into the existing tracker promotion report;
5. require exact sequence/frame/timebase parity before comparing baseline and candidate;
6. keep CAY football-specific veto metrics beside standard HOTA/IDF1 rather than folding them into an opaque aggregate score.

## License / provenance obligations

MIT is compatible with the intended benchmark use. If TrackEval code is later distributed with CAY-STABLE, preserve the upstream copyright and permission notice. Benchmark datasets are separate works: TrackEval's MIT license does **not** license MOTChallenge, SoccerNet, SoccerTrack, TeamTrack, videos, annotations, detector weights or ReID checkpoints.

No TrackEval source, dataset, model or weight is copied by this audit.

## Expected acceleration

Estimated work avoided: **2–4 engineering days** versus maintaining another local implementation and validation suite for HOTA/CLEAR/Identity metrics.

Expected measurable impact once the adapter is wired: tracker bake-offs gain independent HOTA decomposition (detection vs association), IDF1 and fragmentation evidence while retaining the existing CAY-specific safety vetoes. This should make ByteTrack/BoT-SORT/ReID promotion decisions more reproducible without weakening club-specific correctness requirements.

## Risks / dependencies

- Python/offline dependency boundary must remain explicit.
- Upstream is mature but the audited head is from 2022; any future commit/tag requires a fresh license/dependency audit.
- MOT-style 2D evaluation does not prove field-coordinate accuracy, roster identity, possession or event correctness; those remain separate CAY benchmarks.
- Standard MOT scores can hide football-specific failures, hence the non-bypassable CAY vetoes above.
