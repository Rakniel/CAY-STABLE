# TrackLab tracker-state persistence adaptation

- Upstream: https://github.com/TrackingLaboratory/tracklab
- Upstream license: MIT.
- Upstream behavior studied: TrackLab can persist a tracker state containing tracking outputs such as detections, track IDs, ReID embeddings, jersey numbers, roles and teams, then reload that state to avoid recomputing completed pipeline stages.
- CAY-STABLE status: design principle adapted; no TrackLab source code copied.
- Local implementation: `tracker_state_v1.js`.
- CAY adaptation: small JSON-serializable snapshot contract for player identities, observations, appearance evidence, segment/calibration references and coverage. It deliberately avoids Python/PyTorch and does not create a backend.
- Resume safety: a state may resume only when team and video fingerprint are compatible. It never merges two player IDs automatically.
- Security: password, password hashes, tokens, API keys and secrets are rejected recursively. No clear-text authentication material is persisted.
- Version: local schema `CAY_TRACKER_STATE` v1.0.0, based on TrackLab behavior reviewed 2026-08-27.
- Modifications versus upstream: browser/Node compatible; JSON-only; CAY-specific fields; conservative resume policy; no pickle; no executable state; no mandatory external dependency.
- Test: `tests/tracker_state_nonregression.js` covers round-trip serialization, same-video/team resume, team/video mismatch rejection, duplicate IDs and recursive secret rejection.
- Expected gain: avoids designing a persistence contract from scratch and prepares cumulative analysis/resume without coupling the club UI to a heavy tracking backend.
