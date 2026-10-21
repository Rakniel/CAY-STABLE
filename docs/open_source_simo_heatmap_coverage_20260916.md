# OSS audit — Simo-03 football-player-detection heatmaps

Date: 2026-09-16

## Provenance
- Project: `Simo-03/football-player-detection`
- Source: https://github.com/Simo-03/football-player-detection
- Audited revision: `c0c305d4763819f0e0f28e6557bd443d2b3fc973`
- Relevant file: `src/io/generate_player_heatmap.py`
- Repository license: MIT, verified from root `LICENSE` at the audited revision.
- External model/dependency licenses are NOT inherited from the repository MIT license and remain separate audit items.

## Useful upstream pattern
The project renders per-track heatmaps from already projected pitch-space samples. It accumulates samples into a 2D density raster, applies Gaussian smoothing, normalizes the density, then overlays it on a pitch drawing. This is a useful separation of concerns: projection/tracking evidence is produced upstream; visualization consumes only pitch-space samples.

## CAY-STABLE adaptation boundary
No upstream source code, weights, configuration or assets are copied in this change. CAY should adapt the architecture, not blindly reproduce the visualization semantics.

A CAY heatmap must remain evidence-aware:
1. consume only samples whose player identity and metric projection are publishable;
2. keep observed/calibrated coverage explicit rather than treating missing intervals as zero occupancy;
3. never bridge camera cuts, rejected calibration segments or `INDISPONIBLE` intervals;
4. expose sample count, valid metric duration and coverage ratio beside the heatmap;
5. avoid interpreting max-normalized colour intensity as absolute time spent unless duration-normalized evidence supports that statement;
6. retain C.A. Yenne red/black UI and the official project logo unchanged; the pitch heatmap itself is an analytical layer, not a replacement club identity.

## What this replaces / avoids
This avoids inventing a second image-coordinate heatmap pipeline. Heatmaps should extend the existing metric trajectory/artifact chain and consume validated pitch coordinates only.

## Expected gain
Estimated 0.5–1 day of visualization/provenance design avoided. Expected measurable benefit is zero heatmap samples sourced from unvalidated metric segments, plus explicit coverage so a partial-video heatmap cannot be presented as a complete-match heatmap.

## Acceptance tests before runtime integration
- rejected/unvalidated calibration contributes exactly zero heatmap samples;
- a camera-plan cut cannot connect or smear samples across segments;
- bench/spectator/non-CAY identities contribute exactly zero samples;
- sample count and valid metric duration equal the accepted input evidence;
- coverage below the publication threshold is labelled partial/`INDISPONIBLE` according to the existing CAY publication contract;
- deterministic input yields deterministic density output;
- existing tracking/calibration/trajectory non-regression suites remain green.

## Status
**Studied / design pattern adapted / runtime not imported.**

Risk: the upstream implementation max-normalizes each heatmap independently. That is visually useful but can make two players with very different valid durations look equally intense. CAY must therefore preserve duration/coverage metadata and must not infer comparative workload from colour intensity alone.