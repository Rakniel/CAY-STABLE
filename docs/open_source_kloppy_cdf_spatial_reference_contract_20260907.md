# Kloppy / Common Data Format spatial-reference contract — CAY-STABLE

## Provenance audited

### PySport/kloppy
- Project: `PySport/kloppy`
- Version reviewed: `3.19.0` (current documentation on 2026-09-07)
- License: BSD-3-Clause
- Sources reviewed: coordinate-system and dataset-transformation documentation.
- Useful upstream concept: football positional data is not safely interchangeable unless coordinate system, origin/axis convention, pitch dimensions and orientation are explicit.

### Common Data Format for Football / validator
- Specification site reviewed: CDF `0.3.1` on 2026-09-07.
- Validator project: `UnravelSports/common-data-format-validator`.
- Validator release context reviewed: `0.0.14` (2026-03-19).
- Validator license: MIT.
- Useful upstream concept: football tracking/event/video artifacts should carry contextual metadata and be schema-validatable instead of relying on undocumented positional conventions.
- Licensing boundary: no CDF JSON schema, validator code, Python package, model or dataset is copied into CAY-STABLE. The CDF schema files themselves are not vendored by this change; the adaptation is limited to the independently implemented metadata/validation principle.

## CAY-STABLE adaptation

`analysis_artifact_contract_v1.js` is extended rather than creating a parallel cache/provenance system. Artifact descriptors may now carry an optional normalized `spatialReference` with:

- `coordinateSystem` (required when a spatial reference is supplied),
- `unit`,
- `origin`,
- `xAxisDirection`,
- `yAxisDirection`,
- `orientation`,
- `normalized`,
- paired positive `pitchLengthM` / `pitchWidthM`.

The artifact contract remains backward compatible: legacy descriptors without spatial metadata remain valid and current reuse behavior is unchanged unless a caller explicitly supplies an expected `spatialReference`.

When an expected reference is supplied, cache reuse is rejected if the stored reference differs. This includes attacking-orientation, pitch-geometry or axis-convention changes. A metric artifact with no spatial reference cannot satisfy an explicit spatial expectation.

## What this replaces / avoids

This replaces future ad-hoc coordinate/orientation checks in each metric consumer. It centralizes the reuse safety rule in the existing artifact descriptor and reuse planner instead of duplicating logic in heatmaps, trajectories, player metrics, ball events and export adapters.

Estimated avoided work: roughly **0.5–1 day** of repeated metadata plumbing and cache-invalidation fixes as CAY-STABLE connects metric trajectories, ball events and external football formats.

## Expected measurable impact

- prevents stale metric artifacts from being silently reused after a pitch-dimension, axis or orientation convention changes;
- reduces risk of mirrored/re-scaled trajectories and heatmaps entering player cards through cache reuse;
- prepares a legal, dependency-free seam for later CDF/Kloppy-compatible export without changing the current runtime coordinate math;
- zero new runtime dependency and no change to existing metric publication thresholds, coverage gates or `INDISPONIBLE` behavior.

## Tests added

`tests/analysis_artifact_contract_nonregression.js` now verifies:

1. legacy descriptors remain valid;
2. spatial metadata round-trips deterministically;
3. identical references are reusable;
4. orientation, pitch-geometry and axis changes reject reuse;
5. unlabelled metric artifacts cannot satisfy an explicit spatial expectation;
6. malformed/partial pitch dimensions and missing coordinate-system identifiers are rejected;
7. the existing `planReuse` dependency graph reacts correctly when the expected spatial convention changes.

## Risks / limitations

- This change does **not** infer coordinate systems. Callers must provide them explicitly.
- It does **not** transform coordinates; existing CAY projection and attacking-direction modules remain authoritative.
- Spatial-reference comparison is opt-in to preserve backward compatibility. Promotion into every metric artifact producer should happen incrementally, with tests, rather than through a breaking contract migration.
