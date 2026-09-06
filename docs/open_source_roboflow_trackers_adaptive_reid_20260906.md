# Open-source audit — roboflow/trackers adaptive ReID fusion

Date: 2026-09-06
Status: studied / benchmark candidate only

## Source and licence

- Project: `roboflow/trackers`
- Upstream default branch: `develop`
- Audited repository revision: `ca81fa5bec3e2f2de96a936c246d73a98a0ee1cc`
- Relevant upstream PR: `roboflow/trackers#571`, head `636a506c6ddbfe05cc1090c06f9a72abb6bb5285`
- Repository licence: Apache-2.0
- Reuse in CAY-STABLE in this change: documentation/design study only; 0 lines of upstream code, 0 weights, 0 models, 0 datasets, 0 dependencies copied.

## Useful idea

PR #571 adds an opt-in Deep OC-SORT-style adaptive appearance fusion to BoT-SORT. The relevant design point for CAY is not the whole tracker but the fact that appearance evidence can be weighted according to how discriminative it is among current candidates, instead of applying a fixed appearance contribution to every ambiguous association.

The upstream evaluation is especially relevant to football because it reports SoccerNet tracking results and highlights a trade-off: adaptive fusion can substantially reduce identity switches even when a different fusion has slightly higher HOTA. That matches CAY-STABLE's priority: persistent player identity is more important than optimizing a generic MOT aggregate at the cost of frequent same-kit identity flips.

## What this could replace / extend in CAY-STABLE

CAY already has one authoritative tracker with motion, global assignment, active-track appearance gallery, persistent ReID and the opt-in OC-SORT direction-consistency guard. Therefore importing another BoT-SORT/DeepOCSORT implementation would duplicate logic and is rejected.

The only candidate adaptation is an additional bounded, opt-in confidence term inside the existing association cost: use the separation between the best and next-best appearance candidates to modulate how much appearance may influence an otherwise ambiguous match. It must extend the existing `tracking_core_v1.js` cost path rather than create a second tracker.

## Expected gain

- Estimated engineering avoided: 0.5–1.0 day of designing an adaptive appearance-confidence heuristic from scratch and defining its benchmark protocol.
- Expected impact: fewer same-kit ID switches in close crossings or short occlusions when one candidate has distinctly stronger historical appearance evidence.
- No production accuracy claim is made from upstream benchmarks; SoccerNet/other MOT results do not prove C.A. Yenne camera performance.

## Promotion gate

Do not enable in STABLE by default until a same-video before/after benchmark has at least 300 comparable C.A. Yenne frames and demonstrates all of the following:

1. strict reduction in ID switches versus current main;
2. no increase in false CAY identities, including yellow-detail rejection cases;
3. no regression in persistent ReID after disappearance/re-entry;
4. no violation of the 11 simultaneous CAY-player cap;
5. no degradation of coverage publication semantics;
6. measurable benefit beyond the newly merged direction-consistency guard, so the two signals are not redundant.

## Risks / dependencies

- Same-kit players can have weakly discriminative appearance; adaptive weighting must never turn uncertain appearance into strong evidence.
- Camera motion, blur, scale change and compression can alter embeddings.
- An overly open geometry gate can reattach the wrong player returning from outside the frame.
- Upstream PR #571 is still open at audit time, so its exact implementation is not treated as a stable dependency.
- If code is ever copied instead of independently adapted, Apache-2.0 notice/attribution obligations must be handled explicitly and transitive dependencies re-audited.

## Decision

STUDIED / BENCHMARK CANDIDATE. No runtime integration in this change. Prefer a small CAY-native extension only if the benchmark proves incremental value over the existing gallery-aware association + direction-consistency guard.
