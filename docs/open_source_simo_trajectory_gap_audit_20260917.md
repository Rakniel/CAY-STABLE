# OSS audit — Simo-03 football-player-detection trajectory gap handling

Date: 2026-09-17

## Provenance
- Project: `Simo-03/football-player-detection`
- Source: https://github.com/Simo-03/football-player-detection
- Audited revision: `c0c305d4763819f0e0f28e6557bd443d2b3fc973`
- License: MIT, verified from the repository root `LICENSE` (Copyright (c) 2025 Selim Sherif).
- Relevant upstream file inspected: `src/io/generate_pitch_trajectories.py`.

## Useful pattern
The upstream trajectory/report path computes distance only between consecutive projected samples whose frame gap is within an explicit maximum. Long gaps therefore do not silently become physical distance. The renderer is downstream of projected pitch coordinates rather than recomputing homography.

This is a useful independent reference for CAY-STABLE's fail-closed metric policy, but CAY must be stricter: an accepted pair must additionally belong to the same validated metric segment/calibration epoch and stable roster identity. A renderer must never reconnect samples across a camera cut, invalidated calibration, identity quarantine, substitution boundary, bench/spectator interval or unavailable coverage interval.

## CAY adaptation
No upstream source is copied in this audit. Extend existing canonical metric-sample/trajectory logic rather than creating another trajectory implementation:

1. Segment trajectory polylines at every rejected metric interval instead of drawing a line across the gap.
2. Accumulate distance only from adjacent accepted samples inside the same metric segment/calibration epoch and stable roster identity.
3. Keep `maxGapFrames`/time-gap evidence explicit, but do not use it as permission to cross a cut or calibration boundary.
4. Make trajectory coverage derive from the same accepted/rejected metric samples used by heatmaps and physical statistics.
5. Preserve `INDISPONIBLE` when accepted metric coverage is below the configured publication threshold.

## What this replaces / avoids
Avoids implementing a separate distance/trajectory continuity heuristic inside each renderer or statistics module. The canonical accepted metric sample stream remains the source of truth for trajectory, heatmap, distance and later speed/sprint metrics.

## Expected measurable impact
- Target: zero rendered trajectory edges across rejected gaps/cuts/calibration epochs.
- Target: zero distance contribution across rejected gaps/cuts/calibration epochs.
- Target: accepted-sample parity between trajectory and heatmap inputs.
- Expected engineering time avoided: ~0.25–0.5 day of duplicated gap/continuity plumbing and later debugging.

## Status
Studied / design guard adapted. Runtime import rejected as unnecessary because CAY-STABLE already has stricter browser-first metric contracts. No Python/OpenCV/Ultralytics dependency or model weight is added.

## Risks / dependency boundaries
The upstream repository itself is MIT, but its runtime dependencies and any detector/model weights have their own licenses. None are incorporated by this audit. The upstream fixed frame-gap rule is not sufficient for CAY multi-plan footage unless combined with CAY's segment, calibration, identity and coverage guards.