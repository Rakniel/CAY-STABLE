# OSS audit — soccer-analytics-pipeline possession/pass baseline (2026-09-17)

## Source and provenance

- Project: `RamiKhamassi/soccer-analytics-pipeline`
- Upstream revision audited: `bbcc025fd619eef988a3fc881c3aad4c3ba332c8`
- License: MIT (`LICENSE` present; GitHub SPDX metadata reports MIT)
- Files inspected: `src/soccer_analytics/modules/possession.py`, `src/soccer_analytics/modules/passes.py`, repository tree and license metadata.

## Useful idea

The upstream keeps possession state and pass/interception state in small independent modules. That separation is useful as a deliberately simple baseline for testing CAY's evidence-driven ball event state machine.

## Why runtime reuse is rejected

The implementation is not safe enough for CAY-STABLE metrics:

1. possession duration uses process wall-clock (`time.time()`) rather than video timestamps;
2. nearest-player association is performed from image-space bbox centres and uses a fixed pixel threshold;
3. a same-team owner-ID change is immediately counted as a pass, without requiring observed detached ball flight, minimum travel, stable receiver evidence, or continuity across the video timeline;
4. team changes are immediately labelled interceptions;
5. no shot/plan boundary, calibration-validity, observation-gap, ambiguity, bench/spectator, roster-identity or metric-coverage contract is enforced.

CAY already has the stricter `ball_event_state_v1.js` path: metric pitch coordinates, confidence gates, ambiguity handling, stable ownership, plausible ball motion, detached-ball evidence for passes, minimum travel/speed, opponent stability, gap and segment resets, coverage, and `INDISPONIBLE` publication when evidence is insufficient.

## Adaptation for CAY-STABLE

Do **not** import the upstream runtime. Retain only a clean-room benchmark concept: a naive nearest-owner / owner-transition baseline may be run offline against exactly the same labelled clips as CAY. It must never publish club statistics. Its purpose is to prove that stricter CAY gates reduce false passes/turnovers rather than merely changing counts.

Suggested regression measurements:

- false pass rate around ID switches;
- false pass/turnover rate around cuts and plan changes;
- false ownership while the ball is free or ambiguous;
- pass precision/recall against labelled clips;
- possession-time error versus video timestamps;
- percentage of unsafe baseline events correctly withheld by CAY as `INDISPONIBLE` or rejected evidence.

## Replacement / duplication decision

This does not replace CAY runtime code. It avoids duplicating a weaker possession/pass implementation and gives a compact negative-control benchmark for `ball_event_state_v1.js` and `ball_event_benchmark_v1.js`.

## Estimated gain

Approximately 0.25–0.5 day of baseline design and debugging avoided. Expected measurable benefit is faster detection of regressions that reintroduce pixel-distance ownership, wall-clock timing, or owner-ID-change-as-pass shortcuts.

## Status

**Studied / benchmark idea adapted / runtime rejected as technically weaker.**

No upstream source code, model, weights, configuration or dependency is copied into CAY-STABLE. The MIT license is compatible, but technical correctness—not licensing—is the rejection reason. Any future direct reuse would require preserving the MIT notice and recording the exact copied/adapted portions in `OPEN_SOURCE_COMPONENTS.md`.
