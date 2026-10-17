# RUN53 — Strict observation evidence gate (C.A. Yenne)

## Provenance
- Existing CAY-STABLE module: `first_results_runtime_guard_bridge_v1.js`, audited baseline blob `b67201c064d0ee2b63f7aabad5e138d2af30330c`.
- Producer: `strict_tracking_frame_guard_v1.js`, `coverageFromTimeline`.
- External source: **none**. This is an extension of the existing CAY-STABLE code, not a third-party import. No new dependency or license introduced.

## Change
Observation `FIABLE` now requires numeric frame counts that reconcile to the attempted total, and a numeric coverage in [0,1] matching usable/attempted (tolerance 0.0001 for four-decimal producer rounding). Invalid evidence is `INDISPONIBLE`; the producer's explicit `PARTIEL` or `INDISPONIBLE` is not promoted to `FIABLE`. Coverage cannot alone publish physical statistics.

## Compatibility and tests
- Preserves existing shape of `observationState` and `applyObservationGuard`.
- Existing runtime non-regression suite covers the 90/100, 70/100, 0/20 cases.
- New suite `tests/first_results_observation_integrity_run53_nonregression.js` covers 16 scenarios and fail-closed publication.
- Local isolated validation of extracted function: 3 passes x 20 assertions; baseline fails expected regression; candidate passes. Full repository CI and real-video qualification are separate gates.
- Limit: no claim of tracking accuracy, video quality or the <20 min club SLA.

## Remaining product priority
Deliver and qualify a coherent browser journey: team/player cards, persistent tracking, observed coverage, trajectories and metric heatmaps. Physical metrics and ball events stay unavailable without defensible evidence.
