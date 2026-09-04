# SciPy linear-assignment design reference — CAY global association

Date audited: 2026-09-04

## Upstream provenance
- Project: SciPy
- Source: https://github.com/scipy/scipy
- Inspected revision: `2a1d2db8d323b8c21e47e0c4985faa25bab96ff7`
- Relevant public API/concept: `scipy.optimize.linear_sum_assignment` (linear sum assignment over a cost matrix).
- License: BSD 3-Clause style license as declared in upstream `LICENSE.txt`.

## CAY-STABLE reuse boundary
No SciPy source code, C/C++ implementation, Python package, binary or third-party solver is copied or distributed in CAY-STABLE.

CAY-STABLE adapts only the mature assignment principle: frame association should be solved globally across the already-eligible track/detection pairs instead of accepting locally cheapest pairs one by one.

The local implementation in `tracking_core_v1.js` is clean-room and deliberately specialized for the CAY invariant of at most 11 simultaneous players. It uses an exact detection-bitmask dynamic program rather than SciPy's implementation. Runtime dependency impact: zero.

## What changed
Previous behavior sorted eligible pairs by association cost and greedily accepted the next unused track/detection pair. A locally cheap pair could therefore consume the only eligible detection of another track, causing an avoidable missed association / identity break.

New behavior:
1. Existing CAY spatial/appearance/category/temporal thresholds still decide which pairs are eligible.
2. Among those eligible pairs, maximize the number of one-to-one track/detection matches.
3. For equal match cardinality, minimize total association cost.
4. Deterministic tie-breaking is retained.
5. No optimizer-created pair can bypass the existing association threshold.

## Validation and expected impact
`tests/tracking_global_assignment_nonregression.js` includes an ambiguous 2x2 fixture where the previous greedy strategy retains only 1 feasible identity while the new global solver retains 2 (+100% feasible associations in that fixture). It also covers minimum-cost choice at equal cardinality, one-to-one integrity, invalid candidate rejection and the full 11x11 CAY limit.

Expected real-footage impact: fewer avoidable ID breaks/ID switches during close player interactions and crossing trajectories. Real-video promotion remains subject to the existing CAY/TrackEval benchmark gates; synthetic improvement alone is not treated as proof of production gain.

Estimated work avoided by using the mature linear-assignment formulation instead of inventing a tracker-specific heuristic: roughly 0.5–1 day.

## Risks
- Exact bitmask complexity is exponential in detection count, but CAY hard-caps simultaneous players at 11, keeping the state space small.
- Maximizing feasible match cardinality can retain a pair close to the existing cost threshold; this is intentional and remains bounded by that threshold.
- Real C.A. Yenne footage is still required to quantify IDF1/HOTA/ID switches before claiming a production-level tracking gain.
