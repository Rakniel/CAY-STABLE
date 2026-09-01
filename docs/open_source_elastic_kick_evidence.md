# Open-source audit — ELASTIC kick/release evidence

Date inspected: 2026-09-01

- Project: `hyunsungkim-ds/elastic`
- Source: https://github.com/hyunsungkim-ds/elastic
- Revision inspected: `bc41bcdf43451ae639c6ae7b299c1ccd3712d00e`
- License: Mozilla Public License 2.0 (MPL-2.0)
- Upstream purpose: synchronize soccer event timestamps with tracking data. Its useful idea for CAY-STABLE is that pass-like events can be supported by motion evidence such as ball acceleration/kick distance and player-ball distance instead of relying only on an ownership label change.

## CAY-STABLE reuse policy

No ELASTIC implementation code was copied. CAY-STABLE uses a clean-room adaptation of the event-validation idea only. This avoids importing the upstream Python/pandas/scipy stack and avoids creating an MPL-covered source file inside the CAY runtime.

## Local implementation

- `ball_kick_evidence_v1.js`: validates a candidate PASS using metric ball speed, speed gain and increase in separation from the previous owner around the inferred release time.
- `ball_event_evidence_bridge_v1.js`: extends the existing `ball_event_state_v1.js` output without duplicating possession/pass logic. The stricter gate is explicit through `requireKickEvidence: true`.
- `tests/ball_kick_evidence_nonregression.js`: verifies a clear kick, rejects a slow drift, preserves turnovers, handles missing evidence and keeps `INDISPONIBLE` semantics.

## What this replaces

This avoids building a separate pass detector/state machine beside `ball_event_state_v1.js`. The existing CAY ownership transition remains authoritative; kick evidence is only an additional corroboration layer.

Estimated avoided work: **0.25–0.75 day** of event-validation design and plumbing.

## Expected impact

Expected reduction in false passes caused by accidental ownership changes when the ball remains close to players or drifts slowly. No real-video accuracy gain is claimed until evaluated on annotated C.A. Yenne footage.

## Risks / dependencies

- Thresholds depend on validated pitch-metre coordinates and sufficiently dense ball observations.
- Camera-plan boundaries and missing metric calibration must continue to suppress event publication upstream.
- Very short touches or low-frame-rate footage can lack enough observations; those cases remain `INDISPONIBLE`/rejected rather than guessed.
- Direct reuse of ELASTIC source would carry MPL-2.0 file-level obligations; CAY-STABLE deliberately avoids copying that code here.
