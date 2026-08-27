# Open-source reference — metric jitter guard

## Source studied
- Project: SciPy
- Upstream: scipy/scipy
- Relevant primitive: local median filtering (`scipy.signal.medfilt` / `scipy.ndimage.median_filter`)
- License: BSD-3-Clause
- Reference checked: SciPy 1.17.x documentation/repository family (2026)

## CAY-STABLE adaptation
CAY-STABLE does not copy SciPy source code and does not add SciPy/Python as a runtime dependency. We adapt only the established signal-processing principle: a short odd-sized local median window suppresses isolated non-Gaussian spikes while preserving monotonic movement better than a simple mean filter.

`metric_quality_guard_v1.js` applies a 3-point median independently on projected metric X/Y coordinates inside each continuous, calibrated segment before computing distance, speed and sprint episodes.

## Safety / invariants
- No smoothing across segment/camera cuts.
- No interpolation across missing or rejected metric samples.
- No metric output without an explicitly validated projector.
- Existing >45 km/h physical rejection remains enforced.
- Clean monotonic trajectories are preserved.
- Team totals are recomputed from guarded player metrics.

## Expected gain
Estimated engineering work avoided: roughly 0.5–1 day, plus reduced risk of inflated distance/speed statistics.

## Status
Integrated and covered by `tests/metric_quality_guard_nonregression.js`.
