# Open-source audit — marco-willi/football-tracking-demo

Date: 2026-09-27

## Source and revision

- Repository: https://github.com/marco-willi/football-tracking-demo
- Audited revision: `75847b5d7f4693489c1f4f657e50e076e7be8c67`
- Repository license: MIT (copyright Marco Willi, 2023).
- License obligation for copied/substantial code: retain copyright and MIT permission notice.

## Useful pattern for CAY-STABLE

The repository compares a lightweight ByteTrack path with BoT-SORT and explicitly isolates camera-motion compensation (CMC) from appearance ReID. Its BoT-SORT configuration can run CMC while ReID remains disabled; the documented CMC choices include sparse optical flow, SIFT, ECC and ORB. This is relevant to broadcast/amateur football where camera pans can otherwise fragment identities.

The useful engineering idea is the separation of concerns: first evaluate whether camera-motion compensation alone reduces track fragmentation, then enable ReID only if measured identity persistence still requires it. This avoids making a heavyweight appearance model a prerequisite for the STABLE milestone.

## License/dependency boundary

The repository code is MIT-compatible for selective adaptation with notice retention, but runtime dependencies remain separate license boundaries. In particular, BoxMOT/BoT-SORT, any ReID implementation and every downloaded ReID weight must be audited at the exact version before being added to CAY-STABLE. Ultralytics/model licensing must also be treated independently. No external code, model weights, datasets or videos are imported by this audit.

## CAY-STABLE mapping

CAY-STABLE already has persistent tracking and camera/calibration logic, so this project must not be vendored wholesale and must not create a second tracking pipeline.

Recommended next experiment:

1. Add an optional CMC adapter at the existing tracker boundary, disabled by default until benchmarked.
2. Compare current tracking against CMC-only BoT-SORT semantics on identical C.A. Yenne sequences containing pans, zooms, occlusions and re-entry.
3. Measure ID switches, fragmentation/re-entry continuity, false CAY assignments and processing cost; retain the existing 11-on-field cap, bench/spectator exclusion and manual-frame contracts.
4. Keep ReID disabled during the first comparison. Audit and introduce a ReID model only if CMC-only evidence is insufficient.
5. Do not claim improvement unless non-regression tests and real-video measurements beat the current baseline without degrading CAY precision.

No source code is copied in this audit commit. A future adaptation must record exact upstream files/functions, dependency versions/licenses, local modifications and before/after measurements.

## Estimated impact

- Code reused in this audit: none.
- Work avoided: approximately 0.5–1 engineering day of tracker/CMC architecture exploration.
- Expected impact if validated: fewer ID breaks caused by camera pans with substantially less complexity than immediately adding ReID; cleaner trajectories/heatmaps and stronger per-player coverage.
- Status: **studied / MIT-compatible / selective CMC experiment candidate**.
- Risks: the upstream demo is not a C.A. Yenne benchmark; dependency and model licenses are independent; CMC can fail on cuts/large non-planar motion and therefore must remain segment-aware/fail-safe.