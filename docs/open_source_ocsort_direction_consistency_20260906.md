# OC-SORT direction-consistency audit — 2026-09-06

## Source and license
- Project: **OC-SORT — Observation-Centric SORT**
- Official repository: https://github.com/noahcao/OC_SORT
- Upstream revision inspected: `8462e7e729a93ccd3bd995c0a79a890336cb3a0b` (2026-04-21)
- License: **MIT** (repository metadata and upstream `LICENSE`)
- Upstream status at inspection: public CVPR 2023 tracker; repository remained active in 2026.

## Useful idea for CAY-STABLE
OC-SORT adds observation-centric motion reasoning for association, including a **velocity-direction consistency** cue. The relevant reusable design idea for CAY is not to trust position proximity alone when two tracks cross: compare the candidate displacement direction with the recent observed motion direction and penalise a geometrically implausible reversal/cross-assignment.

No OC-SORT source code, model weights, Kalman implementation or dependency is copied into CAY-STABLE. The CAY implementation is an independent JavaScript adaptation of the high-level direction-consistency idea.

## Existing CAY logic inspected first
`tracking_core_v1.js` already has:
- motion history based only on actual accepted observations;
- a constant-velocity prediction from the last two observations;
- global one-to-one assignment;
- appearance EMA + persistent appearance gallery;
- category mismatch penalties and missed-frame penalties;
- conservative archived-track ReID with uniqueness margin.

Therefore importing OC-SORT wholesale would duplicate working CAY logic and add unnecessary Python/NumPy/filterpy/YOLOX baggage. OC-SORT's observation-centric re-update is also not copied blindly: CAY's lightweight predictor already derives velocity from real observations rather than recursively feeding predicted boxes back into the observed trajectory.

## CAY adaptation implemented
`tracking_core_v1.js` now contains an optional `directionPenalty()` used only when `directionConsistencyEnabled === true`.

The adaptation:
1. Requires at least two accepted observations in the current track history.
2. Computes recent track velocity from CAY's existing observation history.
3. Compares that direction with the displacement from the last accepted observation to the candidate detection.
4. Converts cosine disagreement into a bounded secondary cost term.
5. Ignores the cue below `directionMinMotion` to avoid unstable tiny-displacement angles.
6. Keeps the feature **disabled by default**, so current STABLE runtime behaviour is unchanged until real-video promotion.
7. Leaves appearance, category, global assignment, ReID, <=11 simultaneous players and upstream CAY filtering authoritative.

Default benchmark parameters in the optional path are `directionPenaltyWeight=.18` and `directionMinMotion=.003` in normalized image coordinates; both remain configurable and are not promoted as production calibration values.

## Synthetic regression result
`tests/tracking_direction_consistency_nonregression.js` covers two visually identical tracks moving toward one another. On the deliberately ambiguous crossing frame:
- legacy/tie-break behaviour: **2 synthetic identity reversals**;
- optional direction-consistency cue: **0 synthetic identity reversals**.

This result proves only that the optional term resolves the targeted deterministic regression case. It is **not** evidence of improved real C.A. Yenne video accuracy.

The test also verifies that `directionPenalty()` returns zero when the feature is not explicitly enabled, preserving runtime compatibility.

## Benchmark gate before runtime promotion
Minimum gate remains:
- >= 300 labelled/evaluable frames on the **same sequence before/after**;
- ID-switch rate strictly lower;
- no regression in persistent ReID recovery;
- no increase in false CAY identities;
- no violation of <=11 simultaneous CAY players;
- crossing/occlusion subset reported separately;
- runtime overhead measured;
- all existing tracking, integration and syntax non-regression suites green.

## What this replaces / work avoided
This adapts one narrow mature MOT cue inside the existing `tracking_core_v1.js` instead of importing or rewriting an entire tracker backend. Estimated avoided prototype/plumbing work: **0.5–1 day**, plus avoidance of a heavy optional runtime stack.

## Expected impact
Expected, pending real-video benchmark:
- fewer identity swaps during player crossings and short occlusions;
- cleaner player-card trajectories before distance/speed metrics consume them;
- negligible dependency impact because the adaptation adds no external runtime package.

## Status
**INTÉGRÉ COMME OPTION DE BENCHMARK / NON ACTIVÉ PAR DÉFAUT.**

Production promotion is blocked until the >=300-frame same-sequence C.A. Yenne benchmark gate passes.

## Risks / dependencies
- direction can be misleading on genuine sharp turns;
- camera pan can corrupt image-space direction if GMC is weak;
- tiny movements are numerically unstable;
- too much weight could reject legitimate reacquisition.

Mitigation: bounded secondary penalty, motion-amplitude guard, explicit opt-in, existing camera-cut segment reset, same-sequence before/after benchmark, and no automatic production promotion without measurable CAY gain.
