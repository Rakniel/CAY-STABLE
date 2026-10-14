# CAY-STABLE — mixed roster evidence guard (2026-10-14)

- Source: internal `first_results_testability_gate_v1.js`; no third-party code imported or dependency added.
- Issue: when one player card contained `roster` but another card lacked that field, the latter was silently treated as a legacy CAY player.
- Fix: infer roster context once for the complete analysis. If any card declares roster data, only cards explicitly linked with `roster.status === 'LIÉ'` count as CAY.
- Legacy compatibility: a whole analysis with no roster fields retains the existing pre-roster behavior.
- Scope: eligibility, coverage denominators, player readiness, fallback card alignment. No detector or model weights changed.
- Regression: `tests/first_results_mixed_roster_context_nonregression.js` (5 repetitions, 12 checks each); targeted before/after reproduction found 2 eligible vs 1 eligible for one linked and one unscoped player.
- Validation status: targeted synthetic tests passed. Full repository CI, browser and real C.A. Yenne video remain required before shipping STABLE.
