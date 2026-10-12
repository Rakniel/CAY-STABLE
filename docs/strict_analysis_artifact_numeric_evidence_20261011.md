# CAY-STABLE — strict numeric evidence in analysis artifacts (2026-10-11)

## Origin and license
- Source: internal CAY-STABLE module `analysis_artifact_contract_v1.js`, prior blob `70be5cc9bce420d664b9757ba591328562fccc02`.
- External code/dependencies: none. No new third-party license obligations.
- Change: reuse the strict numeric-evidence rule already applied to CAY heatmaps and first-results gates, rather than introducing another validator dependency.

## Failure prevented
Previously, JavaScript numeric coercion could turn `true` into coverage/confidence `1`, `false` or `[]` into `0`, and `[0.8]` into `0.8`. A supplied pitch dimension such as `false` could also be silently treated as missing. The artifact contract now accepts only finite numbers or non-blank numeric strings for these fields. Explicit malformed pitch dimensions are rejected; omitted dimensions remain optional.

## Measured verification
- Baseline: 6 of 7 coercible invalid values yielded numeric coverage.
- After: 0 of 7 yield numeric coverage or confidence.
- Valid numeric evidence: 6/6 representative cases preserved.
- Four existing regression suites (analysis artifact contract, first-results readiness, setup SLA and auth) were run 5 times in an isolated JavaScript V8 harness; 525 total assertions including the targeted checks passed.
- The new regression test is intended for the repository's Node 20 GitHub Actions test loop. Full CI, browser and real-video validation remain separate gates.

## Risk and scope
No UI/logo change, no additional browser dependency, no relaxation of `INDISPONIBLE`. This does not prove on-field tracking accuracy or end-to-end setup under 20 minutes.
