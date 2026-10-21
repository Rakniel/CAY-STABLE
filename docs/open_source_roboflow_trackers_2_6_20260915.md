# OSS evaluation — Roboflow trackers 2.6.0

Date: 2026-09-15

## Provenance

- Project: `roboflow/trackers`
- Upstream: https://github.com/roboflow/trackers
- Evaluated release: `2.6.0` (published 2026-08-06)
- License verified at tag `2.6.0`: Apache License 2.0
- Upstream description: clean-room implementations of SORT, ByteTrack, OC-SORT, BoT-SORT, C-BIoU and McByte, detector-agnostic and benchmarked on MOT17, SportsMOT, SoccerNet and DanceTrack.

## CAY-STABLE fit

This is a stronger future backend candidate than copying tracker implementations from projects with AGPL/GPL or unclear licensing. Apache-2.0 is permissive, but redistribution still requires preserving the license/notices and marking modified upstream files.

The most immediately relevant 2.6.0 capabilities are:

1. `ByteTrackTracker` and `BoTSORTTracker` behind a common interface, allowing a controlled A/B benchmark instead of maintaining two unrelated integrations.
2. Camera-motion compensation in BoT-SORT, relevant to CAY broadcast/touchline pan/tilt/zoom sequences.
3. `timestamp=` support so Kalman prediction and lost-track lifetime can follow real elapsed video time rather than assuming perfectly constant frame cadence.
4. Upstream performance work: vectorized sparse-optical-flow CMC status filtering and cached Kalman matrices. Upstream reports about 24x on the CMC status-filter operation and about 38% lower BoT-SORT/CBIoU predict cost; these are upstream microbenchmarks, not CAY measurements.
5. SoccerNet/SportsMOT benchmark coverage gives a better starting point for football-specific tracker selection than generic MOT-only claims.

## Proposed reuse boundary

Do **not** vendor code yet. First expose a backend-neutral CAY tracker adapter and benchmark the upstream package as an optional Python worker against the existing CAY tracker contracts. CAY remains authoritative for:

- 11-player simultaneous cap after association, not before;
- persistent roster identity and cumulative ReID memory;
- yellow-detail false-CAY rejection;
- bench/spectator exclusion;
- manual correction frames;
- coverage and `INDISPONIBLE` publication policy.

If the benchmark wins, prefer dependency-based reuse pinned to an audited release over copied source. Record exact package version, lockfile hash, Apache-2.0 attribution and any CAY adapter modifications.

## Benchmark gate before integration

Compare current CAY tracking vs ByteTrackTracker vs BoTSORTTracker on the same labelled clips. Minimum report:

- HOTA / IDF1 / MOTA where labels permit;
- ID switches per player-minute;
- recovery time after occlusion and camera cut;
- false CAY assignments, especially yellow-detail negatives;
- bench/spectator false-positive track rate;
- runtime ms/frame and peak memory;
- persistent roster-ID survival across substitutions and re-entry;
- coverage delta without relaxing existing publication gates.

No backend may ship solely because an upstream benchmark is better.

## Expected acceleration

Estimated engineering avoided if selected: roughly 3–7 days versus implementing and hardening ByteTrack + BoT-SORT + CMC + variable-frame-time handling independently. The largest expected product gain is faster experimentation with a legally compatible, maintained tracker backend while preserving CAY-specific identity and publication safeguards.

## Risks / dependencies

- Python >= 3.10 and OpenCV/numerical dependencies add a worker/runtime boundary to the current browser-heavy STABLE architecture.
- Apache-2.0 attribution/NOTICE obligations must be preserved if upstream code is redistributed.
- Optional McByte mask mode pulls heavier segmentation dependencies and is out of immediate STABLE scope.
- Detector/model licenses are independent of the tracker library and must be audited separately.
- Upstream performance figures must not be presented as CAY gains until reproduced on CAY clips.

## Status

**STUDIED — HIGH-PRIORITY BENCHMARK CANDIDATE.** No upstream source, weights, model or dataset copied into CAY-STABLE in this change.