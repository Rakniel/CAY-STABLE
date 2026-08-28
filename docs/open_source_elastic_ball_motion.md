# ELASTIC ball-motion design reference

- Project: ELASTIC — Event-Tracking Data Synchronization in Soccer Without Annotated Event Locations
- Source: https://github.com/hyunsungkim-ds/elastic
- Paper: Kim et al., MLSA 2025
- License verified: MPL-2.0
- Upstream status inspected: public `main` repository, 2026-08-28
- CAY-STABLE status: design principle adapted; no ELASTIC source code copied.

## Useful upstream idea

ELASTIC improves soccer event synchronization by combining player-ball distance with ball-motion cues such as kick distance and ball acceleration instead of trusting event timestamps alone.

## CAY-STABLE adaptation

`ball_event_state_v1.js` already required stable same-team ownership before and after a transition, explicit detached-ball observation, minimum metric travel and a bounded transition duration. This change adds an independent motion plausibility gate: the ball must also achieve a configurable minimum mean metric speed over the observed ownership transition (`minPassMeanSpeedMps`, default 2.5 m/s).

The implementation is original CAY-STABLE JavaScript and does not copy ELASTIC code. Mean speed is derived only from validated pitch-metre positions and observed timestamps already accepted by the local event state machine.

## What it replaces / avoids

It replaces a weaker local pass rule that could accept an implausibly slow detached drift between two same-team players whenever distance and owner transition alone were satisfied. It avoids importing ELASTIC's Python scientific stack into the browser-first STABLE runtime.

## Safety and auditability

- The pass rule remains conservative: stable owner A -> observed detached ball -> sufficient metric travel -> sufficient mean ball speed -> stable same-team owner B.
- The measured `meanBallSpeedMps` is stored on published pass events.
- The threshold is exported in `thresholds` for audit.
- Low ball coverage still forces passes/possession to `INDISPONIBLE`.
- No new runtime dependency is introduced.

## Validation

`tests/ball_motion_evidence_nonregression.js` checks that a fast, detached transition remains a valid pass and that a slow detached drift is rejected even when distance and owner transition are present.

## Expected impact

Fewer false-positive passes before heavier event-spotting models are introduced, while preserving a lightweight testable C.A. Yenne build. Estimated avoided design/tuning work: roughly 0.5–1 day by adapting a proven motion-evidence principle instead of inventing another event heuristic from scratch.
