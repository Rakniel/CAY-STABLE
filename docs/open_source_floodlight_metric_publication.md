# floodlight reference — defensible physical metric publication

- Upstream project: `floodlight-sports/floodlight`
- Upstream release inspected: `1.2.0` (2026-05-04)
- Upstream commit inspected: `699b7fa1e37f6de2351079d64508551bf5fb9ad7`
- License: MIT
- Source: https://github.com/floodlight-sports/floodlight
- CAY-STABLE status: design/data-processing principle adapted; no upstream source code copied and no Python dependency added.

## Useful upstream principle

floodlight treats physical tracking properties (including distance, velocity and acceleration) as products of an explicit sports-tracking processing pipeline and documents filtering/pre-processing before derived kinetics. Version 1.2.0 also expands temporal resampling/interpolation/filtering support. This reinforces a strict separation between raw/diagnostic tracking evidence and physical quantities suitable for downstream analysis.

## CAY-STABLE adaptation

CAY-STABLE already computes distance, speed and sprint evidence only after validated pitch-metre projection, per-segment temporal continuity, local trajectory smoothing and impossible-speed rejection. The new `metric_publication_guard_v1.js` does not recompute those values. It adds a final publication contract on top of the existing metric-quality guard:

- raw diagnostic physical values remain retained for audit/debugging;
- distance, average speed, maximum speed and sprint values are exposed as publishable only when the existing metric evidence is `FIABLE`, the combined evidence score is at least `0.80`, and at least `3 s` of valid metric trajectory are available;
- otherwise the displayable values become `INDISPONIBLE` instead of presenting a precise-looking number from partial evidence;
- team distance is recomputed from publishable player metrics only.

## What this replaces

Before this guard, `metric_quality_guard_v1.js` correctly marked weak evidence as `PARTIEL`, but still returned numeric distance/speed/sprint fields. A consumer could therefore accidentally display a partial number as if it were a reliable statistic. The publication guard makes the conservative contract machine-enforceable without deleting the diagnostics.

## Tests

`tests/metric_publication_guard_nonregression.js` covers reliable publication, partial-evidence suppression, insufficient observed duration and total calibration absence.

## Dependency / license impact

No runtime package, model weight, Python stack or copied floodlight source is introduced. The adaptation is implemented in native CAY-STABLE JavaScript and only the MIT-licensed upstream processing principle is referenced.
