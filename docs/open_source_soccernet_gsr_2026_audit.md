# SoccernetGSR / Broadcast2Pitch — 2026 audit

## Upstream provenance

- Project: `yinmayoo185/SoccernetGSR`
- Public repository: https://github.com/yinmayoo185/SoccernetGSR
- Snapshot inspected: commit `dbfb65c05c847e8e50baa47aa91ace960cc5e600` (2026-06-02)
- Upstream claims: winner of the SoccerNet Game State Reconstruction 2025 Challenge and WACV 2026 Best Paper: Application.
- Scope advertised upstream: camera calibration / homography, player tracking, ReID, jersey number / role recognition and ID-aware tracklet refinement.

## License decision

**Status: REJECTED FOR CODE / MODEL INTEGRATION PENDING LICENSE CLARIFICATION.**

At the inspected snapshot, the repository root does not expose a `LICENSE` file through the GitHub contents API and the README section inspected does not grant a software license. Public source availability is not permission to copy, modify, redistribute or integrate the implementation.

Therefore CAY-STABLE must not:

- copy source code from this repository;
- vendor its models or weights;
- port implementation details line-for-line;
- add the repository as a runtime dependency;
- redistribute derived code from it.

A future re-evaluation is allowed only if the upstream authors publish an explicit compatible software/model license or provide written permission whose conditions are accepted for CAY-STABLE.

## Technically useful observations (concept-only)

The architecture is still valuable as a **benchmark/reference map**, because it validates that a competitive broadcast-football GSR pipeline benefits from explicit stages for:

1. sports-field registration / homography before metric projection;
2. persistent MOT followed by ReID evidence;
3. role and jersey evidence as separate identity signals;
4. post-tracking, ID-aware tracklet refinement rather than trusting raw online IDs as final identity;
5. explicit format conversion/evaluation after inference.

These are ideas only. CAY-STABLE already has separate calibration, tracking, ReID-evidence, manual identity, replacement and metric-publication contracts; those existing modules remain authoritative and should be extended rather than duplicated.

## What this replaces in CAY-STABLE

Nothing at runtime. The useful gain is architectural confidence and benchmark prioritization only:

- keep `metric_homography_projector_v1.js` / multi-plan calibration as the metric gate;
- keep the existing persistent tracking + segment ReID guards;
- continue building evidence fusion rather than making jersey/role a single hard identity key;
- evaluate any future tracklet-refinement backend through `tracking_benchmark_v1.js` and the same ground-truth evidence contract.

## Estimated work avoided

Approximately **0.5–1 day of architecture/benchmark-design exploration** is avoided because the challenge-winning pipeline independently confirms the value of calibration → tracking → ReID/role evidence → tracklet refinement → evaluation as separate stages.

No implementation time is claimed as saved because no upstream code can legally be reused under the current licensing state.

## Expected measurable impact

No direct runtime impact in this change. The expected downstream impact is a better prioritised benchmark plan:

- ID switches and fragmentation measured before/after any tracklet-refinement experiment;
- calibration coverage and projection error kept separate from tracking quality;
- jersey/role evidence evaluated as identity evidence, never as sole proof;
- CAY-specific false-positive, 11-player and spectator/bench guards remain mandatory.

## Dependencies / risks

The upstream installation requires a heavy GPU/CUDA Python stack and references CLIP and `deep-person-reid`; every transitive dependency and every model weight would require its own license audit even if the repository later receives a permissive license.

Domain mismatch also remains: SoccerNet challenge broadcast footage is not identical to C.A. Yenne amateur footage, with different camera height, zoom, cuts, occlusions, bench proximity and kit conditions.

## CAY-STABLE status

- Studied: **yes**
- Code integrated: **no**
- Models/weights integrated: **no**
- Runtime dependency added: **no**
- License status: **absent / not granted at inspected snapshot**
- Decision: **reference only; reject code/model reuse until relicensed or explicitly permitted**
