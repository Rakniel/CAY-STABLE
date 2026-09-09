# TrackEval — event matching benchmark note

- Source: `JonathonLuiten/TrackEval`
- Reference revision: `12c8791b303e0a0b50f753af204249e622d0281a` (`master` checked 2026-09-09)
- License: MIT
- Upstream code copied: none
- Upstream dependency added: none
- CAY component affected: `ball_event_benchmark_v1.js` only (diagnostic benchmark; no STABLE publication guard changed)
- Idea adapted: replace nearest-first greedy one-to-one event matching with a global maximum-cardinality bipartite assignment principle so a locally closest prediction cannot steal the only valid match available to another reference event.
- CAY implementation: clean-room JavaScript augmenting-path matcher written for the existing benchmark contract. Existing time tolerance and actor/team/receiver identity checks remain unchanged.
- Why: the previous greedy matcher could undercount true positives on temporally close PASS/TURNOVER references and therefore distort before/after promotion decisions.
- Validation fixture: two PASS references at `0.0s` and `0.8s`, predictions at `-0.5s` and `0.3s`, tolerance `0.5s`. Greedy nearest-first yields one match; maximum-cardinality matching yields the two valid one-to-one matches.
- Expected impact: benchmark TP/FP/FN and F1 no longer depend on a local greedy ordering in this failure mode. No direct runtime impact on player/ball tracking.
- Risk: the matcher maximizes cardinality and orders adjacency by timing error, but does not claim a globally minimum total timing-error assignment among all maximum-cardinality solutions. Mean timing error therefore remains diagnostic and should not be treated as a Hungarian-equivalent optimum.
