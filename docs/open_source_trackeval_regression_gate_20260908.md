# TrackEval regression gate — 2026-09-08

## Provenance
- Project: `JonathonLuiten/TrackEval`
- Audited revision: `12c8791b303e0a0b50f753af204249e622d0281a`
- Repository license: MIT
- CAY usage: external evaluator reference and metric vocabulary only (`HOTA`, `DetA`, `AssA`, `IDF1`).

## Legal / technical boundary
CAY-STABLE does not vendor or copy TrackEval source, metric implementations, datasets or dependencies. Official TrackEval remains an external evaluator. The CAY module only consumes normalized benchmark results produced elsewhere and applies a local promotion policy.

Datasets, annotations and any third-party tracker/checkpoint used to produce the benchmark remain subject to their own licenses and provenance requirements.

## Adaptation
`tracking_benchmark_gate_v1.js` adds a fail-closed comparison layer for CAY experiments:
- baseline and candidate must use the same explicitly named evaluation set;
- candidate bbox evidence coverage must satisfy the configured floor (100% by default);
- HOTA, DetA, AssA and IDF1 must all be present;
- a candidate is rejected when any metric drops beyond its configured regression allowance or misses an absolute floor;
- percentage-form values (`62`) and ratio-form values (`0.62`) are normalized consistently;
- missing/ambiguous evidence returns `INDISPONIBLE`, never a guessed promotion.

## What this replaces
Without this seam, each ByteTrack/BoT-SORT/TrackLab/ReID experiment would need manual comparison or ad-hoc acceptance logic. The gate centralizes one auditable policy while leaving official metric computation to TrackEval.

Estimated avoided work: ~0.5–1 day for initial promotion plumbing and ~0.25 day per subsequent tracker/ReID experiment.

## Expected impact
No tracking-accuracy gain is claimed by this module itself. The measurable impact is process safety: changes that improve detection while materially degrading association/identity can now be automatically rejected before merge/promotion once annotated C.A. Yenne benchmark clips are available.
