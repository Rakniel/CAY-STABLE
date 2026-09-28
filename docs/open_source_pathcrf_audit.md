# PathCRF open-source audit

- Source: https://github.com/hyunsungkim-ds/pathcrf
- Project: PathCRF — Ball-Free Soccer Event Detection via Possession Path Inference from Player Trajectories (KDD 2026)
- License: MPL-2.0
- Audit date: 2026-09-28
- Integration status: studied / architecture reference only; no upstream source code or model weights copied into CAY-STABLE.

## Useful upstream idea

PathCRF represents possession/event inference as a temporally consistent state sequence over player trajectories. A CRF constrains impossible transitions, and changes in the selected possession edge yield events such as controls or passes. This is useful evidence that event inference should be sequence-constrained rather than a collection of independent per-frame nearest-player decisions.

## CAY-STABLE comparison

CAY-STABLE already has a detector-independent, fail-closed event chain (`ball_event_state_v1.js`, `ball_event_evidence_bridge_v1.js`, `ball_kick_evidence_v1.js`, roster ownership and drift guards). It requires validated pitch-metre evidence, confidence/ambiguity checks, stable ownership and coverage before publishing possession/pass/turnover outputs.

Therefore PathCRF does **not** replace the current ball-backed event state machine. The reusable design lesson is narrower: future event inference or fallback evidence should expose explicit transition legality and sequence confidence, rather than silently changing owner/event state frame by frame.

## License boundary

MPL-2.0 is file-level copyleft. Directly copying or modifying MPL-covered files would require preserving MPL notices and making modifications to those covered files available under MPL-2.0 when distributed. To keep the current browser runtime licensing simple, this audit imports no PathCRF code, checkpoint or dataset. Any future backend experiment must isolate MPL-covered files and separately audit model/data licenses.

## Expected benefit

- Avoids building a naive frame-local event fallback that would later need temporal-consistency redesign.
- Estimated avoided redesign/prototype work: ~1–2 days if/when ball-free event fallback is evaluated.
- Expected measurable impact if the principle is later implemented and benchmarked: fewer logically impossible possession/pass transitions during ball occlusion. No accuracy gain is claimed before C.A. Yenne representative-video benchmarks.

## Risks / dependencies

- Python/ML stack and trained checkpoints are heavier than the browser-first STABLE runtime.
- Player-trajectory-only inference can propagate tracking/identity errors into events.
- MPL-2.0 obligations must remain isolated and documented if source code is ever reused.
- Research results on professional tracking data do not establish accuracy on C.A. Yenne footage.
