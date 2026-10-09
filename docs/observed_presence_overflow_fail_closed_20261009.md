# Observed-presence overflow: fail-closed evidence (2026-10-09)

## Source and license
- Source of changed code: existing CAY-STABLE modules `observed_presence_v1.js` and `observed_presence_report_v1.js`.
- No third-party source code, models, weights or assets incorporated. No additional license obligations or runtime dependencies.
- External MOT tracking and evaluation interfaces already documented in `OPEN_SOURCE_COMPONENTS.md` are unchanged.

## Bug / before
The presence ledger sorted >11 unique candidate IDs and silently kept the top 11, then marked that instant `FIABLE` with 100% coverage. The report could not distinguish a genuine eleven-player observation from a truncated twelve-player candidate frame. A candidate rejected by truncation could also distort roster observations.

## After
An overflow instant is `INDISPONIBLE`, with zero confirmed players for that instant and explicit `candidateCount`, `rejectedOverflowCount`, `evidenceValid=false` and `evidenceReason`. No roster observation is added for that instant. The report's existing frame-identity audit now rejects the source overflow and excludes that instant from valid-frame coverage denominators, while retaining rejected-count diagnostics without double-counting the source rejection. Valid <=11-player instants and later substitutes remain supported.

## Validation and acceptance
- Before: 12 unique candidates -> 11 published as `FIABLE`; after: 12 -> 0 confirmed, `INDISPONIBLE`.
- Local isolated V8 execution of six existing/new presence test suites, five consecutive repetitions: 30 suite executions passed. Syntax of nine involved JavaScript sources checked.
- New `tests/observed_presence_overflow_fail_closed_nonregression.js` covers source rejection, no roster pollution, later valid eleven, invalid report frame, correct denominator and no overflow double count.
- Requires GitHub Actions integration CI and representative C.A. Yenne video before any STABLE production promotion.
