# OSS audit — budun-ov/football-analytics

Date: 2026-09-27

## Provenance
- Project: `budun-ov/football-analytics`
- Source: https://github.com/budun-ov/football-analytics
- Audited revision: `cd2c43fce7f54100500058ac0ff5aba7a10fce94`
- Repository `LICENSE`: GNU Affero General Public License v3.0 (AGPL-3.0).

## Useful technical ideas observed
The project assembles a football pipeline around custom YOLO detections, ByteTrack, SigLIP/PCA/K-Means team classification, TVCalib, pitch-metre homography, ball-to-player proximity, Savitzky-Golay kinematics, radar and Voronoi rendering. It also caches tracking outputs so visualisation/configuration changes do not necessarily require rerunning detection.

The most useful product-level idea for CAY-STABLE is the explicit prerequisite graph: speed is unavailable unless calibration/pitch coordinates exist. This agrees with CAY's existing fail-closed publication policy and is a useful independent reference for keeping expensive stages optional while automatically enabling prerequisites when a requested output needs them.

## License decision
**REJECTED for code/runtime reuse.** The repository root license is AGPL-3.0. CAY-STABLE currently avoids incorporating AGPL/GPL implementation code into its permissive/browser-first runtime. No source file, model, weight, dataset, asset or checkpoint from this project is copied, vendored or adapted.

The upstream README's wording about research/educational use does not override or replace the actual root `LICENSE`; the root license is the authoritative boundary used by this audit.

## Dependency / asset boundary
The pipeline also depends on separately governed components/assets including Ultralytics YOLO, supervision, SigLIP/Transformers, TVCalib, SoccerNet-related calibration dependencies and externally hosted model weights. Even if the repository code license were acceptable, each model/weight/dataset/dependency would require its own provenance and license check before CAY integration.

## What CAY keeps
Only high-level, non-code architecture observations:
1. express output prerequisites explicitly (e.g. metric speed requires validated pitch coordinates);
2. cache validated intermediate artifacts so rendering/UX changes do not force detector reruns;
3. keep calibration preview/diagnostics separable from the main annotated output;
4. never silently fall back to pixel displacement for physical speed.

These observations do not replace existing CAY modules. They reinforce the current `INDISPONIBLE` contract and analysis-artifact architecture rather than introducing another detector/tracker/calibration implementation.

## Expected value
- Estimated avoided work: ~0.5–1 day of UX/pipeline orchestration rediscovery.
- Expected impact: faster repeated review/render cycles and fewer accidental requests for physically invalid speed outputs once the prerequisite graph is surfaced in the product workflow.
- Status: **studied / runtime rejected / architecture ideas retained only**.
- Risk: AGPL copyleft plus separately licensed weights/dependencies; therefore no implementation reuse.
