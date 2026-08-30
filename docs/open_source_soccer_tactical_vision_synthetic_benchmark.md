# soccer-tactical-vision — synthetic benchmark assessment

## Upstream
- Project: `rafaelsouza-tech/soccer-tactical-vision`
- Upstream default branch reviewed: `main`
- Review date: 2026-08-30
- Repository license: MIT
- Upstream repository metadata confirms SPDX `MIT`.
- No upstream source code is copied into CAY-STABLE by this assessment.

## Why this project is useful to CAY-STABLE now
The strongest immediate value is not another detector or tracker. It is the deterministic synthetic-clip and ground-truth testing strategy around a football-specific geometry pipeline.

The upstream project exposes a CPU-only synthetic demo with generated football footage and full ground truth, and uses it to exercise stage contracts spanning detection-like observations, ball trajectories, pitch registration, projection, rendering and tactical outputs. Its README also reports deterministic testing with injected keypoint noise/dropout and explicit before/after camera-jitter measurements.

For CAY-STABLE this directly addresses the current bottleneck: many robust tracking/calibration/metric guards already exist, but real-footage validation is expensive and does not provide perfect ground truth. A small deterministic CAY-native synthetic fixture can therefore catch regressions before real-video benchmarking.

## Clean-room adaptation proposed
Status: **STUDIED / DESIGN ADAPTED; NO UPSTREAM CODE COPIED**.

CAY-STABLE should extend its existing JavaScript non-regression fixtures rather than import the Python package. The useful idea is a deterministic synthetic match-segment generator producing normalized observations and known expected outputs.

Minimum CAY fixture contract:
- up to 11 simultaneous CAY players, with roster IDs greater than 11 allowed through substitutions;
- known pitch-space trajectories and timestamps;
- deterministic camera pan/zoom transform per frame;
- optional camera cut / multi-plan segment boundary;
- configurable observation dropout and coordinate noise;
- optional spectator/bench/referee clutter;
- explicit yellow-detail-only false-CAY candidates;
- known ball path and nearest-player ownership windows for later phases;
- ground-truth visibility mask so coverage can be scored separately from tracking correctness.

The synthetic generator must feed existing CAY contracts (`tracking_core`, bridge, homography/projector, trajectory and metric guards) rather than create parallel tracking or metric logic.

## Measurements to add before promotion
A generated fixture is useful only if it produces measurable gates. Proposed non-regression outputs:
1. **ID continuity:** percentage of visible ground-truth player observations preserving the expected persistent ID.
2. **False CAY:** hard target 0 for bench/spectator/yellow-detail-only clutter.
3. **11-player invariant:** published simultaneous CAY count never exceeds 11.
4. **Coverage honesty:** observed/evaluable coverage must match the synthetic visibility mask within a small deterministic tolerance.
5. **Projection error:** median and high-percentile pitch-space error after homography.
6. **Trajectory error:** path-point RMSE / median error for evaluable samples.
7. **Metric error:** distance and speed compared with ground truth only when metric publication guards classify the segment as defensible.
8. **Cut isolation:** no track/homography continuity may silently cross a declared multi-plan cut unless an explicit re-identification rule validates it.

## Expected work avoided / impact
- Estimated work avoided: **0.5–1.5 days** versus designing a benchmark strategy from scratch.
- Expected impact: faster and repeatable diagnosis of regressions in homography, camera compensation, ID persistence, coverage and physical metrics before spending time on real C.A. Yenne footage.
- Expected CI impact: a lightweight JS fixture should stay CPU-only and deterministic, avoiding model downloads and GPU dependencies.

## Licensing / dependency assessment
The upstream repository is MIT. Its README explicitly states that it deliberately avoids AGPL/GPL runtime dependencies in the core path and keeps optional PnLCalib evaluation isolated. It also documents separate licenses/usage constraints for datasets and model-related assets. Those statements are useful architectural guidance but do not authorize importing third-party weights or datasets into CAY-STABLE.

CAY-STABLE decision:
- reuse the **testing/benchmark design idea** clean-room;
- copy **no upstream implementation** at this stage;
- add **no Python runtime dependency**;
- add **no model weights or SoccerNet broadcast frames**;
- audit any future dataset/model independently before integration.

## Provenance
- Upstream: `rafaelsouza-tech/soccer-tactical-vision`
- Capability studied: deterministic synthetic football clip + full ground truth; stage-contract testing; camera-registration quality measurements.
- License: MIT.
- Local modification: conceptual adaptation to existing browser/Node CAY-STABLE contracts, strict CAY roster/clutter/coverage rules, no copied code.

## Promotion criterion
Promote this from documentation to implementation only as an extension of the existing CAY non-regression framework. The first implementation should remain small and deterministic and must prove a measurable regression signal for at least tracking continuity + false-CAY + coverage + homography before more synthetic features are added.
