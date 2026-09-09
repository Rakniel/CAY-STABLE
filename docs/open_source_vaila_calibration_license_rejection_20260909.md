# OSS audit — vailá soccer-field calibration — 2026-09-09

## Source / version

- Project: `vaila-multimodaltoolbox/vaila`
- Component reviewed: `vaila/soccerfield_calib.py` and related FIFA/DLT calibration workflow
- Upstream documented version: **0.3.44 (May 2026)**
- Upstream license for this component/project: **AGPL-3.0**
- Review date: **2026-09-09**

## Useful capability reviewed

The soccer calibration module fits a **DLT2D / planar homography** from manually selected pitch keypoints to a canonical **105 × 68 m** football pitch. The upstream documentation requires at least six correspondences, supports one or multiple frame rows, and emits a per-point reprojection/error report. Related tooling can export per-frame DLT artefacts for moving broadcast cameras.

These are technically relevant to CAY-STABLE because they cover manual calibration, homography auditability and moving-camera calibration artefacts without treating a single static transform as valid for an entire edited match.

## CAY-STABLE decision

**Status: REJECTED FOR DIRECT CODE/DEPENDENCY REUSE.**

Reason: AGPL-3.0 is outside the permissive licence boundary currently accepted for reusable external runtime components in CAY-STABLE. No source code, model weights, datasets, calibration tables or runtime dependency from vailá have been copied or vendored into CAY-STABLE.

The project may remain a **conceptual/benchmark reference only**. Any CAY implementation must remain independently implemented from already accepted/internal components and must not reproduce AGPL source.

## Existing CAY replacement / overlap

CAY-STABLE already has:

- `metric_homography_projector_v1.js` for metric pitch projection;
- `pitch_geometry_guard_v1.js` and semantic calibration guards;
- dynamic/multi-plan calibration and camera-motion artefact providers;
- `calibration_runtime_benchmark_v1.js` for before/after usable-frame coverage;
- explicit confidence, freshness, geometry and publication guards.

Therefore integrating vailá directly would duplicate substantial existing logic while introducing an unacceptable licence obligation.

## Useful idea retained without code reuse

The audit reinforces two product requirements already compatible with CAY architecture:

1. manual calibration should expose **reprojection evidence** instead of only a visually plausible overlay;
2. moving-camera/multi-plan material must use **time/frame-scoped calibration artefacts**, never silently extend one static homography across unrelated views.

No upstream implementation details are copied to achieve these requirements.

## Estimated work avoided / impact

- Direct integration avoided: approximately **0.25–0.5 day** of adapter/prototype work that would ultimately be unusable under the current licence policy.
- Main impact: prevents accidental introduction of an AGPL runtime dependency while preserving the useful calibration ideas as benchmark criteria.
- Runtime impact: **none**; no dependency added.

## Risks / dependencies

- AGPL-3.0 obligations are not accepted for CAY-STABLE runtime reuse under the current project policy.
- Upstream documentation/version can evolve; licence and provenance must be re-audited before any future reconsideration.
- Conceptual comparison is allowed, but source-level copying remains prohibited.
