# OSS audit — TrackLab tracker-state persistence (2026-09-05)

## Source
- Project: `TrackingLaboratory/tracklab`
- Version/commit inspected: v1.3.24 / `5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2`
- License: MIT (`LICENSE`, blob `42d94683d591a8ca25d7d9d2009fec97922c00a8`)
- Upstream use in SoccerNet Game State Reconstruction: TrackLab tracker states persist detections and tracking information such as bounding boxes, ReID embeddings, jersey numbers and track IDs so expensive tracking stages can be resumed/reused.

## CAY assessment
The tracker-state persistence contract is a useful mature reference for CAY-STABLE's cumulative-learning and persistent-player-tracking roadmap. The reusable design idea is to persist evidence-bearing tracker state separately from presentation/UI state, with stable IDs and provenance that can be reloaded without pretending to have a backend.

## Reuse decision
- Status: **INTEGRE CONCEPTUELLEMENT**.
- No TrackLab code, model, weights, dataset or dependency copied.
- Local implementation: `tracker_state_v1.js` keeps a browser/Node JSON snapshot contract instead of importing the Python/Hydra stack.
- CAY-specific hardening added on 2026-09-05: resume is fail-closed and requires an explicit `teamId` and `videoFingerprint` on both the stored state and the current context. A missing scope can no longer act as a wildcard. Team/video mismatches remain explicit rejections.
- Rationale: persistent identity state must never be silently reused on another team, another video, or an incompletely identified analysis context.

## Tests
`tests/tracker_state_nonregression.js` covers successful same-team/same-video resume, team mismatch, video mismatch, missing current scopes, missing stored scopes, round-trip serialization, duplicate track IDs and forbidden secret fields.

## Expected gain
TrackLab's persistence separation avoided roughly 0.5–1.5 days of designing a tracker-state/replay contract from scratch. The scope-hardening itself is a CAY extension and prevents cross-analysis identity contamination without adding a backend or dependency.

## Dependency and license impact
- Runtime dependency added: none.
- Copied upstream source: none.
- License obligation introduced into distributed CAY code: none beyond documenting the MIT design reference.
