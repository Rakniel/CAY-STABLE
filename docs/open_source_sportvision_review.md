# Open-source audit — SportVision

Date inspected: 2026-09-07

## Project
- Source: `MohibShaikh/sportvision`
- Revision inspected: `ba96e1a3b82a95777bb7068594a69f0b866c47c1`
- Version at revision: `0.3.1`
- License: Apache-2.0 (repository `LICENSE` verified at the inspected revision).

## Useful architecture
SportVision provides a football analytics pipeline around detector outputs, ByteTrack-style multi-object tracking through the `supervision` ecosystem, team assignment, homography/pitch projection, trajectories, speed/distance, possession and heatmap-style visual outputs.

For CAY-STABLE the useful part is the architectural separation between detection/tracking output and downstream football analytics. That supports the existing CAY direction of accepting a neutral tracking artifact boundary rather than coupling player cards, trajectories and metrics to one detector/tracker implementation.

## CAY-STABLE decision
- No SportVision source code copied.
- No SportVision package or transitive dependency added.
- No SportVision model or weights added.
- The project is retained as an Apache-2.0 design/benchmark reference for external detector/tracker backends.
- CAY's existing guarded metric implementation is retained instead of replacing it with simpler distance/speed/heatmap logic: metric publication already requires validated geometry, explicit temporal evidence, confidence and fail-closed `INDISPONIBLE` states.
- The existing `motchallenge_tracking_artifact_adapter_v1.js` is the interchange boundary used for mature external trackers, avoiding a SportVision-specific integration.

## What this avoids
A backend-specific analytics fork is unnecessary. External tracking engines can be normalized before entering CAY's existing roster binding, persistent identity, coverage, trajectories, heatmaps and metric guards.

Estimated avoided work: **0.5–1 day per additional tracking backend** compared with rebuilding downstream analytics around each backend's native structures.

## Expected impact
No accuracy claim is made from this audit alone. Expected impact is lower integration time and fewer divergent metric implementations. Any future runtime/model promotion still requires real-video benchmark evidence plus separate license/provenance review for detector weights and transitive model assets.

## Risks
- Apache-2.0 for the repository does not automatically establish the license of third-party detector weights used by a deployment.
- `supervision`, detector frameworks and model weights must each be audited at the exact version/artifact before direct dependency adoption.
- Team assignment based only on appearance/color is not accepted as sufficient C.A. Yenne identity evidence in CAY-STABLE.
