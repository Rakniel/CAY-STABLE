# Open-source audit — Aviasole football-event-detection (2026-09-16)

## Source and legal status

- Project: `aviasoletechnologies/football-event-detection`
- Upstream default branch observed: `master`
- Repository created/pushed: 2026-03-26 (GitHub metadata observed 2026-09-16)
- Relevant upstream files observed: `analyze.py`, `readme.md`, `requirements.txt`.
- Upstream README states that the project is released under the MIT License and says `See LICENSE for details`.
- **Blocking discrepancy:** the repository root contains no `LICENSE` file and GitHub repository metadata reports `license: null` at the audited revision/state.
- CAY policy: README prose alone is not sufficient provenance for copying code. Therefore **no upstream code, configuration, model, weights, dataset or asset is imported** by this audit.

## Useful architecture ideas (idea-level only)

The upstream README describes a replay-aware event pipeline combining:

1. camera-cut evidence from frame histogram discontinuity;
2. optical-flow evidence for slow-motion/replay segments;
3. optional OCR overlay evidence;
4. suppression of football events while replay state is active;
5. explicit uncertain re-identification state rather than forcing an identity;
6. possession stability over multiple frames before emitting a transfer/pass event.

These are useful as benchmark hypotheses, not copied implementation.

## Fit with CAY-STABLE

CAY already has separate evidence/state modules including `ball_event_state_v1.js`, `ball_event_evidence_bridge_v1.js`, `ball_candidate_continuity_v1.js`, camera-motion guards and explicit unavailable semantics. Do **not** create a parallel event pipeline.

When event work becomes active, extend the existing evidence bridge/state contracts with an optional `live_play_evidence` / `replay_suppression` gate. A replay classifier must never make an unavailable ball/calibration/identity observation publishable. Camera cuts and multi-plan boundaries remain hard discontinuities.

Recommended CAY benchmark before any runtime integration:

- replay suppression precision/recall and false suppression seconds / 10 min;
- event false positives inside known replay intervals (target: 0 published events);
- pass/control precision, recall and temporal error before/after replay gating;
- coverage lost to uncertain replay state, reported explicitly;
- zero event continuity across a camera cut or plan boundary;
- zero bypass of CAY roster identity, bench/spectator exclusion, yellow-detail guard or `INDISPONIBLE`.

## Decision

- Status: **studied / idea adapted / code rejected pending verifiable license**.
- Runtime dependency added: none.
- Copied code: none.
- Copied model/weights/data/assets: none.
- Estimated work avoided: ~0.5–1 day of event/replay architecture exploration.
- Expected impact: fewer replay-generated false passes/shots/events once the event phase is activated, with measurable coverage instead of silent guessing.

## Reconsideration gate

Direct reuse may be reconsidered only if upstream adds a verifiable license file (or equivalent unambiguous licensing artifact) and every model/checkpoint/data dependency is audited separately. Even then, reuse must extend CAY's existing contracts rather than duplicate them.
