# OSS audit — baseline-derived non-regression tolerance gates (2026-09-17)

## Source
- Project: `alina-letzien/football-analytics`
- Upstream revision audited: `b3686fcce7b0e587a3d61ad2f64e4b88693d3106`
- Upstream license: MIT, verified from repository metadata and `LICENSE`.
- Relevant upstream concept: derive smoke-test tolerance bands from a known-good analysis summary, and force a fresh detector/tracker run after dependency or behavior changes rather than validating stale caches.

## CAY-STABLE adaptation
No upstream source code, weights, datasets, or configuration are copied. CAY-STABLE already has dedicated calibration, detector, tracking, coverage, metric-publication and integration gates; duplicating the upstream pipeline would be harmful.

The useful independent idea is adopted as a validation policy for the existing CAY benchmark layer:
1. keep a versioned known-good STABLE baseline summary;
2. after a validated detector/tracker/calibration behavior change, recompute artifacts from source video rather than accepting cached intermediates;
3. compare candidate output against baseline tolerance bands for CAY-specific defensible metrics;
4. treat bounds as regression alarms, never as proof that a statistic is physically valid;
5. never turn an unavailable metric into an approximate value merely to satisfy a band.

Candidate CAY gates, once a representative club clip and baseline artifact are available:
- valid tracking coverage and per-roster identity coverage;
- ID switches / fragmentation;
- CAY false-positive count, especially yellow-detail false positives;
- bench/spectator leakage;
- metric-field coverage and calibration residual median/p95;
- rejected cut-crossing samples (must remain zero accepted crossings);
- trajectory/heatmap sample parity with the canonical validated metric stream;
- runtime / time-to-first-results;
- later: ball detection coverage and event precision/recall.

## Why this is useful now
CAY-STABLE already contains multiple CI workflows and many specialised runtime modules. A stable build can still regress semantically while syntax/tests remain green. Baseline-derived tolerance gates give a cheap intermediate safety net between unit tests and expensive/manual video review.

## Legal/dependency boundary
The upstream repository is MIT, but its current requirements include third-party packages such as Ultralytics. Their licenses and model/weight terms are separate. This adaptation imports none of them and creates no new runtime dependency.

## Estimated saving / impact
- Estimated work avoided: 0.5–1 day of designing the regression-baseline policy and cache-invalidation discipline.
- Expected impact: faster detection of silent tracking/calibration regressions; safer dependency/model upgrades; measurable before/after comparisons instead of crash-only validation.
- Status: studied; validation policy adapted; runtime code not imported.

## Integration rule
Do not add a second benchmark pipeline. Extend the existing CAY benchmark/integration contracts when representative baseline artifacts are available. A candidate may only be committed/merged after syntax + non-regression checks pass, and `INDISPONIBLE` remains authoritative whenever evidence is insufficient.