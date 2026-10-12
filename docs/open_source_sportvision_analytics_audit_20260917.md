# OSS audit — MohibShaikh/sportvision

Date: 2026-09-17

## Provenance
- Project: https://github.com/MohibShaikh/sportvision
- Audited revision: `972a3ed29d02aa9c7298924fa2ef8aafacd16998`
- License: Apache-2.0 (repository metadata and root `LICENSE` present)
- Upstream status at audit: active Python package with CI, tests, analytics modules and PyPI packaging.

## Useful patterns
SportVision cleanly separates detector/tracker output from small analytics consumers (`distance`, `speed`, `possession`, `heatmap`). Its heatmap accumulator consumes already-established field positions and keeps visualization downstream of tracking/projection rather than embedding detection logic inside the visualization.

This confirms the CAY-STABLE direction: one canonical validated metric-position evidence stream must feed trajectories, heatmaps and physical metrics. No downstream visualization may silently reconstruct, clip or substitute image-space coordinates when metric evidence is unavailable.

## CAY-STABLE adaptation
No SportVision source code is copied in this change. CAY already has stricter metric/calibration/coverage contracts, so importing the Python implementation would duplicate logic and add an unnecessary runtime stack.

The reusable design rule is:
1. detector/tracker identity evidence remains upstream;
2. camera segment + independently validated calibration produce canonical pitch-metre samples;
3. trajectories, heatmaps, distance/speed and later ball events consume only accepted samples;
4. every consumer exposes accepted/rejected sample counts and coverage from the same evidence population;
5. camera cuts, invalid calibration, identity uncertainty and out-of-pitch samples break continuity and cannot be bridged by a renderer;
6. insufficient evidence remains `INDISPONIBLE`.

## What this replaces / avoids
Avoids implementing separate position normalization or clipping logic inside each CAY visualization/statistics feature. It also provides a lightweight external baseline against which the existing CAY metric consumers can be checked without making SportVision a production dependency.

## Expected measurable impact
- exact parity of accepted metric sample IDs across trajectory/heatmap/physical-stat consumers when configured on the same evidence window;
- zero metric samples accepted across an unvalidated camera segment;
- zero image-coordinate fallback samples;
- easier detection of coverage drift between UI and statistics;
- estimated 0.5–1 day of duplicated analytics plumbing/debugging avoided.

## License/dependency boundary
Apache-2.0 is compatible with the current permissive-reference policy. This audit does not import SportVision, RF-DETR, Roboflow, Supervision, model weights, datasets or transitive dependencies. Any future direct incorporation must separately record the exact component/version, preserve Apache-2.0 notices where required, and audit model/data licenses independently.

## Status
**Studied / architecture confirmed / runtime import rejected as redundant.**

No runtime behavior changes in this commit; therefore no performance/accuracy gain is claimed yet. A future runtime integration must pass CAY syntax, integration and non-regression gates and demonstrate before/after measurements on representative C.A. Yenne footage before merge.
