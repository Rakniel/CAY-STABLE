# BoxMOT audit — 2026-09-25

## Source and version

- Upstream: `mikel-brostrom/boxmot`
- Audited revision: `259625c81a633437d399a1697dd594b13e688363` (2026-09-18)
- Upstream license at that revision/current master: **GNU AGPL-3.0**.
- No BoxMOT source, configuration, model weight or vendored dependency is copied into CAY-STABLE by this audit.

## Why it was evaluated

BoxMOT is technically mature and directly relevant to the CAY tracking problem. It exposes interchangeable ByteTrack, BoT-SORT, StrongSORT, DeepOCSORT and other trackers, camera-motion compensation, ReID-capable variants, saved-detection evaluation and native C++ backends. The audited upstream revision also records 1,241 targeted tests passing and restores reproducible MOT17 evaluation.

## License decision

**REJECTED for CAY-STABLE runtime reuse under the current licensing strategy.**

AGPL-3.0 is not treated as a permissive dependency. In particular, incorporating/adapting covered BoxMOT code into the application or tightly coupling it as a network-served derivative would introduce source-availability obligations that have not been accepted for CAY-STABLE. We therefore do not copy its implementation, configs or code-derived thresholds.

This decision is intentionally stricter than merely checking whether the software can be executed. Any future exception requires an explicit project-level licensing decision before integration.

Model weights, ReID checkpoints, detectors and datasets referenced by BoxMOT are separate artifacts and must not be assumed to inherit the repository license.

## Useful engineering ideas retained without code reuse

The following are treated only as high-level benchmark/design ideas:

1. **Same-detections tracker bake-off.** Materialize/freeze one CAY detection stream, then compare tracker candidates on identical inputs. This prevents detector changes from being misreported as tracker gains.
2. **Runtime fingerprinting.** Record image-processing/runtime versions in benchmark provenance so cache/results cannot silently survive a behavior-changing OpenCV upgrade.
3. **CMC + state consistency tests.** Camera-motion compensation must transform the tracking state consistently, not only display boxes.
4. **ReID optionality.** Appearance must remain an optional evidence channel; CAY must benchmark ReID-on against ReID-off because same-kit players are visually similar.

These ideas extend CAY's existing TrackEval/MOT exports and conservative evidence architecture rather than creating a second tracking stack.

## CAY acceptance gate for any alternative permissive backend

A candidate must use the same frozen detections and beat or equal the current CAY tracker on HOTA/IDF1/ID switches while not regressing:

- false CAY assignments, especially yellow-detail confusion;
- bench/spectator exclusion;
- maximum 11 simultaneous on-pitch players while retaining a larger roster/substitutions;
- identity persistence through occlusion/re-entry;
- camera cuts and multi-plan segments;
- defended coverage and `INDISPONIBLE` behavior;
- processing cost and time-to-first-results.

No candidate is promoted from benchmark to runtime solely because its generic MOT benchmark is better.

## Expected avoided work

Using BoxMOT as a design/benchmark reference avoids roughly 1–3 days of rediscovering tracker comparison, cache-provenance and CMC-state validation patterns. It does **not** count as a runtime performance gain.

## Status

- Technical study: **complete**
- Runtime integration: **rejected (AGPL-3.0 boundary)**
- Code copied: **none**
- Runtime behavior changed: **none**
