# CAY-STABLE observation evidence integrity (2026-10-09)

## Existing CAY logic reused
- Producer: `strict_tracking_frame_guard_v1.js` already computes attempted, usable and unavailable observation frames, rounded coverage and FIABLE/PARTIEL/INDISPONIBLE quality.
- Consumer: `first_results_runtime_guard_bridge_v1.js` already blocks visual/physical publication according to observation quality. This change strengthens its existing evidence intake, without adding a second readiness gate.
- New test: `tests/first_results_observation_integrity_nonregression.js`.

## Before / after
- Before: a contradictory declared FIABLE quality with zero usable frames could still allow physical results.
- After: counts must be nonnegative integers with usable + unavailable = attempted > 0; numeric coverage must match the ratio within four-decimal rounding tolerance; declared quality must match the ratio.
- Any present but inconsistent observation contract becomes INDISPONIBLE, with OBSERVATION_EVIDENCE_INCONSISTENT diagnostic. Zero attempted frames cannot publish stale results.
- Reports without the observation contract retain the pre-existing legacy path, pending end-to-end runtime validation.

## External components and licensing
No third-party code, model or weight imported; zero new runtime dependencies. Existing upstream references and their licenses remain recorded in `OPEN_SOURCE_COMPONENTS.md`.

## Validation
Existing first-results runtime tracking/coverage test passed with both old and patched modules in an isolated JavaScript harness. New 5-valid/10-invalid-scenario test passed 5 repetitions (JavaScript harness). CI and real-video validation required before merging.
