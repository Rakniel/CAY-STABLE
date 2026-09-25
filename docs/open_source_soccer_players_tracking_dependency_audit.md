# OSS audit — francescopiocirillo/soccer-players-tracking

Audit date: 2026-09-25

## Provenance

- Project: https://github.com/francescopiocirillo/soccer-players-tracking
- Revision inspected: `ac5a36f4310f027abd9d8696dbd673ba2235edc9` (2026-04-18)
- Repository license: MIT (`LICENSE`, copyright 2026 Francesco Pio Cirillo)
- Upstream purpose: SoccerNet 2023 player tracking / ROI behavior analysis.

## Technically useful evidence

The project reports an end-to-end football pipeline using a fine-tuned detector, pitch-mask filtering, ByteTrack/BoT-SORT-family tracking, camera-motion compensation, OSNet ReID and SoccerNet evaluation. The README reports HOTA@0.5 = 0.762231 and an inference memory footprint below 500 MB for its own tested setup.

The useful CAY-STABLE lesson is architectural rather than source-level: evaluate tracker changes on a football benchmark with an identity-sensitive metric, while keeping pitch/ROI exclusion evidence separate from MOT association. This reinforces CAY's existing requirement that generic HOTA/IDF1 gains cannot override false-CAY, yellow-detail, bench/spectator, 11-on-field, cut/multi-plan and re-entry guards.

## License boundary

**Do not import this pipeline as a runtime dependency merely because the top-level repository is MIT.** Its documented stack includes `boxmot` and Ultralytics components. CAY-STABLE has already audited the current public BoxMOT repository as AGPL-3.0, and model/framework/weight licenses must be checked independently. A permissive top-level LICENSE does not relicense transitive code, model weights, datasets or optional assets.

Therefore:

- no upstream source code is copied in this audit;
- no YOLO weights, OSNet weights, SoccerNet media/annotations or BoxMOT code are imported;
- any future reuse must pin and audit each concrete dependency and weight separately;
- CAY's existing permissive Roboflow Trackers candidate remains the cleaner backend path for a real tracker bake-off.

## What this replaces / avoids

This audit avoids a misleading shortcut: replacing CAY's current tracker stack with an apparently MIT end-to-end repository whose effective runtime dependency graph may impose stronger obligations. It also avoids duplicating another football tracker implementation when CAY already has confidence-cascade, GMC, ReID evidence and MOT/TrackEval boundaries.

Estimated work/risk avoided: ~1–3 days of integration/removal work plus license remediation.

## Expected measurable impact

No runtime gain is claimed. The concrete acceptance criterion remains: identical frozen CAY detections, current STABLE versus a legally compatible candidate backend, measured with HOTA/IDF1/ID switches and all CAY-specific exclusion/identity invariants. A backend is promoted only if it improves a predeclared metric without material regression elsewhere.

## Status

**Studied / source not integrated / transitive runtime rejected pending dependency-level license clearance.**
