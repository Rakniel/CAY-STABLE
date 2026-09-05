# Open source audit — UnravelSports timestamp continuity guard (2026-09-05)

## Source and legal boundary

- Project: `UnravelSports/unravelsports`
- Version audited: `v1.2.1` (release published 2026-01-13)
- License: MPL-2.0
- Reuse mode in CAY-STABLE: conceptual adaptation only.
- Copied upstream code: none.
- Copied models / weights / datasets: none.
- Added runtime dependency: none.

The upstream project structures football tracking around explicit frame/timestamp identity and exposes position/velocity/acceleration fields from time-indexed tracking data. CAY-STABLE keeps its own implementation and applies the same defensibility principle: spatial adjacency alone is not sufficient evidence of continuous movement.

## CAY-STABLE adaptation

`metric_trajectory_smoother_v1.pathDistance()` previously accumulated every consecutive same-segment pair with increasing timestamps. A long tracking blackout inside the same camera segment could therefore be interpreted as travelled distance and observed movement time.

The existing CAY continuity policy already uses a 1 second maximum gap for trajectory smoothing and other metric guards. `pathDistance()` now extends that same policy instead of creating a parallel threshold:

- same segment remains mandatory;
- timestamps must remain finite and strictly increasing;
- a pair separated by more than `maxGapSec` (default: 1 s) is rejected from distance and observed time;
- rejected gap count and seconds are exposed for audit.

## Measured regression fixture

Synthetic same-segment path:

- observed pair: 0.0 s → 0.5 s, 1 m;
- blackout pair: 0.5 s → 5.0 s, 30 m;
- observed pair: 5.0 s → 5.5 s, 1 m.

Before the guard:

- distance: 32 m;
- observed movement time: 5.5 s;
- accepted pairs: 3.

After the guard:

- distance: 2 m;
- observed movement time: 1.0 s;
- accepted pairs: 2;
- rejected gap pairs: 1;
- rejected gap duration: 4.5 s.

## Replacement / acceleration

Replaces the adjacency-only distance accumulation with an extension of the continuity contract already used by CAY-STABLE. No duplicate metric engine is introduced.

Estimated work avoided by following a mature time-indexed tracking contract rather than designing another interpolation strategy: **0.25–0.5 day**.

Expected impact: fewer inflated distance, average-speed and downstream sprint indicators after temporary tracker loss, without inventing movement through missing evidence.

## Status and risks

Status: **integrated conceptually**.

Risk: the default 1 s gap threshold is deliberately conservative and inherits the existing CAY metric continuity policy. It should only be tuned after measurement on representative C.A. Yenne videos; no threshold was relaxed in this integration.
