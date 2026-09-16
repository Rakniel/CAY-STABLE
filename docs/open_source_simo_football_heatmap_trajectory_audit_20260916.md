# OSS audit — Simo-03/football-player-detection heatmaps & trajectories

Date: 2026-09-16

## Provenance
- Project: https://github.com/Simo-03/football-player-detection
- Audited revision: `c0c305d4763819f0e0f28e6557bd443d2b3fc973`
- License: MIT (`LICENSE`, copyright 2025 Selim Sherif)
- Files inspected: repository tree and `src/io/generate_player_heatmap.py`.

## Useful upstream pattern
The project keeps player heatmap/trajectory generation as post-processing over pitch-space samples rather than coupling visualization to detector/tracker inference. Its heatmap path maps pitch coordinates to a fixed canvas, accumulates samples into a 2-D density field, applies Gaussian smoothing, normalizes the density, then overlays it on a football-pitch rendering. The repository also separates `generate_pitch_trajectories.py`, match reports and pass-network rendering from the online vision path.

## CAY-STABLE decision
**Status: studied / design benchmark / no source copied.**

CAY-STABLE already has the safer `metric_pitch_heatmap_v1.js` contract, which only accepts positions projected through validated pitch calibration and exposes metric coverage. Replacing it with upstream code would duplicate logic and weaken the explicit `INDISPONIBLE` policy. Therefore no runtime import is justified.

The useful adaptation is architectural: keep heatmap and trajectory rendering downstream of the canonical validated pitch-coordinate artifact. One accepted player-position stream should feed trajectory, heatmap and later distance/speed products, rather than each visualization rebuilding projection/filtering rules. This is consistent with the existing CAY artifact-first architecture and avoids detector-specific visualization code.

## What this can replace / avoid
- Avoid a second heatmap coordinate/projection implementation.
- Avoid coupling heatmap rendering to a particular detector or tracker.
- Avoid separate preprocessing for trajectory and heatmap when both can consume the same validated player-position artifact.

Estimated engineering avoided: **0.5–1 day** of visualization/plumbing exploration. This is a design estimate, not a measured runtime speedup.

## Expected measurable impact
When the CAY trajectory renderer is wired to the same validated pitch-coordinate samples as `metric_pitch_heatmap_v1.js`, benchmark:
- identical accepted/rejected sample counts between trajectory and heatmap for the same player/window;
- identical metric coverage provenance;
- zero rendered points from uncalibrated, out-of-pitch or invalid camera segments;
- deterministic output for the same artifact;
- no change to tracking IDs or the 11-on-field invariant.

## License/dependency risks
The repository code is MIT, but its broader runtime uses third-party packages and YOLO model weights whose licenses are separate. This audit does **not** approve or import any YOLO/Ultralytics weights, tracker implementation, model download, dataset, OpenCV binary, or transitive dependency. Each must be audited independently before reuse.

## Modification record
No upstream source code, weights, data or configuration copied. Only the architecture/design pattern above is recorded as an independent CAY design reference.