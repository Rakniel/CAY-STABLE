# Open-source audit — SoccerNet Game State Reconstruction metric boundary

Date: 2026-09-04

## Source inspected
- Project: `SoccerNet/sn-gamestate`
- Revision inspected: `1c958345067218297d221e45e1a6405f975f83e0`
- Repository license reported by GitHub: `GPL-3.0`
- Upstream stack: SoccerNet Game State Reconstruction + TrackLab 1.3.24.

## Useful architectural idea
The Game State task treats tracking, athlete identification and field-position reconstruction as separate evidence layers that are combined only when the required state is available. CAY-STABLE already owns equivalent native contracts for technical tracks, roster identity bindings, participation windows and metric projection.

## CAY-STABLE decision
- No source code copied.
- No model weights copied.
- No dataset copied.
- No runtime dependency added.
- GPL-3.0 code is not merged into the current CAY-STABLE codebase.
- The architecture is used only as an external benchmark/reference for keeping identity, participation state and pitch coordinates separate before publishing player metrics.

## Native implementation produced
`roster_metric_pipeline_v1.js` composes existing CAY modules:
1. `track_roster_binding_v1.js` requires an explicitly reliable track -> roster-player association.
2. `app_domain_models_v1.js` clips/splits observations into confirmed participation windows.
3. `player_stats_v1.js` computes distance/speed/sprints only inside each window.
4. Aggregation sums window-local results without ever joining two distinct participation windows.

## What this replaces
Previously these contracts existed independently, so a caller could still compute a technically valid metric track without first proving the roster identity and active-match interval. The new pipeline provides one fail-closed entry point.

## License / dependency risk
Direct reuse of `sn-gamestate` code would introduce GPL-3.0 obligations. That route is rejected for the current product. The native CAY composition adds no external dependency and therefore no new redistribution obligation.

## Status
Architectural reference: STUDIED / ADAPTED CLEAN-ROOM.
Code/model reuse: REJECTED.
CAY native bridge: IMPLEMENTED, pending full CI validation before merge.
