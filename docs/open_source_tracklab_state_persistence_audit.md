# TrackLab state persistence audit

## Source
- Project: `TrackingLaboratory/tracklab`
- Upstream repository: https://github.com/TrackingLaboratory/tracklab
- Review date: 2026-08-30
- License: MIT
- Capability inspected: modular pipeline state persistence and reload.

## Useful upstream design
TrackLab can persist a tracker state that aggregates outputs such as bounding boxes, ReID embeddings, jersey numbers, roles and teams, then reload that state so later pipeline stages do not need to recompute all earlier work.

This is directly relevant to CAY-STABLE because the product requires cumulative learning, persistent player identity, editable manual evidence, and fast iteration on analysis without re-running expensive stages after every UI correction.

## CAY-STABLE adaptation
Retain the architecture, not the implementation:
1. store stage outputs as explicit versioned analysis artifacts;
2. keep detector/tracker evidence separate from manual identity decisions;
3. allow later stages such as heatmaps, distance or event analysis to reuse validated earlier artifacts;
4. invalidate only dependent stages when a player identity, calibration segment or exclusion frame is edited;
5. preserve provenance, confidence and coverage with every artifact;
6. never deserialize opaque executable state from untrusted input.

Suggested CAY artifact layers:
- `detections_v1`
- `tracking_v1`
- `identity_evidence_v1`
- `manual_identity_overrides_v1`
- `metric_projection_v1`
- `player_metrics_v1`
- `ball_events_v1`

Each layer should carry an input fingerprint/version so stale downstream results can be rejected instead of silently mixed with newer evidence.

## What this replaces / work avoided
This avoids designing a monolithic "rerun everything" analysis workflow and gives CAY-STABLE a clean path to incremental recomputation.

Estimated work avoided: **0.5–1 day** of pipeline/state-contract design and failure-case discovery.

Expected measurable impact once implemented:
- faster re-analysis after manual identity or calibration edits;
- less unnecessary detector/tracker recomputation;
- clearer auditability of which evidence produced a published statistic;
- easier cumulative learning without coupling the UI to one heavy Python backend.

## License decision
**Studied / architecture retained / no direct runtime dependency added.**

TrackLab is MIT and legally permissive for reuse, but its full Python/PyTorch stack is heavier than the current browser-first CAY-STABLE runtime. Direct adoption remains optional and must be justified by measured tracking/ReID gains on representative club footage.

No TrackLab source code, model weights or datasets are copied by this audit.

## Risks / dependencies
- Serialized state formats must be versioned and treated as data, not executable objects.
- ReID/model checkpoints require their own license audit; TrackLab's MIT license does not automatically cover third-party weights.
- Persistent state must never bypass CAY's 11-on-field invariant, bench/spectator exclusions, manual merge guards or `INDISPONIBLE` publication policy.
- Any future backend implementation must authenticate artifact ownership rather than trusting client-supplied IDs.

## Promotion criteria
Before implementing the persistence contract in runtime code, add non-regression coverage for:
- unchanged results when a valid upstream artifact is reused;
- selective invalidation after calibration change;
- selective invalidation after manual player merge/split;
- no stale distance/heatmap after tracking input changes;
- no reuse across incompatible schema versions;
- no plaintext credentials or fake authentication backend.

## Provenance
- Source: `TrackingLaboratory/tracklab`
- Function/idea adapted: persisted modular tracker state and pipeline-stage reuse
- License: MIT
- Local modification: clean-room CAY artifact-layer design only
- Runtime dependency added: none
- External code copied: none
- Status: **studied / architecture retained**
