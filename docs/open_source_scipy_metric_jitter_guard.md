# Open-source reference — metric jitter guard

## Source studied
- Project: SciPy
- Upstream: `scipy/scipy`
- Relevant primitive/principle: short local median filtering (`scipy.signal.medfilt` / `scipy.ndimage.median_filter`) for isolated non-Gaussian jitter, combined in CAY-STABLE with a raw-evidence veto before smoothing.
- Version re-verified: **SciPy v1.17.1**.
- Annotated tag object: `c59ed93db11e721de841c00f44b8d8b9c16a2548`.
- Release commit: `527eb7fd7953a1de068f94bf8b322f249b9405ae`.
- License: **BSD-3-Clause**, verified directly from `LICENSE.txt` at that release commit.
- Inspection/re-verification date: 2026-09-05.

## Useful upstream principle
Median filtering is appropriate for suppressing isolated impulse-like noise, but a smoothing stage must not be allowed to turn evidence that was physically impossible before filtering into apparently valid movement. CAY-STABLE therefore keeps the mature local-median idea while enforcing its own conservative football-specific raw-motion boundary before the filter is applied.

## CAY-STABLE adaptation
No SciPy source code is copied and no SciPy/Python runtime dependency is added.

`metric_quality_guard_v1.js` now applies the pipeline in this order:
1. build only continuous same-segment metric runs from explicitly validated projectors;
2. measure every **raw** consecutive metric pair before smoothing;
3. split the run whenever the raw pair implies more than **55 km/h** (or is non-finite/invalid);
4. keep the rejected interval in eligible time so coverage is penalized rather than silently erased;
5. only then apply the existing 3-point median independently on X/Y inside each surviving sub-run;
6. compute distance, speed and sprint evidence from those surviving sub-runs.

The 55 km/h veto reuses the conservative raw-spike boundary already present in the base CAY metric engine; this change closes the gap in the stronger `metric_quality_guard_v1.js` path instead of introducing a second threshold.

## What this replaces / work avoided
Before this change, the quality-guard path could median-filter a one-frame metric teleport first and thereby make its neighboring intervals look physically plausible. The base engine already had a raw >55 km/h rejection, but the robust quality layer that replaces player metrics at report time did not preserve that invariant.

This adaptation extends the existing CAY quality guard rather than adding another smoothing library or a second physical-metric engine. Estimated design/plumbing avoided: **0.25–0.5 day**, in addition to the original median-filter integration savings.

## Measured regression impact
Synthetic fixture, same segment, one-second samples: `x = [0, 1, 20, 3, 4] m`.

- Previous quality-guard behavior: the median stage could hide the isolated teleport and retain full-looking temporal coverage.
- New behavior: **2 raw spike edges rejected**, only **2 s / 4 s = 50%** of the timeline remain metric evidence, and only **2 m** of clean distance remain attributable.
- Clean linear trajectories keep `rejectedRawSpikePairs = 0` and preserve their distance/speed.

This is a deterministic non-regression fixture, not a claim about real-match error-rate reduction. The expected real-video effect is fewer inflated or falsely credible distance/speed/sprint values after isolated calibration/tracking jumps.

## Safety / invariants
- No smoothing across segment/camera cuts.
- No interpolation across missing, rejected, or raw-spike intervals.
- No metric output without an explicitly validated projector.
- Raw-spike veto occurs **before** smoothing and is auditable as `rejectedRawSpikePairs`.
- Existing post-smoothing >45 km/h physical rejection remains enforced.
- Rejected raw intervals reduce metric coverage instead of disappearing from the evidence denominator.
- Sprint continuity resets across every raw-spike split.
- Clean monotonic trajectories are preserved.

## Status
Integrated on `automation/metric-raw-spike-veto-20260905`, pending full CAY-STABLE CI validation and merge.

## Risks / limits
- `55 km/h` is a conservative CAY product safety boundary, not a SciPy threshold.
- A genuine but extremely fast short movement above the boundary will be excluded until real C.A. Yenne benchmarks justify another policy.
- Median filtering remains intentionally local and simple; it is not a substitute for better calibration, tracking or real-video validation.
- No external code, model, dataset, binary or additional dependency is imported.