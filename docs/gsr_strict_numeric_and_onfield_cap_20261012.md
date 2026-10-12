# CAY-STABLE — SoccerNet GSR numeric evidence and 11-player guard (2026-10-12)

## Provenance and licenses
- Modified module: `soccernet_gsr_export_v1.js` (pre-existing CAY-STABLE implementation); no third-party code copied.
- SoccerTrack v2: https://github.com/AtomScott/SoccerTrack-v2 — MIT code; dataset CC BY 4.0. Format/reference only, no source/model/data imported.
- SoccerNet GSR: https://github.com/SoccerNet/sn-gamestate — GPL-3.0. Benchmark reference only; GPL code not imported.
- Runtime dependencies added: none. Existing `CAY_STABLE_GSR_EXPORT_V1` contract retained.

## Scope
Reuse the existing exporter numeric predicate but reject boolean/array/object coercion for frames, coordinates, jersey numbers and FPS. Keep finite numeric values and nonblank numeric strings. Invalid/nonpositive FPS defaults to 25. Configured CAY simultaneous-player limit may be lowered but never raised above 11; off-field substitutes remain eligible for the larger roster.

## Validation and limitations
The new `tests/soccernet_gsr_strict_numeric_nonregression.js` contains 37 assertions, including invalid evidence, a 12-player on-field frame, a 12-player roster with one substitute, and valid numeric-string compatibility. Local Node.js 22 checks and both GSR test suites passed five times before commit; syntax checks passed five times. The existing test `tests/soccernet_gsr_export_nonregression.js` remained green. Full GitHub CI, real-footage validation, browser smoke test and sub-20-minute educator workflow are separate release gates. This patch does not improve detector/tracker accuracy.

## Risk
Previously coerced booleans, arrays and objects are now rejected; upstream consumers sending such values must be fixed rather than silently accepted. No code from GPL repositories is distributed here.
