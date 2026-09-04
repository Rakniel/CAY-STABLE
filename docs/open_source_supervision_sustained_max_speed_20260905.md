# Open-source audit — Supervision sustained speed evidence

Date inspected/adapted: 2026-09-05

## Source
- Project: Roboflow Supervision
- Repository: https://github.com/roboflow/supervision
- Previously audited example: `examples/speed_estimation/yolo_nas_example.py`
- Previously audited blob: `b64a3eebb2e7f9c661fedc3fb6d52227cff7f93e`
- License: MIT for the Supervision analytics/example code audited. No detector/model dependency or model weight from the example is imported by CAY-STABLE.

## Useful upstream principle
The upstream speed-estimation example maintains temporal history per tracker and estimates speed only after perspective transformation into metric space, rather than treating one instantaneous observation as sufficient evidence.

## CAY-STABLE adaptation
No upstream code was copied. CAY-STABLE extends its existing `metric_publication_guard_v1.js` instead of introducing a second speed engine.

Before this change, `player_stats_v1.js` retained the largest accepted pairwise speed as `maxSpeedKmh`. The publication guard required three seconds of continuous metric evidence overall, but the displayed maximum itself could still be determined by a single accepted pair.

The publication layer now:
- preserves that original peak as `instantaneousMaxSpeedKmh` for diagnostics;
- derives `sustainedMaxSpeedKmh` only from same-segment continuous speed samples;
- requires a candidate maximum window to span at least 1 second and at least 2 consecutive valid intervals;
- forbids a candidate window from crossing a camera/metric segment boundary or a gap greater than 1 second;
- publishes `maxSpeedKmh` from this sustained evidence rather than the standalone instantaneous peak;
- keeps all rejected/raw values auditable in diagnostics and remains fail-closed when sustained evidence is absent.

## What this replaces / work avoided
This extends the already validated CAY metric publication path and reuses the mature temporal-history principle instead of adding another bespoke speed estimator. Estimated design/plumbing avoided: **0.25–0.5 day**.

## Expected/measurable impact
- A standalone max-speed scalar not supported by the continuous `speedSamples` series can no longer become the UI-facing maximum.
- In the regression fixture, an unsupported `31.1 km/h` instantaneous peak is retained diagnostically while the publishable maximum becomes `19.5 km/h`, the strongest supported continuous window.
- Segment cuts explicitly prevent a max-speed window from spanning two camera plans.
- No new runtime dependency, Python package, GPU requirement or model weight is added.

## Status
Integrated on feature branch pending full CAY-STABLE CI validation and merge.

## Risks / limits
- The 1-second / 2-interval sustained-window policy is a conservative CAY product rule, not an official Supervision threshold.
- Very low-cadence tracking can make a peak unavailable even when visually plausible; this is intentional until real C.A. Yenne video benchmarks justify relaxation.
- This improves publication defensibility, not detector/tracker/calibration accuracy itself.
