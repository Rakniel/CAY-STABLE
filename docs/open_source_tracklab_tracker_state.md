# TrackLab tracker-state persistence adaptation

- Upstream: https://github.com/TrackingLaboratory/tracklab
- Upstream license: MIT.
- Upstream version reviewed: `1.3.24` (reviewed 2026-08-29; `pyproject.toml` requires Python >= 3.9).
- Upstream behavior studied: TrackLab can persist a tracker state containing tracking outputs such as detections, track IDs, ReID embeddings, jersey numbers, roles and teams, then reload that state to avoid recomputing completed pipeline stages.
- CAY-STABLE status: design principle adapted; no TrackLab source code copied.
- Local implementation: `tracker_state_v1.js`.
- CAY adaptation: small JSON-serializable snapshot contract for player identities, observations, appearance evidence, segment/calibration references and coverage. It deliberately avoids Python/PyTorch and does not create a backend.
- Resume safety: a state may resume only when team and video fingerprint are compatible. It never merges two player IDs automatically.
- Security: password, password hashes, tokens, API keys and secrets are rejected recursively. No clear-text authentication material is persisted.
- Local schema version: `CAY_TRACKER_STATE` v1.0.0.
- Modifications versus upstream: browser/Node compatible; JSON-only; CAY-specific fields; conservative resume policy; no pickle; no executable state; no mandatory external dependency.
- Dependency/license risk: TrackLab 1.3.24 declares `ultralytics` among its runtime dependencies. Ultralytics currently publishes its default code/model licensing under AGPL-3.0 unless an Enterprise license is obtained. Therefore CAY-STABLE must not treat the MIT license of TrackLab as sufficient authorization to import the complete TrackLab dependency stack into a proprietary/non-AGPL build. Any future TrackLab backend must either remove/replace incompatible transitive components, keep them outside the distributed CAY product under a legally reviewed architecture, or use appropriately licensed commercial terms.
- Current legal decision: TrackLab concepts and MIT source may be studied/adapted clean-room; no direct TrackLab runtime dependency is integrated into CAY-STABLE at this stage.
- Test: `tests/tracker_state_nonregression.js` covers round-trip serialization, same-video/team resume, team/video mismatch rejection, duplicate IDs and recursive secret rejection.
- Expected gain: avoids designing a persistence contract from scratch and prepares cumulative analysis/resume without coupling the club UI to a heavy tracking backend.
