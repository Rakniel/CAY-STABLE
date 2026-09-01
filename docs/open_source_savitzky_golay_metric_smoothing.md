# Open-source audit — Savitzky–Golay trajectory smoothing

Date inspected: 2026-09-01

## Source inspected
- Project: `mljs/savitzky-golay`
- Repository: https://github.com/mljs/savitzky-golay
- Package/version inspected: `ml-savitzky-golay` **5.0.0**
- Upstream main commit inspected: `7aee7c042d876ff7c04e5ed62940596de2ccfa10`
- License: **MIT**
- Upstream dependencies: `ml-matrix`, `ml-pad-array`

## Football-specific supporting reference
The public Friends-of-Tracking `Metrica_Velocities.py` example was also inspected because it explicitly uses Savitzky–Golay smoothing before deriving football player velocity from Metrica tracking data. CAY-STABLE does **not** copy or import that file and does not rely on its repository licensing for this integration.

## CAY-STABLE adaptation
No upstream implementation code or dependency was copied. `metric_trajectory_smoother_v1.js` is a clean-room, dependency-free implementation of a fixed five-point quadratic Savitzky–Golay smoothing window using the standard symmetric coefficients `[-3, 12, 17, 12, -3] / 35`.

The adaptation is deliberately narrower than the generic upstream package:
- pitch coordinates only, after an explicitly validated CAY homography/projector;
- five samples only;
- no smoothing across camera/segment changes;
- no smoothing if any local gap exceeds 1 second;
- no smoothing when local sampling intervals differ by more than 35%;
- original boundary samples are preserved;
- original raw metric distance remains exported for audit beside the corrected distance.

`player_stats_v1.js` now derives distance, average speed, maximum speed and sprint continuity from the conservative smoothed pitch path when a valid smoothing window exists. A raw projected pair implying more than 55 km/h is still rejected before smoothing is allowed to rescue it; smoothed pairs above 45 km/h remain rejected.

## What this replaces / work avoided
This avoids building a bespoke trajectory denoising stack and avoids importing SciPy/Python or the generic mljs matrix/padding dependency tree into the browser-first runtime. Estimated avoided work: **0.5–1 day** of algorithm/plumbing plus future dependency maintenance.

## Measurable validation target
Synthetic non-regression tests require:
- high-frequency lateral jitter to reduce measured path inflation;
- exact preservation of straight/linear movement;
- zero smoothing across a camera-plan cut;
- zero smoothing on strongly irregular timing;
- physical metrics to remain `INDISPONIBLE` without validated calibration.

The player report exposes `rawDistanceM`, `distanceM`, `distanceCorrectionPct`, smoothing coverage and smoothing method so the correction remains auditable.

## Risks / limitations
- This is not an official implementation of the full configurable `ml-savitzky-golay` package.
- A five-point filter can attenuate very short genuine direction changes; therefore CAY uses it only on locally regular samples and keeps raw values for audit.
- Real-video thresholds must still be validated on representative C.A. Yenne footage before claiming an accuracy improvement in metres/km/h.
- Smoothing cannot repair a wrong homography or wrong player identity; those upstream guards remain mandatory.
