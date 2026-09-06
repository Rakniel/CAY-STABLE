# OC-SORT direction-consistency audit — 2026-09-06

## Source and license
- Project: **OC-SORT — Observation-Centric SORT**
- Official repository: https://github.com/noahcao/OC_SORT
- Upstream revision inspected: `8462e7e729a93ccd3bd995c0a79a890336cb3a0b` (2026-04-21)
- License: **MIT** (repository metadata and upstream `LICENSE`)
- Upstream status at inspection: public CVPR 2023 tracker; repository remained active in 2026.

## Useful idea for CAY-STABLE
OC-SORT adds observation-centric motion reasoning for association, including a **velocity-direction consistency** cue. The relevant reusable design idea for CAY is not to trust position proximity alone when two tracks cross: compare the candidate displacement direction with the recent observed motion direction and penalise a geometrically implausible reversal/cross-assignment.

No OC-SORT source code, model weights, Kalman implementation or dependency is copied into CAY-STABLE by this audit.

## Existing CAY logic inspected first
`tracking_core_v1.js` already has:
- motion history based only on actual accepted observations;
- a constant-velocity prediction from the last two observations;
- global one-to-one assignment;
- appearance EMA + persistent appearance gallery;
- category mismatch penalties and missed-frame penalties;
- conservative archived-track ReID with uniqueness margin.

Therefore importing OC-SORT wholesale would duplicate working CAY logic and add unnecessary Python/NumPy/filterpy/YOLOX baggage. OC-SORT's observation-centric re-update is also not copied blindly: CAY's lightweight predictor already derives velocity from real observations rather than recursively feeding predicted boxes back into the observed trajectory.

## Missing, non-duplicated opportunity
The current `matchCost()` combines predicted spatial distance + appearance + category + missed-frame penalty, but it has no explicit motion-direction agreement term. This is the narrow OC-SORT idea worth benchmarking.

Candidate CAY adaptation (not enabled by this audit):
1. Require at least two recent same-segment accepted observations for a track.
2. Build a unit vector from the recent track displacement.
3. Build a unit vector from the last accepted observation to the candidate detection.
4. Use angular/cosine disagreement only as a bounded secondary penalty; never as a sole identity proof.
5. Disable the cue for tiny displacements, camera cuts, stale gaps or unreliable geometry.
6. Keep appearance/team/11-player/bench-spectator/yellow-detail guards authoritative.
7. Promote only if the same representative C.A. Yenne sequences show fewer ID switches without reducing valid matches or increasing false CAY identities.

## Benchmark gate before runtime promotion
Minimum gate:
- >= 300 labelled/evaluable frames on the **same sequence before/after**;
- ID-switch rate strictly lower;
- no regression in persistent ReID recovery;
- no increase in false CAY identities;
- no violation of <=11 simultaneous CAY players;
- crossing/occlusion subset reported separately;
- runtime overhead measured;
- all existing tracking, integration and syntax non-regression suites green.

Suggested synthetic first check: two visually similar players approach, cross, and continue in opposite directions. Compare current position+appearance assignment against the same cost augmented with a bounded direction term. This synthetic test is only a regression guard; it is not evidence of real-video accuracy.

## What this can replace / work avoided
If the benchmark passes, this adapts one narrow mature MOT cue inside `tracking_core_v1.js` instead of importing or rewriting an entire tracker backend. Estimated avoided prototype/plumbing work: **0.5–1 day**, plus avoidance of a heavy optional runtime stack.

## Expected impact
Expected, not yet claimed as measured on CAY footage:
- fewer identity swaps during player crossings and short non-linear manoeuvres;
- better persistence of player cards/trajectories before distance-speed metrics consume them;
- near-zero dependency impact if implemented as a small browser-first cost term.

## Status
**ÉTUDIÉ / BENCHMARK CANDIDATE — NOT IN RUNTIME.**

## Risks / dependencies
- direction can be misleading on genuine sharp turns;
- camera pan can corrupt image-space direction if GMC is weak;
- tiny movements are numerically unstable;
- too much weight could reject legitimate reacquisition.

Mitigation: bounded secondary penalty, motion-amplitude/gap guards, GMC-aware disablement, same-sequence before/after benchmark, and no automatic promotion without measurable CAY gain.
