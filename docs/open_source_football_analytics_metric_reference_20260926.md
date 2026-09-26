# Open-source audit — cyyyp100/Football_Analytics

Date: 2026-09-26
Upstream: https://github.com/cyyyp100/Football_Analytics
Audited revision: `41460b3d1867b1c7f567afa97becef53ba7b1496`
Repository license: MIT (GitHub license metadata + upstream LICENSE/README declaration)
Runtime code copied into CAY-STABLE: **none**
Upstream data copied: **none**

## Why it is useful to CAY-STABLE

This project starts from metric optical-tracking coordinates rather than broadcast-video detections, so it is not a replacement for CAY detection/tracking/calibration. It is useful as an independent reference for the *downstream metric layer* once CAY has defensible pitch coordinates.

Useful independently implementable / benchmark ideas:

- derive football indicators from metric coordinates with frame-rate/timebase awareness rather than frame-count constants;
- preserve player identity separately from stream slots/substitution occupancy;
- compute team block area from the convex hull instead of combinatorial subsets;
- make missing-player presence explicit;
- reject or flag ball-derived events when interpolated/lost-ball stretches can create physically implausible evidence;
- validate event heuristics against independent consequences when available (the upstream goal detector combines goal-line geometry, ball speed/dwell and the later kick-off rather than trusting a single crossing);
- vectorize position matrices for downstream metrics instead of row-by-row dataframe work.

These ideas fit CAY's existing policy: stats are only published when evidence is defensible; otherwise they remain `INDISPONIBLE`.

## Upstream evidence / maturity notes

Upstream documents 97 synthetic-data tests and reports a full indicator pipeline over a match in about eight seconds after vectorization. It also reports an annotated goal check: 11/11 annotated goals recovered on two matches, with one false positive, and explicitly documents remaining failures on other fixtures. Those are upstream claims only and are **not** CAY performance claims.

The repository was created/reworked in August 2026 and has little public adoption, so it is treated as a useful metric/reference implementation, not as a mature runtime dependency.

## License boundary

The MIT license covers upstream code only. The optical tracking exports used by the project belong to a third-party provider / Montpellier HSC and are not redistributed or relicensed by the repository. CAY-STABLE must not import those match files or infer that MIT applies to them.

Optional papers/models remain separately owned/cited upstream. Any future reuse of model code, weights, datasets or vendor tracking data requires a separate audit.

## CAY decision

**Status: STUDIED / CONCEPTS ACCEPTED / NO RUNTIME IMPORT.**

Do not add this repository as a runtime dependency. Use it as a benchmark/design reference for the next metric layer: distance/speed/sprints first, then ball possession/passes/shots. In particular, add non-regression fixtures for FPS invariance, missing-player presence, substitution identity, and interpolated-ball artefacts before promoting new metrics.

Estimated work avoided: **2–4 days** of rediscovering downstream football-metric edge cases and validation strategy.

Expected impact: fewer frame-rate-dependent or interpolation-driven false statistics, clearer evidence gates, and faster implementation of defensible team/player metrics after projection is stable.
