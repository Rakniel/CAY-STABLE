# TrackLab — metric identity publication gate

- Source: https://github.com/TrackingLaboratory/tracklab
- Upstream version inspected previously in CAY-STABLE: **1.3.24**
- Upstream revision inspected: `5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2` (2026-05-01)
- License: **MIT**
- CAY-STABLE status: **design principle adapted; no upstream source code, model or weight copied**.

## Useful principle
TrackLab keeps technical tracking state, ReID/identity information and higher-level player metadata as separate concerns. For CAY-STABLE this means a physically valid trajectory is not sufficient to publish an individual player's distance, speed or sprint count if the player identity attached to that trajectory is still uncertain.

## Local adaptation
`metric_publication_guard_v1.js` now consumes the existing player identity quality when applying the final physical-stat publication policy.

- `FIABLE` identity can proceed to the existing metric evidence, temporal continuity and finite-value gates.
- `PARTIEL`, `INDISPONIBLE` or any other explicit non-reliable identity makes individual physical statistics `INDISPONIBLE`.
- diagnostic physical values and diagnostic metric coverage remain available for audit/debugging; they are not exposed as publishable player statistics.
- no new identity inference is created and no technical track ID is treated as a roster identity.

This extends the existing publication guard rather than duplicating metric or identity logic.

## What it replaces
Before this change, a metric trajectory with excellent calibration/evidence could be published for a player card even when that card's identity quality was not reliable. The physical measurement could be valid, but its attribution to a named player was not sufficiently defended.

After this change, publication requires both reliable identity attribution and reliable physical evidence.

## Expected impact / time saved
- Deterministic false-attribution path removed: `metric FIABLE + identity PARTIEL` now yields physical stats `INDISPONIBLE`.
- Estimated work avoided by extending the existing TrackLab-inspired identity boundary and publication guard: **0.25–0.5 day** versus creating a second identity-aware metric pipeline.
- No runtime dependency added.

## Tests
`tests/metric_publication_guard_nonregression.js` now verifies that a fully reliable metric is publishable for `identityQuality='FIABLE'` but becomes unavailable for `identityQuality='PARTIEL'`, while diagnostic evidence remains auditable.

## Risks / dependencies
- Existing consumers calling `applyPublicationPolicy(metric)` without identity context preserve the historical behavior for compatibility.
- The integrated report path always supplies the player's existing identity quality, so the production player-card publication path is fail-closed.
- No TrackLab code or weights are distributed by CAY-STABLE.
