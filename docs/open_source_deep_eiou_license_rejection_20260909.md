# Deep-EIoU — licence boundary audit (2026-09-09)

## Source
- Project: `hsiangwei0903/Deep-EIoU`
- Repository: https://github.com/hsiangwei0903/Deep-EIoU
- Scope studied: sports multi-object tracking, ExpansionIoU association and deep appearance features.
- Public paper: *Iterative Scale-Up ExpansionIoU and Deep Features Association for Multi-Object Tracking in Sports* (WACV Workshops 2024).

## Technical relevance to CAY-STABLE
Deep-EIoU is relevant because it targets irregular sports motion and reports strong results on SportsMOT and SoccerNet-Tracking. Conceptually, it is a useful benchmark candidate against the current CAY two-stage association / ReID stack, especially for identity fragmentation and fast direction changes.

Potential replacement/acceleration area:
- short-term player association under irregular motion;
- recovery through occlusion using appearance features;
- tracker benchmark reference against ByteTrack / BoT-SORT candidates.

## Licence audit
At the repository root inspected on 2026-09-09, no `LICENSE` file is present. The root contains `Deep-EIoU/`, `Readme.md`, `demo.mp4`, `detection/` and `embedding/`, but no explicit software licence file.

CAY policy therefore treats the repository code, model packaging and implementation details as **NOT REUSABLE** until an explicit compatible licence is supplied by the upstream author. Public availability on GitHub is not sufficient permission to copy, vendor, adapt or redistribute code.

## CAY-STABLE decision
**Status: REJECTED FOR CODE / DEPENDENCY REUSE.**

- No upstream source code copied.
- No model or weight copied.
- No runtime dependency added.
- No implementation detail transplanted.
- Only the high-level research idea may be used as a benchmark hypothesis: compare motion-agnostic / overlap-expansion association against the existing CAY trackers using the already integrated TrackEval-style identity, fragmentation and coverage guards.

## Estimated engineering impact
If a compatible licence existed, a mature sports-specific association implementation could plausibly avoid roughly 1–2 engineering days for a prototype benchmark backend. Because the licence is absent, that time saving is deliberately not taken.

## Risks / follow-up
- Licence status may change upstream; re-audit before any future reuse.
- The paper's reported benchmark performance must not be treated as evidence on C.A. Yenne footage.
- Any future candidate must still pass CAY's same-sequence benchmarks, zero-false-CAY guard, bench/spectator exclusion, identity fragmentation gate and coverage non-regression before promotion.
