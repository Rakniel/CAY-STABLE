# SoccerNet TrackEval identity benchmark audit — 2026-09-07

## Provenance
- Project: `SoccerNet/sn-trackeval`
- Repository: https://github.com/SoccerNet/sn-trackeval
- Audited revision: `9c25232f6f2b56c9f203f1eb55784ff1e97df683`
- Upstream revision date: 2025-07-22
- License: MIT
- Upstream role: SoccerNet fork of TrackEval supporting SoccerNet MOT and Game State Reconstruction evaluation.

## Mature pattern reused
TrackEval treats tracking quality as an explicit evaluation problem instead of mixing validation logic into the tracker. Its supported metrics include HOTA, CLEAR/MOTA and identity metrics such as IDF1/IDP/IDR. It also recommends converting custom trackers into a supported evaluation format rather than writing a second tracker solely for benchmarking.

For CAY-STABLE the immediately reusable idea is the **separation of runtime tracking from labelled identity evaluation**. This is required before enabling optional association heuristics: same-video before/after changes must be measurable rather than inferred visually.

## CAY adaptation
No TrackEval Python source code is copied or imported. No numpy/scipy dependency is added. CAY keeps its browser/Node tracking runtime and adds the small independent `tracking_identity_benchmark_v1.js` diagnostic primitive.

The CAY benchmark accepts labelled observations containing:
- frame number;
- ground-truth player identity (`gtId`);
- produced CAY track identity (`trackId`);
- optional segment/camera-plan identifier;
- optional validity flag.

It reports:
- comparable identity transitions;
- explicit ID-switch count and switch records;
- identity-consistency diagnostic;
- valid/rejected sample counts and coverage;
- `INDISPONIBLE` when there is not enough comparable evidence.

Camera-cut / multi-plan segment boundaries are excluded by default so a deliberate segment reset cannot be misreported as an identity switch. Missing ground truth or missing CAY identity reduces benchmark coverage instead of being silently treated as correct.

## Important metric boundary
`tracking_identity_benchmark_v1.js` is **not** an implementation of HOTA, IDF1, MOTA or SoccerNet GS-HOTA. It must never label its diagnostic as one of those official metrics. Official benchmark claims require TrackEval itself (or another verified implementation) plus the corresponding annotation and geometry contracts.

The local method is intentionally named `CAY_LABELLED_IDENTITY_TRANSITION_BENCHMARK` and publishes a policy string stating that it is diagnostic-only.

## What this replaces / avoids
This replaces ad-hoc per-test constants and manual visual counting of identity switches with one reusable evaluator. It does not replace `tracking_core_v1.js` and does not create a second tracker.

Estimated engineering avoided by reusing the mature TrackEval evaluation architecture and metric separation: **0.5–1 development day** of designing a benchmark contract, coverage semantics and camera-cut handling from scratch.

## Expected measurable impact
Immediate deterministic impact:
- a stable two-player sequence reports 0 switches / identity consistency 1.0;
- a synthetic crossing with two swapped identities reports exactly 2 switches;
- a multi-plan segment reset does not create a false switch;
- missing labels/track IDs reduce explicit coverage;
- a single observation returns `INDISPONIBLE` rather than a fabricated quality score.

Expected project impact:
- OC-SORT direction guard, future ReID changes and later ball-player association can be compared on exactly the same labelled samples;
- promotion decisions can require strict ID-switch reduction with unchanged or improved coverage;
- regression reporting becomes repeatable and independent from UI rendering.

## Status
**INTEGRATED AS A TEST/BENCHMARK PRIMITIVE / NOT A PRODUCTION STATISTIC.**

Before using it to promote a runtime tracking option, CAY still requires the planned >=300 comparable labelled frames on representative club footage and must report the exact same sample set before/after.

## Risks / dependencies
- Requires trustworthy ground-truth player labels; bad annotations directly corrupt the result.
- The simple transition diagnostic does not replace full MOT metrics that account for spatial overlap, false positives and false negatives.
- Frame gaps can hide intermediate switches; `maxFrameGap` should be bounded for real benchmark sets.
- Segment boundaries must reflect real camera cuts/plans rather than being abused to hide tracking failures.

## Modification/copying record
- Upstream code copied: **none**.
- Upstream tests copied: **none**.
- Upstream models/datasets copied: **none**.
- New runtime dependency: **none**.
- CAY files added: `tracking_identity_benchmark_v1.js`, `tests/tracking_identity_benchmark_nonregression.js`.
- Adapted artifact: evaluation architecture / metric-separation concept only, independently implemented for the existing CAY JavaScript stack.
