# OSS audit — SPOT-SoccerNet-Ball

Date: 2026-09-14

## Source and revision
- Project: `aymanht/SPOT-SoccerNet-Ball`
- Source: https://github.com/aymanht/SPOT-SoccerNet-Ball
- Inspected revision: `158df230ecead5288061697331dfdca8215fcf9c` (2026-04-10)
- Declared project license: MIT.
- Upstream attribution note: the repository states that it is based on E2E-Spot (MIT) and that SoccerNet data remains subject to the SoccerNet research-use agreement.

## Useful function / idea
The project is a compact end-to-end reference for dense SoccerNet-Ball action spotting. It covers 12 ball-action classes including pass, high pass, cross, shot, header, tackle and goal, and evaluates temporally localized predictions rather than treating a single frame as sufficient evidence.

For CAY-STABLE this is useful as a benchmark/design reference for the future event layer, especially for temporal shot validation and later pass/shot evaluation. It does **not** replace the existing explainable CAY evidence chain and does not justify publishing an event from one frame.

## Integration decision
- Status: **studied / benchmark reference**.
- Code copied: **none**.
- Model weights copied: **none**.
- Dataset copied: **none**.
- CAY modification inspired in this run: the existing canonical non-live/replay guard is now reused by temporal shot-candidate analysis so replay motion cannot create a CAY shot candidate. This adaptation is clean-room CAY code; it is not a port of SPOT-SoccerNet-Ball source.
- Local implementation: `ball_event_evidence_bridge_v1.js` (`analyzeShots`) plus `tests/shot_live_play_guard_nonregression.js`.

## What it replaces / work avoided
It avoids inventing a separate event-evaluation vocabulary and reinforces the decision to keep dense ball actions as temporally evidenced events. Estimated design/benchmark work avoided: about 0.5 day.

## Expected measurable impact
The new CAY guard is directly measurable on the regression fixture: the raw temporal shot engine can produce one diagnostic candidate from a replay sequence, while the canonical guarded path must produce zero; the equivalent live sequence must still produce one diagnostic candidate.

## Risks / dependencies
- The upstream training stack is substantially heavier than the browser-first CAY runtime.
- SoccerNet video/annotation access has its own research-use conditions and must not be treated as MIT merely because the repository code is MIT.
- Model/checkpoint licensing and provenance must be audited separately before any future reuse.
- No accuracy claim is transferred from upstream to CAY-STABLE; representative C.A. Yenne footage remains mandatory before any shot statistic can become publishable.
