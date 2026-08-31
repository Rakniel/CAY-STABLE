# Open-source tracker backend candidates — audit 2026-08-31

This note records newly evaluated tracking/benchmark sources for CAY-STABLE. No upstream implementation code or model weights are copied by this change.

## roboflow/trackers
- Source: https://github.com/roboflow/trackers
- License: Apache-2.0.
- Version inspected: public repository state visible on 2026-08-31; exact revision must be pinned before any dependency installation.
- Useful capability: modular permissive implementations and comparisons of ByteTrack, BoT-SORT, OC-SORT and related MOT algorithms, separated from the detector.
- CAY adaptation: registered as an OPTIONAL/BENCHMARK-ONLY backend candidate in `tracking_backend_candidate_registry_v1.js`. Promotion requires a dependency audit plus a real-video benchmark of at least 300 frames with a strictly lower ID-switch rate than the current CAY tracker.
- What it can replace: bespoke experimental tracker variants and duplicated comparison plumbing. It does **not** replace the current browser-first STABLE tracker until a measurable gain is proven.
- Estimated work avoided if promoted: roughly 0.5–1.5 development days for implementing/maintaining extra MOT variants and comparison interfaces.
- Expected measurable impact: lower ID-switch rate on representative football footage, especially for occlusions/camera motion, if one of the upstream algorithms outperforms the current local two-stage tracker.
- Status: studied + candidate gate integrated; upstream runtime not integrated.
- Risks/dependencies: Python-oriented stack; transitive dependencies need their own audit; hardware/runtime cost can conflict with the simple club deployment target.

## AtomScott/SportsLabKit
- Source: https://github.com/AtomScott/SportsLabKit
- License: GPL-3.0.
- Useful capability: sports-specific tracking/calibration architecture and unified trajectory data representation.
- CAY decision: architecture/benchmark reference only. GPL implementation code is not copied or linked into the current CAY-STABLE runtime.
- What it replaces: nothing in production; it is retained only as a research reference.
- Status: rejected as a runtime dependency under the current permissive-integration policy.
- Risk: GPL distribution obligations are intentionally not introduced into CAY-STABLE.

## AtomScott/SoccerTrack-v2
- Source: https://github.com/AtomScott/SoccerTrack-v2
- Licenses declared upstream: MIT for repository code; CC BY 4.0 for the dataset/annotations.
- Useful capability: full-pitch multi-view soccer benchmark with persistent player IDs, pitch coordinates and ball-action labels.
- CAY adaptation: registered as a benchmark-data candidate only. It can later validate tracking persistence, metric trajectories and event contracts without importing a runtime tracker.
- What it can replace: part of the custom synthetic-only evaluation effort by adding a sport-specific external benchmark format/data source.
- Estimated work avoided if adopted for evaluation: roughly 0.5–1 day of building equivalent benchmark annotations/format tooling from scratch.
- Expected measurable impact: broader tracking/event evaluation coverage and clearer before/after ID-switch/trajectory metrics.
- Status: studied / benchmark candidate.
- Risk: dataset attribution must be retained; broadcast/data-use constraints must be rechecked for the exact downloaded assets before tests are redistributed.

## Integration safety rule added
`tracking_backend_candidate_registry_v1.js` now prevents a tracking backend from becoming eligible merely because it is technically attractive. A runtime candidate must have a permissive license, pass a dependency audit, and (when required) show a real-video tracking gain. `tests/tracking_backend_candidate_registry_nonregression.js` locks the behavior, including the explicit GPL rejection path.
