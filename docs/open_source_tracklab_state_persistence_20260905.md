# OSS audit — TrackLab tracker-state persistence (2026-09-05)

## Source
- Project: `TrackingLaboratory/tracklab`
- Version/commit inspected: v1.3.24 / `5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2`
- License: MIT (`LICENSE`, blob `42d94683d591a8ca25d7d9d2009fec97922c00a8`)
- Upstream use in SoccerNet Game State Reconstruction: TrackLab tracker states persist detections and tracking information such as bounding boxes, ReID embeddings, jersey numbers and track IDs so expensive tracking stages can be resumed/reused.

## CAY assessment
The tracker-state persistence contract is a useful mature reference for CAY-STABLE's cumulative-learning and persistent-player-tracking roadmap. The important reusable design idea is to persist evidence-bearing tracker state separately from presentation/UI state, with stable IDs and provenance that can be reloaded without pretending to have a backend.

## Reuse decision
- Status: **ETUDIE / NON INTEGRE dans cette passe**.
- No TrackLab code, model, weights, dataset or dependency copied.
- Reason: TrackLab is Python/Hydra-oriented while the current CAY STABLE runtime is browser/JavaScript; importing the framework would add a large runtime boundary for no immediate gain on the testable build.
- Planned adaptation: keep the existing CAY JS tracking state and later define a serialized, versioned tracker-state contract inspired by the separation used by TrackLab.

## Expected gain
If/when persistent analysis sessions are wired, this reference should avoid roughly 0.5–1.5 days of inventing a persistence schema and replay/resume semantics from scratch.

## Current ball/possession change
This pass does **not** derive possession logic from TrackLab. The possession evidence guard added in CAY is a local fail-closed extension: global ball observability no longer automatically makes possession publishable when stable owner-attributed time is too sparse.
