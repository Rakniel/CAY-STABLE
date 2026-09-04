# TrackEval audit — CAY-STABLE

- Upstream: `JonathonLuiten/TrackEval`
- Revision inspected: `12c8791b303e0a0b50f753af204249e622d0281a`
- License: MIT
- Upstream purpose: reference implementation/evaluation framework for multi-object tracking metrics including HOTA, CLEAR MOT and Identity/IDF1 families.
- CAY-STABLE status: **evaluation-only integration pattern; no upstream source code copied into the runtime**.

## CAY reuse

CAY-STABLE already exports MOTChallenge-compatible rows and packages them through `tracking_trackeval_bundle_v1.js`. The local bundle deliberately contains only sequence metadata, CAY tracker rows and manually/independently prepared ground-truth rows. It does not vendor TrackEval or make Python a browser/runtime dependency.

Recommended external evaluation metrics remain `HOTA`, `Identity` and `CLEAR`, matching the local bundle contract. This allows ByteTrack/BoT-SORT/ReID candidates to be compared on exactly the same C.A. Yenne sequences before any backend is promoted.

## What this replaces

This avoids inventing a bespoke tracker score from continuity alone. CAY can keep its club-specific safety metrics (false CAY, bench/spectator leakage, yellow-detail veto, identity episode stability) while also exporting to a mature standard MOT evaluation tool.

## License boundary

MIT is compatible with the current project policy. No TrackEval code is copied here, so there is no runtime attribution payload or Python dependency to ship. If TrackEval is later vendored or redistributed, retain its MIT copyright/license notice and document the exact version.

## Expected gain

Estimated 0.5–1 day of evaluation-plumbing work avoided, plus better comparability of tracker candidates through HOTA/IDF1/CLEAR instead of ad-hoc scores.

## Risks / dependencies

- TrackEval itself is Python-based and should remain optional/offline unless runtime evidence justifies otherwise.
- MOT metrics alone do not protect CAY-specific errors; promotion still requires club-specific false-positive, bench/spectator and identity checks.
- Ground truth quality remains the limiting factor: poor annotations can make a precise evaluator produce misleading conclusions.
