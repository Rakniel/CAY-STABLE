# mplsoccer heatmap/binning adaptation — 2026-09-06

## Source
- Project: `andrewRowlinson/mplsoccer`
- Audited revision: `ad40c4ccbade56263ccd1d038ad49044fa9928d8`
- License: MIT
- License file SHA: `b70600110fd3699fbfba1b4be7d7a2887d752c25`

## CAY use
CAY-STABLE does **not** vendor, import, or execute mplsoccer Python code. The reusable idea is the mature football-analysis convention of aggregating validated pitch coordinates into spatial bins before rendering a heatmap.

Implemented independently in `metric_heatmap_bins_v1.js` for the browser/Node runtime already used by CAY-STABLE.

## CAY-specific modifications
- metric pitch coordinates only;
- default 105 x 68 m field;
- 21 x 14 grid (5 m x ~4.86 m cells) for readable staff-facing summaries;
- hard rejection unless `metricValid === true` and `inField === true`;
- explicit rejected/valid sample counts and coverage;
- exact field edges clamped to the last bin;
- normalized density is deterministic and dependency-free;
- no KDE smoothing and no interpolation, so the UI does not invent spatial evidence;
- returns `INDISPONIBLE` when no defensible metric point exists.

## What it replaces / avoids
Avoids creating an ad-hoc heatmap renderer tied directly to raw image pixels and avoids pulling Python/matplotlib dependencies into the CAY browser build.

Estimated work avoided: 0.5–1 development day for binning, pitch-boundary handling, normalization and coverage guards.

## Promotion gate
The module is safe as a metric aggregation primitive. Publishing a player heatmap in STABLE still requires the upstream tracking + calibration pipeline to provide validated metric/in-field points and explicit coverage.

## Risks
- A heatmap is only as reliable as its upstream calibration/tracking.
- Bin resolution may need tuning after real C.A. Yenne video tests.
- Density is sample-count based; later runtime integration should compensate for irregular sampling if frame cadence is not stable.
