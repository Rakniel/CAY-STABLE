# Open-source audit — roboflow/trackers adaptive ReID fusion

Date: 2026-09-06
Status: rejected for immediate runtime integration; retained as benchmark reference

## Source and licence

- Project: `roboflow/trackers`
- Upstream default branch: `develop`
- Audited repository revision: `ca81fa5bec3e2f2de96a936c246d73a98a0ee1cc`
- Relevant upstream PR: `roboflow/trackers#571`, head `636a506c6ddbfe05cc1090c06f9a72abb6bb5285`
- Repository licence: Apache-2.0
- Reuse in CAY-STABLE in this change: documentation/design study only; 0 lines of upstream code, 0 weights, 0 models, 0 datasets, 0 dependencies copied.

## Useful idea inspected

PR #571 adds an opt-in Deep OC-SORT-style adaptive appearance fusion to BoT-SORT. The candidate idea for CAY was to weight appearance according to how discriminative it is among current candidates, instead of applying the same appearance contribution to every ambiguous association.

The upstream evaluation is relevant to football because it reports SoccerNet tracking results. On the published PR snapshot, adaptive fusion reduced SoccerNet identity switches from 2523 (geometry/no ReID arm) to 1692, while a different BoT-SORT appearance fusion reached higher HOTA but produced many more identity switches. These numbers are upstream-only and do not establish C.A. Yenne accuracy.

## Repository inspection before deciding

`tracking_core_v1.js` already has one authoritative browser-first tracker with:

- predicted spatial distance;
- additive appearance cost (`galleryAppearanceDistance`) backed by an EMA plus bounded appearance gallery;
- global one-to-one assignment;
- persistent archived-track ReID with uniqueness margin;
- low-score appearance-update rejection;
- an opt-in OC-SORT-inspired direction-consistency penalty;
- the hard <=11 simultaneous-player cap and upstream CAY identity filtering.

Importing BoT-SORT or Deep OC-SORT would therefore duplicate substantial working logic and add a Python/NumPy/ReID runtime stack that is not justified for the current STABLE milestone.

## New finding that changes the decision

The current upstream PR explicitly reports that disabling its top-two discriminativeness bonus (`adaptive_weight_cap=0`) changes HOTA only marginally on the reported datasets (+0.12 / -0.13 depending on dataset). The PR authors state that most of the observed gain comes from the additive appearance form and geometry-gate choice rather than from the candidate-separation bonus itself.

CAY already uses an additive appearance term in the active-track association cost. Therefore implementing another top-two adaptive bonus now would add complexity without strong evidence of incremental value over the existing CAY cost, gallery ReID and newly merged direction-consistency guard.

## Decision

**REJECTED FOR IMMEDIATE RUNTIME INTEGRATION.**

Do not add a second tracker and do not add a top-two adaptive appearance bonus merely because the upstream PR exists. Keep `roboflow/trackers` as a benchmark/reference source and spend the next implementation effort on higher-confidence gaps that CAY does not already cover.

This decision avoids approximately 0.5–1.0 day of prototype/plumbing and prevents an unnecessary extra identity heuristic from entering STABLE before representative video evidence exists.

## Re-open gate

Revisit only if a same-video C.A. Yenne benchmark of at least 300 comparable frames shows that current `position + gallery appearance + direction` still has repeatable same-kit ID switches that correlate with a measurable best-vs-second-best appearance separation. A future experiment must still demonstrate:

1. strict reduction in ID switches versus current main;
2. no increase in false CAY identities, including yellow-detail rejection cases;
3. no regression in persistent ReID after disappearance/re-entry;
4. no violation of the 11 simultaneous CAY-player cap;
5. no degradation of coverage publication semantics;
6. measurable incremental benefit beyond direction consistency;
7. bounded runtime overhead.

## Risks / dependencies

- Same-kit players can have weakly discriminative appearance; weighting it more strongly can harden a wrong identity.
- Camera motion, blur, scale change and compression can alter embeddings.
- An overly open geometry gate can reattach the wrong player returning from outside the frame.
- Upstream PR #571 is still open at audit time, so its implementation is not treated as a stable dependency.
- If code is ever copied instead of independently adapted, Apache-2.0 notice/attribution obligations and transitive dependency licences must be handled explicitly.
