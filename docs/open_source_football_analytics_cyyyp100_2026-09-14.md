# Open-source audit — cyyyp100/Football_Analytics

Audit date: 2026-09-14

## Provenance
- Project: `cyyyp100/Football_Analytics`
- Source: https://github.com/cyyyp100/Football_Analytics
- Audited revision: `41460b3d1867b1c7f567afa97becef53ba7b1496` (2026-08-17)
- Upstream license: MIT for repository code.
- Data boundary: upstream explicitly states that its Ligue 1/Ligue 2 optical-tracking data is third-party material and is not covered by the repository license or redistributed.

## What was inspected
The August 2026 rewrite consumes optical player/ball coordinates and exposes possession, ball-carrier pressure, team block area/compactness, momentum, Voronoi occupation, goal detection, canonical player-indexed trajectory tensors and velocity helpers. The README reports a full 95 MB match pipeline in about eight seconds and a goal detector recovering 11/11 manually annotated goals on two matches, while also documenting an interpolation artefact that can create phantom goal-line crossings.

## Useful design signals for CAY-STABLE
1. Keep metric computation downstream of one canonical metric-coordinate representation instead of recomputing from raw rows feature by feature.
2. Preserve explicit player presence/identity across substitutions before computing individual trajectories or velocities.
3. Normalize direction of play before cross-half trajectory comparisons.
4. Treat interpolated or otherwise synthetic ball motion as lower-quality evidence; geometry alone must not silently create an event.
5. Keep expensive aggregate metric passes vector/batch-oriented where possible.

These ideas are compatible with the existing CAY architecture, but most are already represented by CAY's segment registry, roster participation, metric trajectory pipeline and evidence-first ball/event policy.

## Reuse decision
- Status: **studied / not integrated**.
- Code copied: **none**.
- Models/weights/data copied: **none**.
- Why no direct import: the upstream project starts from vendor optical-tracking coordinates, whereas CAY-STABLE must first recover trustworthy identities and pitch coordinates from club video. Importing its Python/NumPy feature stack now would duplicate existing CAY logic and add a runtime boundary before a representative C.A. Yenne benchmark demonstrates a gain.
- Candidate future use: benchmark ball-carrier pressure, block compactness and direction-normalized aggregate metrics once CAY has sufficiently covered metric trajectories.

## Estimated acceleration
The project provides a concrete, recent reference for the downstream metric layer and its failure modes, avoiding roughly **0.5 day** of architecture/prototype exploration when pressure/compactness metrics are scheduled. There is **no immediate runtime gain** and therefore no dependency is added in this change.

## Risks / dependencies
- Very young public repository (few commits, no release/maturity signal yet at audit time).
- Python/NumPy-oriented architecture rather than CAY's browser-first runtime.
- Reported results are based on proprietary optical-tracking inputs, not C.A. Yenne broadcast/club video.
- Third-party tracking data licensing is separate from the MIT code license.
