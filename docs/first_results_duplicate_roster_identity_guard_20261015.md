# Duplicate roster identity protection — 2026-10-15

- Scope: `first_results_testability_gate_v1.js` (existing CAY gate, extended in place).
- Problem: two simultaneously reported tracks could both claim the same official roster `playerId` and be published as separate CAY players.
- Rule: count linked nonblank roster IDs after trimming; if an ID is claimed by more than one linked track, **all claimants** are `INDISPONIBLE` with `ROSTER_PLAYER_ID_CONFLICT`. No arbitrary winner; educators must resolve identity explicitly.
- Other roster identities remain eligible. Non-linked tracks do not create conflicts. Legacy no-roster reports preserve existing behavior.
- `alignPlayerCards` recomputes canonical evidence, rather than trusting externally supplied or stale evidence.
- Provenance: native CAY-STABLE gate. External code copied: none. New external license/dependency: none. Existing upstream OSS references and license decisions remain documented in `OPEN_SOURCE_COMPONENTS.md`.
- Validation: 7 existing isolated JS regression suites plus 5 repetitions of duplicate/mixed/forged-evidence scenarios. Run `node --check first_results_testability_gate_v1.js`, `node --check tests/first_results_duplicate_roster_player_id_nonregression.js`, `node tests/first_results_duplicate_roster_player_id_nonregression.js`, and the repository's full CI before merging.
- Limitations: synthetic tests are not a browser or real-video validation; no accuracy improvement claimed on match footage. No backend/auth changes.
