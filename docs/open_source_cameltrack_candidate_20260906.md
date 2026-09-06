# Open-source audit — CAMELTrack learned multi-cue association

Date inspected: 2026-09-06

## Source
- Project: TrackingLaboratory/CAMELTrack
- Repository: https://github.com/TrackingLaboratory/CAMELTrack
- Upstream commit inspected: `46a74bb22a28d2d699b4c5c5e317a26d3b87f1e2`
- License reported by GitHub: Apache-2.0
- Ecosystem: TrackLab
- Upstream focus: online multi-object tracking with learned context-aware fusion of multiple association cues.

## Useful upstream result / principle
CAMELTrack keeps the modular tracking-by-detection architecture but replaces fixed hand-crafted cue fusion with a learned association module. The published upstream configuration combines bounding-box, appearance and keypoint evidence; its README reports HOTA 80.3 on SportsMOT for the appearance+keypoint configuration.

For CAY-STABLE, the useful discovery is not to copy the transformer implementation into the browser runtime. The current CAY tracker already has ByteTrack-like confidence stages, motion prediction, appearance EMA/gallery, global assignment, camera-plan boundaries and strict persistent-identity guards. CAMELTrack instead becomes a benchmark candidate for the specific failure mode CAY still has: fixed cue weights can be sub-optimal when crowding, occlusion, camera motion or weak appearance evidence changes which cue is trustworthy.

## CAY-STABLE change
No CAMELTrack source code, checkpoint or model weight is copied or bundled.

`tracking_backend_candidate_registry_v1.js` now registers `cameltrack-apache` as `BENCHMARK_ONLY` and fail-closes promotion behind all of the following:
1. dependency/model-weight license audit;
2. measurable ID-switch improvement on at least 300 frames of real C.A. Yenne footage;
3. no regression in persistent ReID recovery;
4. no regression in cross-camera-plan identity recovery.

The regression suite also verifies that Apache-2.0 repository compatibility alone can never promote CAMELTrack without the remaining audits and real-video evidence.

## What this replaces / work avoided
This avoids prematurely designing another bespoke learned association engine or replacing the validated CAY tracker on theoretical grounds. The existing candidate-promotion infrastructure is reused instead of creating a second benchmark path.

Estimated engineering/research avoided before a go/no-go decision: **0.5–1.5 days**, plus avoiding an unnecessary Python/GPU/model integration if real CAY footage shows no measurable gain.

## Expected measurable impact
Immediate runtime impact: none; STABLE behavior is intentionally unchanged.

Benchmark impact expected if CAMELTrack is later evaluated: direct evidence on whether context-aware multi-cue association reduces CAY ID switches in crowded/occluded sequences while preserving persistent roster identity across cuts. Promotion remains impossible without measured improvement.

## Status
**Integrated as benchmark candidate / runtime rejected for now.**

## Risks / dependencies
- Apache-2.0 covers the inspected repository, but transitive dependencies and downloadable checkpoints/model weights require their own audit before runtime use.
- CAMELTrack is Python/TrackLab based and would add materially more deployment complexity than the current browser-first CAY runtime.
- Upstream benchmark performance is not evidence of performance on C.A. Yenne footage; real-video CAY benchmark gates remain mandatory.
- The learned module must never override CAY product invariants: max 11 simultaneous CAY players, anti-yellow false-positive veto, bench/spectator exclusion, explicit identity confidence and `INDISPONIBLE` for undefendable stats.
