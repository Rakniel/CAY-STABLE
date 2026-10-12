# Track–roster evidence guards — 2026-10-11

## Scope
Existing module: `track_roster_binding_v1.js`. Reject invalid confidence values rather than clamping them into a reliable score. Preserve valid numeric and numeric-string confidence in [0,1]. Do not coerce missing, blank, boolean, array or object timestamps into match time 0 when normalizing bindings or checking participation windows.

## Before/after (synthetic)
Five repeated rounds: 50/70 invalid confidence values accepted before, 0/70 after; 30/50 invalid participation timestamps incorrectly accepted at the first frame before, 0/50 after. The remaining invalid cases were already rejected. The targeted test also verifies genuine time 0, numeric-string time 0, half-open substitution boundaries and valid confidence values. Existing `tests/track_roster_binding_nonregression.js` passed five repetitions with the patched module (210 assertions in combined checks).

## Provenance / licenses
All changes extend CAY-owned JavaScript. External code, models, datasets and assets imported: **none**. No new dependency. Existing OSS design provenance remains in `OPEN_SOURCE_COMPONENTS.md`. No external license obligations introduced by this change.

## Validation boundary
JavaScript syntax and focused regression tests passed in an isolated JS environment. Full GitHub CI, browser integration, and representative C.A. Yenne footage are **not** validated by this patch. It does not claim better detection or on-field tracking accuracy.
