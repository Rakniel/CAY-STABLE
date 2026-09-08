# socceraction / SPADL event-contract adaptation — 2026-09-08

## Source
- Project: `ML-KULeuven/socceraction`
- Repository: https://github.com/ML-KULeuven/socceraction
- Audited revision: `93a1242d46c104889205753accaabadb00c45c6d`
- Package version observed in `pyproject.toml`: `1.5.3`
- License: MIT

## What was reused
Only the mature architectural idea of a normalized football action stream was adapted: one action record carries a stable action type, time, actors/teams, result and optional spatial start/end evidence. This is a clean-room JavaScript contract inspired by SPADL's role as a provider-neutral football action representation.

No socceraction Python source code, package, dataset, model, notebook or generated data was copied or imported.

## CAY-STABLE implementation
- New local component: `football_event_contract_v1.js`.
- Input: the already-existing, evidence-gated result from CAY ball-event analysis.
- Current mapped action types: verified `PASS` and `TURNOVER` only.
- Unsupported source events are counted and skipped rather than guessed.
- If the source analysis is not `FIABLE`, the action artifact is `INDISPONIBLE` and publishes zero actions.
- Match/period identifiers are never invented when absent.
- Start/end pitch coordinates remain explicitly `INDISPONIBLE` until the authoritative CAY event source publishes those coordinates; this adapter never reconstructs or guesses them.

## What this replaces
Without a common action contract, every later feature (pass network, action timeline, shot pipeline, xT/VAEP-style experiments, exports) would need its own bespoke translation from CAY event objects. The adapter centralizes that translation without duplicating any possession/pass inference.

## Expected gain
Estimated 0.5–1 day of schema/plumbing avoided for each future event-consumer family, plus lower risk of diverging event semantics between UI, exports and later analytics.

No accuracy gain is claimed: this component changes representation only, not event inference.

## Risks / dependencies
- SPADL itself is not a runtime dependency.
- Future xT/VAEP use must be separately validated and must not turn an uncertain video-derived event into a defended statistic.
- Spatial action analytics remain blocked while event start/end coordinates are unavailable.
- Any future external dataset or model requires its own provenance and license review.

## Status
Integrated on feature branch; merge only after CAY root syntax, STABLE integration/non-regression and calibration V2 checks pass.
