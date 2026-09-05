# Glass Onion — team-scoped player identity adaptation (2026-09-05)

## Upstream provenance

- Project: `USSoccerFederation/glass_onion`
- Source: https://github.com/USSoccerFederation/glass_onion
- Package version inspected: `1.0` (`pyproject.toml`).
- Revision inspected: `52871b78c36b035e6ed7248a436b9d71533e5ab1` (2026-03-30).
- License: BSD-3-Clause, verified from the upstream `LICENSE` file.
- Upstream role: synchronize soccer object identifiers across sources.

Glass Onion models a player as depending on the higher-order `Team` object and includes `team_id` among the player matching fields. CAY-STABLE reuses only this identity-design principle: a football player identifier must not be treated as globally unique when the team scope is available.

## What CAY-STABLE changed

No Glass Onion source code, dataset, dependency or model is copied into CAY-STABLE.

`ball_event_state_v1.js` now treats a stable ball owner as the pair `(team, playerId)` rather than `playerId` alone. This affects:

- stable-owner continuity;
- owner transition detection;
- pass/turnover transition provenance;
- credited player-possession intervals;
- candidate-owner stability.

Individual possession is accumulated authoritatively as `playerPossessionByTeam[team][playerId]`. The historical flat `playerPossession[playerId]` view is retained only for IDs observed under exactly one team. If the same player ID appears under multiple teams, the ambiguous flat key is omitted and the collision is exposed in `playerPossessionIdCollisions` instead of silently merging both players.

`ball_event_evidence_bridge_v1.js` applies the existing possession-evidence gate to the new team-scoped structure as well, so low possession coverage cannot leak a seemingly precise player statistic.

## Before / after regression fixture

Fixture: CAY player `8` owns the ball, then ADV player `8` recovers it after a measurable ball movement.

Before this adaptation:

- `playerId === playerId` could make the engine treat CAY `8` and ADV `8` as the same owner;
- the opponent recovery could therefore fail to become a turnover;
- individual possession under flat key `8` could merge evidence from both teams.

After this adaptation:

- CAY `8` and ADV `8` are distinct stable owners because their team scopes differ;
- the same-ID cross-team recovery is eligible for normal turnover evidence;
- CAY and ADV possession seconds remain separate under `playerPossessionByTeam`;
- the ambiguous legacy flat key `8` is not published;
- the collision is explicitly auditable.

Regression coverage: `tests/ball_owner_team_scope_nonregression.js` plus the possession publication checks in `tests/ball_possession_evidence_coverage_nonregression.js`.

## Reuse decision

- Status: **integrated conceptually**.
- Code copied: **none**.
- New runtime dependency: **none**.
- Estimated work avoided: **0.25–0.5 day** of bespoke identity-contract design and downstream collision debugging.
- Expected measurable impact: prevent cross-team owner/possession collisions and recover valid turnovers where opponents share the same local/jersey-style identifier.
- Compatibility risk: legacy consumers may expect every individual possession entry in the flat `playerPossession` object. Mitigation: the flat view is preserved unchanged for unambiguous IDs; the authoritative team-scoped structure is additive, and collisions are explicit rather than guessed.
