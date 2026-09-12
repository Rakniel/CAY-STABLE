# OSS provenance — Roboflow Trackers candidate (2026-09-12)

## Source inspected

- Project: `roboflow/trackers`
- Source: https://github.com/roboflow/trackers
- Upstream release inspected: `2.6.0`
- Upstream tag commit: `0e839f348d8bf4ed09eea9f3bef58fd5f95dca3f`
- Release date: 2026-08-06
- License: Apache-2.0
- Runtime: Python >= 3.10
- Direct dependencies declared by upstream 2.6.0: NumPy, Supervision, SciPy, OpenCV-Python, Rich, Requests and pydeprecate. Optional mask tracking adds Torch/Torchvision/rf-segment-anything/rf-cutie and therefore requires a separate dependency/model/weight audit before use.

## Why this candidate matters for CAY-STABLE

Roboflow Trackers is a clean-room tracking library that provides ByteTrack and BoT-SORT under Apache-2.0 instead of the AGPL boundary currently encountered with BoxMOT. Release 2.6.0 also exposes timestamp-aware updates, camera-motion compensation utilities and fixes around lost-track lifecycle semantics. This makes it a substantially better legal/technical benchmark candidate for the C.A. Yenne tracking path.

No Roboflow Trackers source code, weights or data are copied into CAY-STABLE in this change. The browser runtime remains dependency-free from Python/OpenCV/PyTorch.

## CAY-STABLE adaptation

A new clean-room contract, `tracking_backend_candidate_v1.js`, reuses the existing CAY permissive-license policy from `detector_license_guard_v1.js` rather than duplicating a second license allowlist.

Before an external tracker backend can even enter the benchmark queue, the contract requires:

- exact project, source URL, upstream version, immutable revision and license provenance;
- a permissive license accepted by the existing CAY license guard;
- an explicitly supported tracking algorithm;
- an explicit external/offline Python runtime boundary, so no fake browser backend is implied;
- a declared camera-motion capability when BoT-SORT is claimed;
- explicit marking of optional or bundled weights so their licenses can be audited independently.

The contract returns only `ELIGIBLE_FOR_BENCHMARK`. It never promotes a backend to STABLE by itself. Promotion still requires the existing CAY tracking, false-CAY/bench-spectator, metric-trajectory and persistent-identity gates.

## What this replaces / work avoided

This replaces future per-library legal/provenance glue for ByteTrack/BoT-SORT candidates and gives one reusable admission contract before benchmark execution. Estimated engineering work avoided: roughly 0.5–1 day for each new external tracker family, because license/provenance/runtime-boundary validation no longer needs to be rewritten.

## Expected measurable impact

The immediate measurable impact is procedural rather than accuracy-related: incompatible candidates (for example AGPL declarations), missing immutable revisions, unsupported algorithms or hidden runtime assumptions are rejected before benchmark work starts. The expected tracking benefit comes later, if Roboflow Trackers 2.6.0 beats the current CAY baseline on the already-existing HOTA/IDF1/MOTA, false-CAY, trajectory and persistent-identity gates.

No accuracy gain is claimed yet because representative C.A. Yenne clips have not been benchmarked through this external backend in this change.

## Status

- Roboflow Trackers 2.6.0: **studied / eligible for benchmark**.
- Direct runtime integration: **not yet integrated**.
- Code copied from upstream: **none**.
- New mandatory browser dependency: **none**.
- BoxMOT remains **rejected for runtime incorporation under the current CAY permissive-license policy** because its public package/repository is AGPL-3.0.

## Risks / next benchmark step

- Python/OpenCV adds an offline/native execution dependency, so the backend should remain optional unless the measured gain justifies it.
- BoT-SORT camera-motion compensation must still feed CAY's existing audited camera-motion evidence contract rather than bypassing calibration safeguards.
- Optional ReID/mask weights require separate license/provenance review.
- Version 2.6.0 changed lost-track boundary semantics; benchmarks must pin the exact version and revision above so HOTA/IDF1 comparisons remain reproducible.
