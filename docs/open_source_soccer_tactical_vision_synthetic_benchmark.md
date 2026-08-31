# soccer-tactical-vision — synthetic benchmark assessment

## Upstream
- Project: `rafaelsouza-tech/soccer-tactical-vision`
- Upstream default branch reviewed: `main`
- Review dates: 2026-08-30 and 2026-09-01
- Repository license: MIT
- Upstream repository metadata/README identifies the project as MIT.
- No upstream source code is copied into CAY-STABLE by this adaptation.

## Why this project is useful to CAY-STABLE now
The strongest immediate value is not another detector or tracker. It is the deterministic synthetic-clip and ground-truth testing strategy around a football-specific geometry pipeline.

The upstream project exposes a CPU-only synthetic demo with generated football footage and full ground truth, and uses it to exercise stage contracts spanning detection-like observations, ball trajectories, pitch registration, projection, rendering and tactical outputs. Its README also describes deterministic validation of calibration/tracking stages.

For CAY-STABLE this directly addresses a core bottleneck: robust tracking/calibration/metric guards exist, while real-footage validation is slower and does not provide perfect ground truth. A deterministic CAY-native fixture can catch regressions before real-video benchmarking.

## Clean-room adaptation
Status: **INTEGRATED AS CAY-NATIVE TEST FIXTURE; NO UPSTREAM CODE COPIED**.

Implemented locally:
- `synthetic_tracking_benchmark_v1.js`
- `tests/synthetic_tracking_benchmark_nonregression.js`

The implementation was written from CAY-STABLE contracts and the benchmark idea only. It imports the existing `tracking_core_v1.js`; it does not import the upstream Python package, model weights, datasets or implementation files.

Current deterministic fixture covers:
- 11 simultaneous CAY players maximum;
- unique persistent appearance evidence per synthetic player;
- deterministic motion paths;
- deterministic short occlusions;
- synthetic camera pan + mild zoom;
- explicit camera cut / second segment;
- archived-track ReID after the cut;
- visible-ground-truth assignment coverage;
- persistent ID continuity;
- deterministic replay equality.

The fixture deliberately extends existing CAY logic rather than creating parallel tracking logic.

## Measured promotion gates
The non-regression test fails unless all of the following remain true:
1. explicit multi-plan cut produces exactly two tracking segments;
2. published simultaneous CAY assignments never exceed 11;
3. visible-player assignment coverage remains at least 98%;
4. persistent ID continuity remains at least 98%;
5. the cut actually exercises archived-track re-identification;
6. a second identical run produces exactly the same benchmark result.

Future extensions should add false-CAY clutter/yellow-detail candidates through the existing strict membership/filtering layer, plus homography projection error, trajectory RMSE and distance/speed error once those stages are wired into the same fixture.

## Expected work avoided / impact
- Estimated work avoided: **0.5–1.5 days** versus designing a football-specific deterministic benchmark strategy from scratch.
- Immediate impact: tracking changes now have a repeatable synthetic gate for 11-player invariants, camera cuts, occlusions, coverage and identity persistence.
- Expected downstream impact: the same fixture can be extended to calibration, trajectories, heatmaps and physical metrics without introducing another benchmark framework.
- CI impact: CPU-only Node test, no model download and no GPU dependency.

## Licensing / dependency assessment
The upstream repository is MIT. Its README also documents separate constraints around datasets/models; those statements do not authorize importing third-party weights or broadcast media.

CAY-STABLE decision:
- reuse/adapt the **testing and benchmark design idea** clean-room;
- copy **no upstream implementation code**;
- add **no upstream runtime dependency**;
- add **no model weights or SoccerNet broadcast frames**;
- audit any future dataset/model independently before integration.

## Provenance, version and local modifications
- Upstream: `rafaelsouza-tech/soccer-tactical-vision`
- Upstream branch reviewed: `main`
- Capability studied: deterministic synthetic football clip + full ground truth; stage-contract testing; camera-registration/tracking quality measurements.
- License: MIT.
- Local version: `synthetic_tracking_benchmark_v1`.
- Local modifications: JavaScript/Node clean-room fixture designed for CAY-STABLE, capped at 11 simultaneous CAY players, deterministic occlusion schedule, explicit two-plan camera cut, CAY tracking-core ReID exercise, coverage and persistent-ID gates.
- Runtime dependency added: none beyond existing CAY-STABLE modules.

## Risks / limitations
- Current synthetic embeddings are intentionally easy to separate; this is a regression gate, not proof of real-world ReID accuracy.
- Camera transform is deterministic and simplified; real handheld/broadcast motion remains a separate benchmark requirement.
- False-CAY bench/spectator/yellow-detail testing must be attached to the strict membership guard rather than injected directly into `tracking_core_v1.js`, so the benchmark does not accidentally test the wrong layer.
- Real-video promotion remains mandatory for detector/tracker backend changes.

## Promotion criterion
This fixture is promoted only as a deterministic non-regression layer. It does not replace real C.A. Yenne footage validation. New tracking/calibration integrations must pass this fixture plus existing non-regression tests and then demonstrate measurable benefit on licensed/owned real footage before becoming the STABLE runtime default.
