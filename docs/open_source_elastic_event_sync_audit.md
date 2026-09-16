# ELASTIC event/tracking synchronization audit

- Source: https://github.com/hyunsungkim-ds/elastic
- Audited upstream revision: `e245224aad7450961eca40954ae2bc85e1e6e696` (2026-09-07)
- Upstream branch observed: `cikm2026`
- Code license: Mozilla Public License 2.0 (MPL-2.0), verified from upstream `LICENSE`.
- Benchmark event data: CC BY 4.0 according to upstream README; this is a separate data-license boundary and is not imported into CAY-STABLE.
- Status: studied / design and benchmark reference; no upstream source code or benchmark data copied.

## Useful upstream idea

ELASTIC synchronizes soccer event timestamps against player/ball trajectories without relying on manually annotated event locations. It first selects physically plausible ball-touch candidate frames using signals including ball acceleration, player-ball distance and kick distance, then aligns the ordered event sequence to candidate frames with Needleman-Wunsch dynamic programming.

This is useful for the later CAY-STABLE ball/event phase because it gives a mature reference for turning already-defensible ball/player trajectories into temporally consistent pass/control event evidence. It should not bypass CAY's existing evidence chain.

## CAY-STABLE adaptation boundary

CAY-STABLE already contains `ball_event_state_v1.js`, `ball_event_evidence_bridge_v1.js`, `ball_kick_evidence_v1.js`, `ball_candidate_continuity_v1.js` and metric/coverage guards. Do not duplicate these modules with a second event runtime.

Instead, retain the following clean-room benchmark/design rules:

1. Candidate touch frames may use ball acceleration, player-ball distance and kick-distance evidence only when their input trajectories are themselves valid for the same camera/calibration segment.
2. Ordered event alignment may be evaluated offline as a post-processing benchmark, never as evidence that manufactures a missing ball observation.
3. No event may bridge a camera cut, rejected calibration interval, unavailable ball interval or unresolved player identity.
4. Pass/control/possession remain `INDISPONIBLE` when ball coverage/evidence is below CAY thresholds; alignment cannot upgrade unavailable evidence into a published statistic.
5. Compare greedy local association against sequence-constrained alignment on representative C.A. Yenne clips using event timestamp error, false event rate, missed event rate and valid-event coverage.

## License decision

MPL-2.0 is file-level copyleft and can coexist in a larger work under conditions, but importing or modifying covered files would create source-distribution and notice obligations for those files. CAY-STABLE currently favors permissive MIT/Apache/BSD components for direct reuse. Therefore ELASTIC source is not imported at this stage. If direct reuse later produces a decisive measured gain, isolate MPL-covered files and preserve all MPL notices/source obligations rather than copying snippets into CAY-native files.

## Expected benefit

Estimated 0.5-1.5 days of event-synchronization research/prototype work avoided. Expected measurable benefit, if the sequence constraint proves useful on C.A. Yenne footage: fewer temporally inconsistent pass/control transitions without increasing false events. No accuracy claim is made before club-footage benchmarks.

## Risks/dependencies

- Depends on defensible ball trajectories; it is not a ball detector.
- Sequence alignment can make a globally plausible but locally wrong assignment when candidate evidence is weak, so CAY fail-closed coverage/evidence gates remain authoritative.
- Upstream Python/scientific dependencies are not needed for the browser runtime unless a later offline benchmark explicitly adopts them.
- Upstream benchmark data is CC BY 4.0 and remains legally separate from the MPL-2.0 code.
