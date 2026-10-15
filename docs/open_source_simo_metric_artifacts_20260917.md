# OSS audit — Simo-03/football-player-detection (2026-09-17)

## Provenance
- Source: https://github.com/Simo-03/football-player-detection
- Audited revision: `c0c305d4763819f0e0f28e6557bd443d2b3fc973`
- Upstream license: MIT (`LICENSE`, copyright 2025 Selim Sherif).
- Status: studied / design and benchmark reference only. No upstream source code, model weights, assets, tracker configuration, or datasets copied into CAY-STABLE.

## Useful mature pattern
The upstream project keeps metric pitch artifacts as post-processing over already projected world/pitch coordinates. Its heatmap accumulates pitch-coordinate samples into a density map and its trajectory exporter explicitly breaks distance accumulation across frame gaps larger than a configured threshold. This separation is useful for CAY because rendering must never manufacture metric evidence.

## CAY-STABLE adaptation
CAY already has `metric_pitch_heatmap_v1.js`, metric projection/segment guards, coverage accounting, and physical-metric contracts. Do not duplicate them. Adapt only the validation principle:

1. Heatmaps and trajectories consume the same accepted pitch-metre samples as player statistics; never raw image coordinates.
2. A temporal/segment gap is a hard trajectory discontinuity for distance. Never draw or count a metric bridge through a camera cut, invalid calibration interval, missing identity interval, or rejected sample.
3. Rendering metadata must expose accepted samples / eligible samples / coverage and segment count. A visually dense heatmap must not imply high metric coverage.
4. If the underlying metric artifact is unavailable, the UI displays `INDISPONIBLE`; no image-coordinate fallback.
5. External track IDs are not player identities. CAY roster identity and bench/spectator/yellow-detail guards remain authoritative.

## What this replaces / avoids
This avoids implementing a separate visualization-specific trajectory accumulator with different gap rules from the physical-metrics pipeline. The canonical metric sample stream remains the single source of truth and renderers become projections of that artifact.

## Validation gate before any runtime change
A future integration is acceptable only if non-regression fixtures prove:
- zero distance across a segment/camera cut;
- zero distance across an unavailable calibration interval;
- heatmap accepted-sample count exactly matches canonical accepted metric samples;
- explicit coverage parity between statistics and visualization for the same player/time range;
- no bench/spectator sample and no unresolved roster identity reaches player metric artifacts;
- unavailable metric input produces `INDISPONIBLE`, not an empty-but-valid looking chart.

Measure before/after on representative C.A. Yenne footage: distance delta per player, invalid-bridge metres prevented, heatmap/trajectory coverage parity, processing time, and first-result latency.

## Expected acceleration
Estimated 0.5–1 day of duplicated artifact/rendering design and debugging avoided by adopting the single-source metric artifact + hard-gap principle.

## Risks / dependencies
- Upstream runtime uses Python/OpenCV/Ultralytics; none is introduced by this audit.
- Upstream model weights and transitive dependencies have separate licensing obligations and are not covered by the repository MIT license automatically.
- Upstream gap thresholds are not copied as CAY defaults; CAY thresholds must be derived from timestamps, segment boundaries and existing coverage contracts.
