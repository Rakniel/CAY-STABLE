# Kloppy substitution-state audit — CAY-STABLE

- Project: PySport/kloppy
- Source: https://github.com/PySport/kloppy
- Upstream revision inspected: `51dbd38c4fb48c0815119e23ff9a3a68ea06be52` (2026-08-06)
- License: BSD-3-Clause, verified from upstream `LICENSE` at the inspected revision.
- Upstream behavior inspected: football event deserializers model substitutions as chronological match events; Second Spectrum support explicitly treats `player_on` / `player_off` as parts of one substitution event.
- CAY-STABLE status: design/data-contract idea adapted. No Kloppy source code, dataset, provider implementation or dependency copied into CAY-STABLE.

## Why this is useful for CAY-STABLE

CAY already stores a roster larger than 11 plus `defaultLineup` and `bench`, but tracking and future event attribution need a time-aware answer to a different question: **which C.A. Yenne players are eligible to be on the pitch at this instant?** A static pre-match XI cannot answer that after the first substitution.

## Local adaptation

`app_domain_models_v1.js` now exposes:

- `validateMatchParticipants(team, activePlayerIds, benchPlayerIds)` — preserves the hard maximum of 11 simultaneously active players and rejects unknown/inactive/duplicated/overlapping roster identities.
- `createMatchState(team, raw)` — creates an explicit immutable active-XI + bench state from the configured roster.
- `applySubstitution(team, state, event)` — applies one chronological `outPlayerId` + `inPlayerId` transition, records `atMs` and reason, and revalidates the resulting match state.

The adaptation deliberately keeps outgoing players in the match bench state instead of deleting their identity. That is important for persistent per-player histories: a player who leaves the field must keep his already-earned tracking/metric evidence while becoming ineligible for new on-pitch association until another explicit state transition says otherwise.

## What this replaces / avoids

- Replaces the implicit assumption that `defaultLineup` remains the on-field set for the whole video.
- Avoids building a separate substitution/event roster model later inside ball-event or tracking code.
- Creates one reusable domain contract that tracking, bench exclusion, player cards and future possession/pass attribution can consume.

## Safety and integrity rules

- Maximum 11 active players is enforced after every transition.
- Incoming player must currently be on the bench state.
- Outgoing player must currently be active.
- Inactive roster members are rejected from active/bench match participation.
- Substitution timestamps cannot regress; chronological evidence remains auditable.
- Previous state objects are not mutated.
- No backend/auth behavior is simulated or added.

## Test

`tests/match_substitution_state_nonregression.js` covers initial XI/bench creation, valid substitutions, immutability, 11-player preservation, chronological accumulation, invalid incoming/outgoing players, timestamp regression and inactive-roster rejection.

## Expected impact / time saved

Estimated 0.5–1 day of later refactoring avoided by defining active-player eligibility once at the domain layer before tracker/event modules start consuming it. Expected measurable impact is fewer false player associations to bench identities after substitutions and a clean basis for per-player coverage windows (`on-pitch` vs `off-pitch`) without inventing tracking evidence.