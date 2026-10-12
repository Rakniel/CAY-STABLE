# CAY-STABLE — downstream cache invalidation (2026-10-11)

## Provenance and license
- Internal component: `analysis_artifact_contract_v1.js`, contract `CAY_ANALYSIS_ARTIFACT_CONTRACT_V1`.
- Existing CAY functions reused: `DOWNSTREAM`, `invalidatedStages()`, `isReusable()`. No duplicate graph or new dependency.
- Conceptual reference only: TrackLab (MIT), https://github.com/TrackingLaboratory/tracklab, modular detection/tracking/ReID pipelines. No external source code or weights copied; upstream revision not pinned because no code was integrated.

## Change and validation
- A missing, stale, mismatched or cross-analysis artifact invalidates itself and all dependent stages. `changed` continues to describe only explicit changes.
- Baseline: 5 of 7 stage types failed to invalidate all dependents (25 failures over 5 runs).
- After: 190 V8 assertions passed across 5 runs, including unchanged, stale, missing, explicit-change and cross-analysis scenarios.
- Full Node CI, browser, real-video and 20-minute workflow acceptance are separate gates.

## Risk
Additional recomputation may increase processing time, but prevents reusing obsolete trajectories, heatmaps and metrics. No external runtime dependency or C.A. Yenne UI/logo changes.
