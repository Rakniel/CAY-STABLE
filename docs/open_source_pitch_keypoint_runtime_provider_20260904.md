# Open-source pitch-keypoint runtime provider — 2026-09-04

## Goal

Connect a real semantic pitch-keypoint inference source to the existing CAY-STABLE chain without introducing a second calibration engine, a silent model download, or an unreviewed licence dependency.

Runtime chain after this change:

`approved keypoint provider -> 32 semantic CAY landmarks -> pitch_semantic_calibration_v2 -> validated metric projector -> existing segment registry -> trajectories / heatmaps / metric stats`

The ordinary field polygon is **not** converted into a metric homography.

## Sources audited

### rafaelsouza-tech/soccer-tactical-vision
- Audited revision: `4c557534c624948f3bfe3db956859c7ea3b442fa`.
- Repository licence: MIT (`LICENSE` at the audited revision).
- Relevant mature idea: keep pitch-keypoint inference behind a replaceable stage contract and let the geometry/calibration pipeline consume semantic keypoints rather than coupling model code to homography logic.
- Published registration benchmark in the audited repository: 3,212 SoccerNet validation frames; keypoint model median error 6.1 px; official JaC@5 0.34 with calibration completeness 0.66; ground-plane JaC@5 0.44 with completeness 0.75.
- CAY reuse: interface/stage-contract idea only. No source code copied.
- Model/weight status: **not bundled / not promoted**. Repository code licensing does not by itself prove the licence of a particular downloaded fine-tuned weight artifact, so CAY still requires explicit weight provenance before execution.

### DesusLove/Football-PitchVision
- Audited revision: `46afc3f626df106e112023500b9a3329936ebbf3`.
- Repository code licence: MIT.
- Repository README explicitly declares the YOLOv8 detection/keypoint weights as AGPL-3.0.
- Relevant feature: 32-keypoint soccer-pitch detection confirms compatibility of the 32-landmark topology with a practical radar pipeline.
- CAY decision: **runtime weight path rejected** under the current CAY-STABLE licence policy. No code or weight copied.

## CAY integration

`stable_runtime_tracking_v2.js` now exposes `CAYStableSemanticKeypointRuntime` and an optional provider contract:

- `inferPitchKeypoints(canvas, context)` must be explicitly present;
- `runtimeDefaultAllowed` must be exactly `true`;
- provenance must contain `source`, `license`, and a concrete `revision`, `weightId`, or `sha256`;
- AGPL/GPL provenance is rejected **before inference is executed**;
- no provider means no semantic calibration attempt and metrics remain fail-closed;
- accepted output is passed to the existing `CAYStableMetricVisualsRuntime.calibrateSemanticSegment()`; no calibration logic is duplicated;
- first automatic calibration is immediately armed as a dynamic keyframe unless the provider explicitly declares `assumeStaticCamera === true`, so a single stale camera solution cannot remain valid indefinitely;
- subsequent accepted frames become validated refresh keyframes through the existing registry;
- keypoint inference runs only after the tracking bridge has resolved the current segment, preventing a camera cut from registering the new frame against the previous plan.

## Modifications / provenance record

- External code copied: none.
- External model or weight bundled: none.
- Runtime dependency added: none.
- CAY files changed: `stable_runtime_tracking_v2.js`.
- Test added: `tests/stable_semantic_keypoint_provider_runtime_nonregression.js`.
- Expected work avoided: roughly 0.5–1 day by reusing the existing semantic calibration and dynamic segment registry instead of building another model-specific calibration path.
- Expected measurable impact once a legally approved keypoint backend is plugged in: semantic calibrations can reach the real long-term tracking runtime; stale one-frame calibration is freshness-gated instead of remaining silently valid for the whole segment.

## Remaining risks

1. No third-party pitch-keypoint weight is promoted by this change. Exact weight licence/provenance and C.A. Yenne real-video accuracy remain mandatory.
2. A provider can still return insufficient keypoints; the existing minimum-support and geometry checks remain authoritative and return `INDISPONIBLE` when evidence is weak.
3. Automatic provider calls add inference cost. The first real backend must be benchmarked for latency and calibration coverage before promotion.
4. Camera close-ups/behind-goal views can remain geometrically under-constrained; no fallback to image coordinates is allowed for metric claims.
