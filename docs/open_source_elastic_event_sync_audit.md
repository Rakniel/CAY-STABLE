# ELASTIC trajectory/event synchronization audit

## Provenance
- Project: `hyunsungkim-ds/elastic`
- Source: https://github.com/hyunsungkim-ds/elastic
- Upstream branch inspected: `cikm2026`
- Upstream revision inspected: `e245224aad7450961eca40954ae2bc85e1e6e696` (2026-09-07)
- Paper: *ELASTIC: Trajectory-Based Synchronization of Event and Tracking Data in Soccer* (CIKM 2026)
- Code license: MPL-2.0
- Benchmark event data: CC BY 4.0, derived from Sportec Open DFL data as documented upstream.

## Useful upstream idea
ELASTIC does not trust a nominal event timestamp alone. It first narrows the temporal search space to frames where a ball touch is physically plausible, using trajectory evidence such as:
- ball acceleration,
- player-ball distance,
- kick distance.

It then scores event/candidate-frame pairs and uses an order-preserving Needleman-Wunsch dynamic-programming alignment to choose a globally coherent sequence rather than greedily accepting isolated local peaks.

## CAY-STABLE decision
Status: **studied / design candidate / no source code copied**.

CAY-STABLE already owns conservative ball evidence and event state contracts (`ball_candidate_continuity_v1.js`, `ball_kick_evidence_v1.js`, `ball_event_evidence_bridge_v1.js`, `ball_event_state_v1.js`). Importing ELASTIC wholesale would duplicate those contracts and would introduce a Python/data stack that is not justified for the immediate browser-first STABLE milestone.

The useful clean-room design adaptation for a later CAY module is therefore narrower:
1. derive *candidate touch frames* only from already-defensible CAY ball/player trajectory evidence;
2. retain acceleration + player-ball distance + kick-distance evidence separately for audit;
3. when several candidate events exist in one in-play interval, prefer an order-preserving sequence optimizer over independent greedy timestamps;
4. never create a pass/possession/shot event when ball/player metric coverage is insufficient;
5. propagate `INDISPONIBLE` rather than interpolating through camera cuts, invalid calibration, ambiguous ownership or missing ball evidence.

No ELASTIC code, notebook, benchmark record or Sportec data is incorporated by this audit.

## License boundary
MPL-2.0 is file-level copyleft. Directly incorporating or modifying MPL-covered source would require preserving MPL notices and making the covered modified files available under MPL-2.0 when distributed. CAY does **not** need to accept that obligation for the current design-only use, so this audit deliberately copies no implementation.

If direct reuse is proposed later, it must be isolated in clearly identified files and reviewed again before merge. Benchmark data is a separate CC BY 4.0 asset and must not be treated as if the code license covered it.

## What this can replace
This design can replace a future bespoke attempt to invent football event timestamp alignment from scratch. It does **not** replace CAY's detector, ownership state machine, ball continuity guard, calibration or metric coverage policy.

Estimated work avoided if the idea validates on C.A. Yenne footage: **1–3 engineering days** of event-candidate/alignment design and failure-mode exploration.

## Expected measurable impact
Before any runtime integration, benchmark against the current CAY event evidence path using manually reviewed C.A. Yenne clips:
- median and p95 absolute touch-timestamp error;
- pass/control event precision and recall;
- false event count per 10 minutes;
- event ordering violations;
- fraction of events correctly returned `INDISPONIBLE` under weak coverage;
- runtime cost per minute of footage.

Adopt only if timestamp error and/or false-event rate improve without weakening coverage, calibration, identity or ownership guards.

## Risks / dependencies
- Requires sufficiently stable ball trajectories; noisy or intermittent ball detection can make acceleration unreliable.
- Camera cuts and calibration gaps must split alignment windows.
- Long aerial balls can make nearest-player distance a weak touch cue.
- Python/notebook dependencies are not acceptable as mandatory STABLE runtime dependencies without measured benefit.
- ELASTIC benchmark data has separate CC BY 4.0 attribution obligations.

## Modification record
2026-09-16: provenance/license/design audit only. No external implementation or data copied; no runtime dependency added.