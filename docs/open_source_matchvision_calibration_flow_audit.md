# MatchVision calibration + guarded flow audit

## Source
- Project: `BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline`
- Inspected commit: `9876ed6509cc3c6f8dc5241c53d6079d50ac60b9` (2026-06-18)
- Repository license: MIT
- Vendored calibration dependency: `external/pnlcalib` under GPL-2.0

## Useful design
MatchVision combines absolute pitch calibration keyframes with guarded optical-flow propagation between anchors. The useful architecture is:

1. absolute camera-to-pitch calibration on selected keyframes;
2. short-range optical-flow propagation between anchors;
3. forward/backward consistency and RANSAC-style validation of flow correspondences;
4. physical pitch-geometry plausibility checks;
5. pitch-line alignment error thresholding;
6. fresh absolute anchors override propagated transforms after pans, zooms, cuts or drift.

This is directly relevant to CAY-STABLE multi-plan calibration and camera-motion compensation because it avoids treating cumulative flow as ground truth.

## License decision
The top-level project is MIT and therefore legally permissive in isolation. However, its vendored PnLCalib implementation is GPL-2.0. CAY-STABLE must not copy or vendor PnLCalib source into the current codebase unless the project deliberately accepts the resulting GPL obligations.

Decision for now: **clean-room adaptation of the architecture only**. No MatchVision or PnLCalib code, model weights or dataset assets are copied. No runtime dependency is added.

## What this can replace/avoid in CAY-STABLE
This design avoids building a naive continuously accumulated camera-motion transform that drifts indefinitely. It also provides a concrete acceptance model for extending existing CAY homography/multi-plan contracts rather than introducing a parallel calibration stack.

Expected work avoided: approximately 0.5–1.5 days of calibration/motion-compensation design and failure-mode discovery.

## CAY-STABLE adaptation targets
- Keep existing per-plan absolute homographies as authoritative anchors.
- Permit short-range camera-motion compensation only inside the same validated camera plan.
- Reject propagation on camera cuts, insufficient correspondences, low inlier ratio, implausible pitch projection or excessive residual error.
- Force a new absolute/manual calibration after a cut or when drift exceeds the configured threshold.
- Never bridge distance, speed or heatmap dwell time across an unvalidated calibration transition.
- Expose coverage explicitly for frames where metric projection is unavailable.
- Preserve `INDISPONIBLE`/`PARTIEL` rather than manufacturing coordinates from stale transforms.

## Promotion criteria
Before runtime integration, a CAY-native implementation must pass deterministic tests for:
- stable projection under small synthetic pan/zoom;
- no accumulated metric drift beyond threshold;
- hard reset on camera-plan cut;
- no cross-plan distance inflation;
- explicit metric coverage loss when propagation is rejected;
- unchanged 11-player, zero-false-CAY and persistent-ID invariants.

## Status
**Studied / architecture retained / direct dependency rejected for now.**

## Risks and dependencies
- PnLCalib GPL-2.0 is not being incorporated.
- Any future detector/model/checkpoint requires a separate license audit.
- Optical flow can silently drift; it must remain subordinate to absolute calibration and measurable geometric gates.
