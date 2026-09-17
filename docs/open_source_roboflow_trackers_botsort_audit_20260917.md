# OSS audit — Roboflow trackers / BoT-SORT (2026-09-17)

## Provenance and licence

- Project: `roboflow/trackers`
- Source: https://github.com/roboflow/trackers
- Audited branch: `develop` on 2026-09-17; any direct future integration must pin an exact release/commit before import.
- Licence: Apache-2.0, verified from the upstream root `LICENSE`.
- Upstream describes the tracker implementations as clean-room implementations of the original papers rather than vendored tracker source.
- No upstream source, model, weight, dataset or configuration is copied by this audit.

## Useful mature component

`trackers` exposes detector-agnostic implementations of SORT, ByteTrack, OC-SORT, BoT-SORT, C-BIoU and McByte behind a common interface. The immediately relevant candidate for CAY-STABLE is **BoT-SORT without appearance/ReID**, because upstream includes camera-motion compensation and publishes benchmark results on SoccerNet in addition to MOT17, SportsMOT and DanceTrack.

The upstream README currently reports default SoccerNet HOTA of 84.0 for ByteTrack and 84.5 for BoT-SORT under its stated evaluation setup. These numbers are not CAY accuracy claims: SoccerNet there uses oracle ground-truth boxes, so CAY must benchmark with its own detector/evidence and representative club footage before selecting a tracker.

## CAY-STABLE adaptation

CAY should not create another tracking implementation if this component can satisfy the existing contracts. Treat `trackers` as a **replaceable tracker producer behind the current CAY identity/evidence boundary**, not as a new source of player truth.

Candidate evaluation path:

1. feed exactly the same accepted detector observations to current CAY tracking, upstream ByteTrack and upstream BoT-SORT;
2. keep CAY roster identity, team evidence, yellow-detail rejection, bench/spectator exclusion, 11-on-field invariant and manual corrections downstream and authoritative;
3. compare persistent-ID continuity, fragmentation and recovery around pans/zooms/occlusions;
4. keep camera cuts and multi-plan boundaries as hard CAY resets even if an external tracker proposes continuity;
5. never let a tracker ID become a roster identity without CAY evidence;
6. publish no physical metric merely because tracking improved: metric calibration/coverage and `INDISPONIBLE` rules remain unchanged.

## What this can replace / avoid

If the benchmark wins, this can replace future bespoke work on ByteTrack/BoT-SORT association and camera-motion compensation rather than duplicating it inside CAY. The common upstream interface also makes ByteTrack-vs-BoT-SORT A/B testing cheaper.

Estimated engineering avoided if adopted: **2–4 days** of tracker/CMC implementation, tuning harness and regression plumbing, excluding detector integration and CAY-specific identity guards.

## Expected measurable impact / acceptance gate

Before any runtime integration, measure on the same labelled C.A. Yenne clips and, optionally, licensed SoccerNet evaluation data:

- ID switches per player-minute;
- track fragmentation and median/p95 uninterrupted track duration;
- recovery after short occlusion/re-entry;
- false continuity across camera cuts (must remain zero accepted by CAY);
- false CAY assignments, especially yellow-detail negatives (must not regress);
- bench/spectator leakage (must not regress);
- valid tracking coverage;
- processing time / FPS and time to first usable results;
- downstream metric coverage delta while preserving all metric validity gates.

Adopt only if identity continuity improves measurably without regressing false-CAY/bench/cut isolation and the end-to-end workflow remains compatible with the under-20-minute club setup target.

## Licence/dependency boundary

Apache-2.0 is compatible with permissive reuse provided its redistribution/notice obligations are preserved, including notices on modified files where applicable. The base package is Python-oriented and uses `supervision.Detections`; this may be unsuitable as a mandatory browser dependency. A direct integration therefore needs an explicit architecture decision (offline worker/sidecar/build step versus browser-native path) plus pinned dependency audit.

Optional detectors, ReID models, McByte dependencies, datasets and downloaded weights retain their own licences. They are not covered merely because `trackers` itself is Apache-2.0 and are not imported by this audit.

## Status

**Studied / high-priority A/B integration candidate / not yet integrated.**

This is deliberately stronger than a generic architecture reference: it identifies a legally compatible, benchmarked component that may remove bespoke ByteTrack/BoT-SORT/CMC work. Runtime import remains blocked until a pinned version is selected and CAY non-regression measurements prove the gain.