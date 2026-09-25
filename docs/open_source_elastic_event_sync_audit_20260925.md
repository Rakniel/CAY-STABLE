# ELASTIC event synchronization audit — 2026-09-25

## Source and legal boundary

- Upstream: `hyunsungkim-ds/elastic`, CIKM 2026 branch/repository inspected on 2026-09-25.
- Paper/project: **ELASTIC: Trajectory-Based Synchronization of Event and Tracking Data in Soccer** (Kim et al., CIKM 2026).
- Source-code license: **MPL-2.0**.
- Benchmark event data under upstream `benchmark/`: derived from Sportec Open DFL and redistributed by upstream under **CC BY 4.0** with modifications/re-annotated timestamps.
- CAY-STABLE status: **reference/benchmark design only; no ELASTIC source or benchmark data copied into CAY-STABLE by this audit**.
- Reason for the boundary: MPL-2.0 is file-level copyleft. It can be used legally with suitable separation and notices, but CAY-STABLE currently prefers permissive runtime components when an equivalent architecture can be implemented through existing native contracts. Dataset rights are separate from source-code rights.

## Useful idea

ELASTIC does not infer football events from a single nearest-player frame. It first narrows the timeline to physically plausible touch candidates using trajectory evidence such as:

- ball acceleration;
- player-ball distance;
- kick/travel distance;

then scores event/candidate pairs and performs chronological sequence alignment (Needleman-Wunsch) so event timing remains globally ordered.

This is relevant to CAY-STABLE because `ball_event_state_v1.js` already has the right fail-closed primitives: metric player/ball coordinates, confidence gates, ball-motion plausibility, ownership ambiguity, stable receiver ownership, minimum detached-ball observations/span, minimum pass travel/speed, turnover evidence, continuity keys, gap/cut resets and explicit `INDISPONIBLE` coverage. The useful reuse is therefore the **validation pattern**, not a second event engine.

## CAY adaptation plan

Do not replace `ball_event_state_v1.js`. Extend its benchmark/oracle layer so future pass/possession work is evaluated on windows containing:

1. true pass with visible kick/flight/reception;
2. pass with one or more missing ball observations;
3. dribble close to another player (must not become a pass);
4. deflection/loose ball with ambiguous ownership;
5. opponent turnover after stable reception;
6. camera cut or plan change during a potential transition;
7. physically impossible ball jump;
8. two plausible receivers near the ball;
9. long aerial flight where nearest-player ownership is invalid;
10. event candidates close in time where chronological ordering prevents double counting.

For each fixture record event precision/recall, timestamp error, false pass count, false turnover count, rejected transition count, coverage and `INDISPONIBLE` behavior. A future sequence-level refinement is acceptable only if it improves predeclared event/timing metrics without weakening CAY's fail-closed ownership, cut/gap or coverage rules.

## What this replaces / work avoided

This avoids designing an event synchronization methodology from scratch and, more importantly, avoids promoting simplistic `nearest player = possession` / owner-change heuristics as reliable passes. Estimated methodology/prototyping avoided: **2–4 days**.

Expected measurable impact if the validation pattern is implemented in native CAY tests: fewer false passes around loose balls/occlusions, better event timestamps, and a defensible distinction between `FIABLE` and `INDISPONIBLE` event windows.

## Risks and dependencies

- ELASTIC assumes trajectory/event data of substantially higher quality than many amateur single-camera videos; thresholds cannot be transplanted blindly.
- Sportec Open DFL benchmark data is a separately attributed CC BY 4.0 asset and is not vendored here.
- Sequence alignment can make a plausible timeline look coherent even when upstream ball evidence is poor. CAY must therefore keep its coverage and physical-evidence gates ahead of any sequence-level inference.
- No ELASTIC code, benchmark rows, model weights or thresholds are incorporated by this audit.

## Status

**Studied / validation idea adapted / runtime not integrated.**
