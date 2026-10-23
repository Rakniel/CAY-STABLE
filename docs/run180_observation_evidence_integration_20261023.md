# RUN180 — Observation evidence fail-closed (2026-10-23)

## Scope and provenance
- Repository: Rakniel/CAY-STABLE; source: `first_results_runtime_guard_bridge_v1.js`.
- Original blob SHA: `b67201c064d0ee2b63f7aabad5e138d2af30330c`.
- Modified source blob SHA: `0bb38b6df38e7466bea578d776c7c26f242e9f40`.
- Original source is an existing CAY module; the change extends it, not a second guard.
- No third-party source code, model weights, or new dependency imported. External component version/license: **not applicable** for this change.

## What changed
The existing observation-state function now checks the complete producer contract when any observation evidence is present:
1. finite safe integer frame counts; attempted > 0;
2. usable + unavailable = attempted;
3. coverage within [0,1] and consistent with usable/attempted within 0.0001 (producer rounds to four decimals);
4. declared quality never exceeds measured quality; missing declaration is unavailable;
5. booleans, arrays, objects, blank values and non-finite numbers do not count as numeric evidence.

Missing **all** observation fields still preserves legacy diagnostic behavior. This is an explicit migration gap: a future mandatory producer contract should fail closed on completely absent evidence, but that requires integration testing on real analysis sessions.

## Measured tests
- Before/after on 22 synthetic scenarios x 3: 15/66 expected verdicts before; 66/66 after.
- New non-regression test: 187 assertions, including publication fail-closed on a contradictory report.
- Existing runtime tracking/coverage and testability runtime non-regressions: 68 assertions passed in V8 harness.
- Syntax compiled for the changed module and the two existing test files.
- **Not yet proven**: full Node CI, browser E2E, real-video accuracy, performance speedup. No such claims should be made.

## Legal and architectural boundaries
- External projects considered in prior runs (OpenCV Apache-2.0; ByteTrack MIT; BoT-SORT MIT; TrackLab MIT) are **not imported** here.
- Existing CAY code ownership/license is not inferred from third-party component licenses.
- No new frontend or backend auth behavior, no passwords, no synthetic football stats introduced.

## Remaining delivery gate
Merge only after repository CI is green, actual browser/video path is exercised, and representative club footage demonstrates defendable coverage and first results. Physical metrics remain **INDISPONIBLE** when evidence is inadequate.
