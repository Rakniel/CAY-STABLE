# Kloppy tracking/coordinate contract — CAY metric trajectory adaptation

- Upstream project: `PySport/kloppy`
- Source: https://github.com/PySport/kloppy
- Documentation checked: 2026-08-28
- Upstream release context: Kloppy 3.19.x documentation/current repository
- License: BSD-3-Clause
- Upstream concept used: football tracking is timestamped positional data with explicit coordinate-system transformation rather than an unordered point cloud.
- Code reuse status: no Kloppy source code copied; no Python dependency, provider loader or dataset vendored.

## CAY-STABLE adaptation

CAY-STABLE already projects player observations through explicitly validated per-segment homographies in `metric_pitch_heatmap_v1.js`. The same accepted projections are now reused to expose a `trajectory` contract instead of creating a parallel projection pipeline.

A metric trajectory contains only observed, successfully projected pitch-metre points. It is split into runs whenever a point cannot be projected, the camera/tracking segment changes, timestamps are invalid/non-increasing, or the temporal gap exceeds the existing `maxDwellGapSec` guard. No interpolation, extrapolation, hidden-position reconstruction or cross-cut line is created.

The trajectory exposes `metricCoverage`, calibration confidence, `defendableScore`, quality (`FIABLE` / `PARTIEL` / `INDISPONIBLE`), runs and points. This is intentionally independent from the stricter heatmap publication threshold: a 50% calibrated sequence may expose a clearly-labelled PARTIEL trajectory while the heatmap remains `INDISPONIBLE` at an 80% publication gate.

## What this replaces

Previously, valid projected points were only surfaced through `projectedPoints` when the whole heatmap passed its publication threshold. A partially calibrated clip could therefore contain defensible terrain observations but expose no metric trajectory at all. The new contract reuses the same projection evidence and labels its partial coverage explicitly.

## Expected impact

- first testable CAY player trajectories arrive sooner without another projection implementation;
- no invented path across multi-plan cuts, missing calibration or long observation gaps;
- coaches can see what portion of a player's movement is actually supported by metric evidence;
- distance/speed/heatmap gates remain unchanged;
- estimated avoided work: roughly 0.5–1 day versus designing and validating a second trajectory/calibration pipeline.

## Dependency / legal risk

- New runtime dependency: none.
- License obligations from copied code: none, because only a BSD-3-Clause design/data-model principle is adapted independently.
- Main risk: a PARTIEL trajectory must remain visually distinguishable from a FIABLE one in the UI; downstream rendering must not silently join separate runs.
