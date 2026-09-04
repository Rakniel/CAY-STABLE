# Open-source audit — Supervision temporal speed interval evidence

Date inspected/adapted: 2026-09-05

## Source
- Project: Roboflow Supervision
- Repository: https://github.com/roboflow/supervision
- Relevant upstream concept: speed estimation keeps tracker history and computes speed after perspective transformation, using temporal history rather than a standalone observation.
- License: MIT for the Supervision code/examples audited.
- Previously audited reference in CAY-STABLE: `docs/open_source_supervision_sustained_max_speed_20260905.md`.
- No detector/model code, model weights, dataset or runtime dependency is imported by this change.

## Discovery in CAY-STABLE
`metric_quality_guard_v1.js` emitted one speed sample per accepted pair at the pair END timestamp. `metric_publication_guard_v1.js` correctly measures continuous evidence from speed-sample timestamps, but this representation omitted the beginning of the first valid pair of every continuous run.

Example: a fully valid trajectory from t=0.0 to t=3.0 sampled every 0.5 s contains 3.0 s of metric movement. Before this change its speed samples started at t=0.5, so the publication layer observed only 2.5 s and rejected the physical metrics against the existing 3 s evidence gate.

## CAY-STABLE adaptation
No upstream code was copied. The existing CAY metric quality path is extended instead of introducing another estimator:
- every continuous metric run now emits one `RUN_INTERVAL_ANCHOR` at the start of its first accepted speed interval;
- accepted interval ends remain normal `INTERVAL_END` samples;
- segment cuts, gaps >1 s, invalid projections and rejected speed pairs still split continuity exactly as before;
- the publication guard itself is unchanged and continues to own the 3 s continuous-evidence policy and sustained max-speed policy.

## What this replaces / work avoided
This removes a representation-level undercount instead of weakening the publication threshold or adding a parallel duration calculator. Estimated design/plumbing avoided by reusing the already-audited temporal-history model and existing publication guard: **0.25–0.5 day**.

## Measurable impact
Regression fixture:
- before: 3.0 s of valid metric trajectory -> 2.5 s visible to the speed publication evidence gate -> `INDISPONIBLE`;
- after: 3.0 s -> 3.0 s visible evidence -> `FIABLE` when all other identity/calibration/quality requirements are satisfied;
- a 2 s tracking hole still creates two independent runs and the longest continuous evidence remains 1.0 s;
- no extra metres are created across the gap.

## Status
Integrated on feature branch pending full CAY-STABLE CI validation and merge.

## Risks / dependencies
- The anchor duplicates the first interval speed at the interval start only to represent its temporal support; it is not a new physical measurement.
- Legacy speed-sample consumers still receive the same `time`, `segment`, `kmh` fields; `sampleRole` is additive.
- No new package, GPU requirement, model weight or license obligation is introduced.
