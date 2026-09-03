# SoccerTrack v2 — roster / game-state adaptation audit

Date: 2026-09-03

## Source

- Project: `AtomScott/SoccerTrack-v2`
- Repository: https://github.com/AtomScott/SoccerTrack-v2
- Audited revision: `6f5c47cd3a5c38b074c44e9c98dfba48daa230d3`
- Source-code licence: MIT
- Dataset licence: separate from code; SoccerTrack v2 documents the dataset separately (`LICENSE-DATA`). No dataset content is copied or bundled by CAY-STABLE.

## What was useful

SoccerTrack v2 treats football analysis as game-state reconstruction rather than as isolated detections. For CAY-STABLE, the useful architectural idea is that player identity/track state must stay attached to the current team/game state, including the selected on-field group and substitutes.

## CAY-STABLE adaptation

No SoccerTrack v2 code, model weight, dataset sample, annotation or configuration is copied.

CAY-STABLE already had its own `createTeam()` and `validateLineup()` contracts with a roster that may exceed 11 players, a maximum of 11 simultaneously selected on field, and an explicit bench. The club roster UI, however, dropped `defaultLineup` and `bench` when normalizing/saving the team object. That made the persistent club game state weaker than the domain contract.

The adaptation therefore extends the existing CAY storage path instead of adding a second lineup model:

- preserve `defaultLineup` during roster normalization and local round-trip;
- preserve `bench` during roster normalization and local round-trip;
- when a player is removed from the roster, remove stale references from both on-field selection and bench;
- keep the existing `validateLineup()` rule as the single authority for the 11-player simultaneous limit.

## Licence / compatibility decision

Status: **compatible / idea adapted**.

The upstream code licence is MIT. CAY-STABLE does not import or copy upstream source code in this change, so no new runtime dependency or licence notice is required for bundled code. This audit record is retained for provenance.

## Gain

Estimated work avoided: **0.25–0.5 day** by reusing the existing CAY team/lineup domain contract rather than creating a new match-state subsystem.

Expected measurable impact:

- roster >11 remains supported;
- selected XI and bench no longer disappear after UI persistence;
- player deletion cannot leave stale lineup/bench identifiers;
- future substitutions and active-lineup UI can extend the same domain object cleanly.

## Risks / dependencies

- This change does not yet implement a full substitution timeline; it only makes persisted roster state reliable enough to add one without migration or duplicate state.
- Browser local storage remains a local UI persistence layer, not an authentication or server backend.
