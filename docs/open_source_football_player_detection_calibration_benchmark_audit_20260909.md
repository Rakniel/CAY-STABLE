# OSS audit — football-player-detection calibration benchmark — 2026-09-09

## Source inspected
- Project: `Simo-03/football-player-detection`
- Revision inspected: `c0c305d4763819f0e0f28e6557bd443d2b3fc973`
- Revision date: 2026-07-08
- Repository license: MIT
- Relevant published pipeline: YOLO + BoT-SORT + OpenCV RANSAC homography, with homography candidates gated by inlier count, inlier ratio, pitch span and median reprojection error.
- README benchmark at the inspected revision reports valid homography projection on 693/750 frames (92.4%) plus 15 fallback frames (2.0%), while explicitly noting that independent ground-truth reprojection error and stronger tracking metrics remain future evaluation work.

## What CAY-STABLE adapts
CAY-STABLE does **not** copy source code, model weights, configuration files or thresholds from this project. The useful idea adapted clean-room is the reporting pattern: calibration work should expose a concise runtime valid-projection rate and distinguish direct valid projections from fallback-valid projections so before/after changes can be measured instead of judged visually.

New internal component: `calibration_runtime_benchmark_v1.js`.
It consumes already-produced diagnostic rows and reports attempted/not-attempted frames, valid/invalid projection frames, direct/fallback valid frames, valid projection rate, direct-valid rate, fallback rate/share and mean confidence. `compare()` exposes explicit before/after deltas.

## Why this does not replace CAY guards
The benchmark is diagnostic only. It does not alter `metric_segment_registry_v1`, dynamic calibration freshness, metric publication, homography validation or any player metric. A higher valid-projection rate cannot make an otherwise rejected calibration publishable.

CAY remains intentionally stricter on dynamic-camera freshness: existing tests demonstrate calibrated keyframes becoming unavailable once their explicit age limit is exceeded rather than allowing a long implicit stale-transform reuse.

## Legal / dependency decision
- Repository source: MIT, legally compatible in principle.
- Code copied: none.
- Weights copied: none.
- Dependencies added: none.
- Thresholds copied: none.
- Status: **IDEA ADAPTED / INTERNAL BENCHMARK INTEGRATED**.

## Engineering impact
Expected work avoided: roughly 0.25–0.5 day versus designing a calibration A/B reporting format later during real-video benchmarking.
Measurable impact: every future calibration/GMC candidate can now report the same before/after valid-projection and fallback deltas, making promotion decisions faster and less subjective.
