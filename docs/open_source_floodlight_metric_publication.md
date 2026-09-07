# floodlight reference — defensible physical metric publication

- Upstream project: `floodlight-sports/floodlight`
- Upstream release inspected: `1.2.0` (2026-05-04)
- Upstream commit inspected: `699b7fa1e37f6de2351079d64508551bf5fb9ad7`
- License: MIT
- Source: https://github.com/floodlight-sports/floodlight
- CAY-STABLE status: design/data-processing principle adapted; no upstream source code copied and no Python dependency added.

## Useful upstream principle

floodlight treats physical tracking properties (including distance, velocity and acceleration) as products of an explicit sports-tracking processing pipeline and documents filtering/pre-processing before derived kinetics. Version 1.2.0 also expands temporal resampling/interpolation/filtering support. This reinforces a strict separation between raw/diagnostic tracking evidence and physical quantities suitable for downstream analysis.

A second useful consequence for CAY-STABLE is to keep derived quantities field-scoped: a quantity should be published from the evidence it actually needs rather than forcing every physical statistic through the strongest temporal requirement of every other statistic.

## CAY-STABLE adaptation

CAY-STABLE computes physical evidence only after validated pitch-metre projection, per-segment temporal boundaries, impossible-speed rejection and conservative local smoothing. `metric_publication_guard_v1.js` does not recompute the trajectory. It remains a final fail-closed publication contract on top of the metric-quality guard.

Version `CAY_METRIC_PUBLICATION_GUARD_V1_3` keeps the common safety floor unchanged:

- reliable player identity is required;
- at least `3 s` of valid metric trajectory is required;
- the combined defendability score must be at least `0.80` and the metric evidence quality must already be `FIABLE`;
- raw diagnostic values remain retained for audit/debugging;
- team distance is recomputed only from player distances that pass publication.

It then applies evidence requirements by field:

- **distance** may be published from multiple validated metric windows when the common safety floor passes; temporal gaps are never interpolated and contribute no distance;
- **average speed and sprints** additionally require at least `3 s` of continuous speed evidence inside valid metric segments;
- **maximum speed** additionally requires a finite source peak and a sustained peak window, rather than a one-sample maximum.

This is intentionally more useful without being less conservative: a camera cut or short visibility gap no longer hides a defensible accumulated distance, while speed/sprint outputs remain `INDISPONIBLE` until their stronger temporal evidence exists.

## What this replaces

The previous publication guard used one shared continuity gate for distance, average speed and sprints. That meant a player could have high-confidence calibrated distance accumulated over several valid windows yet still receive `INDISPONIBLE` for distance solely because no single speed run lasted `3 s` continuously.

The field-scoped contract removes that coupling. It does **not** bridge camera cuts, estimate missing metres, loosen the identity gate, lower the `0.80` evidence threshold, or turn partial evidence into a precise-looking value.

## Tests

`tests/metric_publication_guard_nonregression.js` covers reliable publication, uncertain identity suppression, partial-evidence suppression, insufficient observed duration, calibration absence, sustained maximum speed, camera-plan boundaries and the new field-scoped case where reliable fragmented metric windows publish distance while average speed/max speed/sprints remain `INDISPONIBLE`.

## Estimated engineering gain

Extending the existing publication contract instead of creating a second metric pipeline avoids roughly `0.25–0.5 day` of duplicate data plumbing and UI-condition logic. The expected product impact is earlier availability of a defensible first physical result (distance) on real club footage with camera cuts, without weakening any speed or sprint gate.

## Dependency / license impact

No runtime package, model weight, Python stack, floodlight source file or floodlight test is copied. The adaptation is implemented in native CAY-STABLE JavaScript and only the MIT-licensed upstream processing principle is referenced. There is no new runtime dependency.
