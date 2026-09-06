# Kloppy substitution-state audit — CAY-STABLE

- Project: PySport/kloppy
- Source: https://github.com/PySport/kloppy
- Release revalidated for this adaptation: `v3.19.0`, tag commit `99f76f0938402f273ac3e84dc1929719504eff94`.
- Earlier upstream revision inspected for provider behavior: `51dbd38c4fb48c0815119e23ff9a3a68ea06be52` (2026-08-06).
- License: BSD-3-Clause, verified from upstream `LICENSE` on `v3.19.0`.
- Upstream behavior inspected: Kloppy represents a substitution as one timestamped `SubstitutionEvent` in which a player is replaced by `replacement_player`; its event dataset also updates formations/positions from those substitution events.
- CAY-STABLE status: design/data-contract idea adapted. No Kloppy source code, dataset, provider implementation or dependency copied into CAY-STABLE.

## Why this is useful for CAY-STABLE

CAY already stores a roster larger than 11 plus `defaultLineup` and `bench`, but tracking and future event attribution need a time-aware answer to a different question: **which C.A. Yenne players are eligible to be on the pitch at this instant?** A static pre-match XI cannot answer that after the first substitution.

A substitution also needs one unambiguous ownership rule at its exact timestamp. If both the outgoing and incoming windows include the event time, one video observation can be attributed to both players and the temporal representation can momentarily expose 12 eligible CAY identities even though the match-state transition itself still contains 11.

## Local adaptation

`app_domain_models_v1.js` exposes:

- `validateMatchParticipants(team, activePlayerIds, benchPlayerIds)` — preserves the hard maximum of 11 simultaneously active players and rejects unknown/inactive/duplicated/overlapping roster identities.
- `createMatchState(team, raw)` — creates an explicit immutable active-XI + bench state from the configured roster.
- `applySubstitution(team, state, event)` — applies one chronological `outPlayerId` + `inPlayerId` transition, records `atMs` and reason, and revalidates the resulting match state.
- `deriveParticipationWindows(...)` — converts the chronological substitution history into per-player participation windows.
- `isPlayerActiveAt(...)` and `splitTrackEvidenceByParticipation(...)` — now consume the same shared half-open interval predicate instead of duplicating boundary logic.

For every finite substitution boundary CAY-STABLE uses **half-open windows `[startMs, endMs)`**. Therefore the outgoing player is active immediately before `atMs` but not at `atMs`; the incoming player owns `atMs` and subsequent observations until the next substitution boundary. Open-ended final windows remain active from `startMs` onward.

The adaptation deliberately keeps outgoing players in the match bench state instead of deleting their identity. That is important for persistent per-player histories: a player who leaves the field must keep his already-earned tracking/metric evidence while becoming ineligible for new on-pitch association until another explicit state transition says otherwise.

## What this replaces / avoids

- Replaces the implicit assumption that `defaultLineup` remains the on-field set for the whole video.
- Replaces the previous inclusive-end boundary that could attribute the exact substitution timestamp to both outgoing and incoming players.
- Avoids building a separate substitution/event roster model later inside ball-event or tracking code.
- Avoids separate, potentially divergent interval predicates for active-state checks and metric-evidence filtering.
- Creates one reusable domain contract that tracking, bench exclusion, player cards and future possession/pass attribution can consume.

## Safety and integrity rules

- Maximum 11 active players is enforced after every transition and at exact substitution timestamps in temporal participation queries.
- Incoming player must currently be on the bench state.
- Outgoing player must currently be active.
- Inactive roster members are rejected from active/bench match participation.
- Substitution timestamps cannot regress; chronological evidence remains auditable.
- A tracking observation exactly on a substitution timestamp is attributed at most once: to the incoming player.
- Previous state objects are not mutated.
- No backend/auth behavior is simulated or added.

## Tests

`tests/match_substitution_state_nonregression.js` covers initial XI/bench creation, valid substitutions, immutability, 11-player preservation, chronological accumulation, invalid incoming/outgoing players, timestamp regression and inactive-roster rejection.

`tests/app_domain_models_nonregression.js` additionally locks the exact-boundary contract: outgoing active at `atMs-1`, outgoing inactive at `atMs`, incoming active at `atMs`, exactly 11 active identities at the boundary, and single attribution of trajectory observations across successive substitutions.

## Expected impact / time saved

Estimated **0.1–0.25 day** of bespoke event-boundary design and later debugging avoided by reusing the mature timestamped-substitution concept while keeping the implementation native to CAY-STABLE. The measurable target is strict: at every exact substitution timestamp the temporal roster must expose **11 or fewer active identities**, and one trajectory observation must be accepted by **at most one** of the outgoing/incoming participation windows.

Risk: video/provider timestamps may be quantized to a frame boundary. CAY deliberately assigns that boundary frame to the incoming player rather than guessing a fractional transition; the rule is deterministic, auditable and can be revised later only if representative C.A. Yenne footage provides stronger timing evidence.