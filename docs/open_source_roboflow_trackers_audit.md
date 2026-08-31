# Roboflow Trackers audit for CAY-STABLE

## Source
- Project: `roboflow/trackers`
- Upstream repository: https://github.com/roboflow/trackers
- Review date: 2026-08-31
- License: Apache-2.0
- Capability inspected: clean-room ByteTrack / BoT-SORT / OC-SORT / C-BIoU tracking, tracker evaluation/tuning and BoT-SORT camera-motion compensation.

## Why it is useful for CAY-STABLE
CAY-STABLE already contains a browser-first two-stage confidence cascade, persistent CAY IDs, conservative ReID evidence, camera-pan compensation, tracking evaluation and strict 11-player/pitch-membership guards. The useful acceleration opportunity is therefore not to replace those contracts blindly, but to use a mature Apache-2.0 implementation as an optional benchmark/backend candidate behind the existing CAY tracking boundary.

Upstream currently documents:
- detector-agnostic tracking;
- ByteTrack, BoT-SORT, OC-SORT and C-BIoU implementations;
- HOTA/IDF1/MOTA evaluation tooling;
- Optuna-based tuning;
- native camera-motion compensation for BoT-SORT;
- SportsMOT and SoccerNet benchmark results.

## License decision
**Legally compatible candidate for optional integration.** Apache-2.0 permits modification and commercial use provided license/notice obligations are retained. If code is later incorporated or vendored, CAY-STABLE must preserve upstream copyright/license notices and document the exact release/commit and local modifications.

No upstream source code, model weights or datasets are copied by this audit. No Python dependency is added in this change.

## CAY adaptation strategy
1. Keep `tracking_two_stage_adapter_v1.js`, `strict_tracking_frame_guard_v1.js`, `pitch_membership_guard_v1.js` and the CAY identity contracts authoritative.
2. Introduce any Python tracker only behind an adapter that emits the existing CAY detection/track schema; never let an external tracker bypass team, bench/spectator or 11-player guards.
3. Compare the current CAY tracker against upstream ByteTrack and BoT-SORT on identical detections and identical representative footage.
4. Measure at minimum observed coverage, ID switches, fragmentations, association integrity and runtime using `tracking_benchmark_v1.js` / `tracking_eval_metrics_v1.js` or an equivalent deterministic adapter.
5. Prefer BoT-SORT only when moving-camera sequences demonstrate a measurable gain after CAY safety guards; otherwise keep the lighter ByteTrack/current browser path.
6. Keep heavy Python/OpenCV dependencies optional so the club-facing STABLE build is not blocked by them.
7. Store tracker name, upstream version, parameters and camera-motion method in analysis provenance so results remain reproducible.

## What this can replace / work avoided
If the benchmark proves superior, the upstream implementation can replace part of the bespoke low-level MOT association and camera-motion plumbing while preserving CAY-specific identity/publication logic.

Estimated work avoided: **1–3 days** of tracker implementation/tuning/evaluation plumbing, potentially more if BoT-SORT camera-motion compensation proves materially better than the current lightweight translation estimator.

## Expected measurable impact
Promotion requires representative CAY footage to show one or more of:
- fewer ID switches;
- fewer fragmentations;
- higher association integrity/ID continuity;
- equal or better observed coverage without creating extra CAY IDs;
- improved continuity during camera pans/zooms;
- acceptable latency for club workflow.

No benchmark number from upstream is treated as a promised CAY result.

## Benchmark caveat
The upstream README publishes strong default results on SportsMOT and SoccerNet, including a small reported HOTA advantage for BoT-SORT over ByteTrack on SoccerNet. However, an upstream GitHub issue raised questions about the exact SoccerNet evaluation protocol and the unusually high published values versus prior literature. CAY-STABLE must therefore reproduce/evaluate candidates on its own fixtures and must not use those headline numbers as acceptance evidence.

## Risks / dependencies
- Python >=3.10 and its package stack would add deployment complexity if made mandatory.
- BoT-SORT camera-motion compensation may require frame data/OpenCV-style operations unavailable in the current pure-browser path.
- Tracker IDs are not player identities; CAY ReID/manual identity evidence remains a separate guarded layer.
- Upstream package license does not automatically cover third-party detectors, ReID models, checkpoints or benchmark datasets.
- SoccerNet/SportsMOT assets require independent dataset-license review before download or redistribution.
- External tracker output must never weaken `INDISPONIBLE`, coverage, manual-frame, pitch-membership, yellow-detail or spectator/bench exclusion policies.

## Promotion criteria
Before runtime integration:
- record exact upstream release/commit and Apache-2.0 notices;
- add an adapter test proving output cannot exceed 11 accepted CAY players;
- prove low-confidence detections cannot create new CAY identities merely because the external tracker returns an ID;
- run syntax/non-regression suite for the existing JS path;
- run before/after tracking benchmark on at least a camera-pan fixture and an occlusion/re-entry fixture;
- reject the candidate if identity continuity improves by trading for false CAY tracks or weaker coverage semantics;
- keep a no-Python fallback until optional backend reliability is proven.

## Provenance
- Source: `roboflow/trackers`
- Function/idea considered: mature clean-room MOT backend, BoT-SORT camera-motion compensation, evaluation/tuning workflow
- License: Apache-2.0
- Local modification: audit + CAY adapter/benchmark plan only
- Runtime dependency added: none
- External code/data copied: none
- Status: **studied / priority benchmark and optional-backend candidate**
