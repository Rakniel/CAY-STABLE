# Open-source audit — SoccerTrack v2

Audit date: 2026-09-25

## Provenance
- Source: https://github.com/AtomScott/SoccerTrack-v2
- Code license: MIT.
- Dataset license: CC BY 4.0.
- Public upstream state inspected: `main`, README reporting 138 commits at audit time.
- Scope: 10 full-length panoramic 4K matches with per-frame GSR truth (2D pitch coordinates, persistent jersey-based player IDs, roles and teams), MOT labels, and 12 ball-action classes.
- No upstream code, video, annotations, model weights or thresholds are copied into CAY-STABLE by this audit.

## Why this is unusually useful for CAY-STABLE
CAY already has separate contracts for tracking identity, metric pitch projection, trajectories/heatmaps and ball-event inference. What is still expensive is obtaining truth that exercises those contracts together. SoccerTrack v2 provides one permissively licensed corpus with persistent identities, metric pitch state and ball-action labels, including multi-view/full-pitch material. This makes it a stronger validation candidate than another end-to-end demo pipeline.

The useful reuse is therefore the benchmark truth and task separation, not a replacement runtime. CAY should keep its browser-first, fail-closed implementation and use an offline adapter only to compare predictions against known truth.

## Proposed CAY benchmark mapping
1. MOT truth -> HOTA/IDF1/ID switches, re-entry continuity and identity persistence.
2. GSR 2D pitch coordinates -> metric position error, trajectory error, heatmap spatial error and coverage-vs-error curves.
3. Roles/teams -> team/referee/goalkeeper confusion and false-CAY checks.
4. BAS labels -> pass/shot/cross/header/etc. event precision/recall and temporal error, but only for event classes CAY explicitly claims to support.
5. Multi-view/full-pitch sequences -> stress calibration changes and identity re-entry without relaxing CAY's segment freshness rules.

## Acceptance policy
A future backend change is not accepted solely for higher availability. Report accuracy and evidence coverage separately. Metric outputs remain `INDISPONIBLE` whenever CAY calibration/evidence gates fail, even if benchmark ground truth exists. The benchmark must never be used as runtime oracle data.

For tracking, compare candidates on identical detections whenever possible so association quality is isolated from detector quality. For geometry, report position error only on frames where CAY itself declares metric evidence available, plus the rejected-frame coverage ratio. For events, report false positives and temporal error in addition to recall.

## License boundary
MIT covers repository code; CC BY 4.0 covers the released dataset. Any CAY benchmark artifact derived from the dataset must preserve required attribution. Dependencies, pretrained weights or third-party assets referenced by upstream remain separately auditable and are not automatically covered by those licenses.

## Expected impact
- Work avoided: roughly 2–5 days versus creating a comparable multi-task truth corpus and evaluation protocol from scratch.
- Measurable impact: enables one consistent before/after gate across identity continuity, metric trajectories/heatmaps and later ball events instead of disconnected toy fixtures.
- Runtime impact: none; intended as offline validation only.
- Status: **studied / benchmark candidate accepted in principle / dataset not yet imported**.
- Main risks: large 4K data volume, Python 3.12+ upstream tooling, attribution obligations for dataset-derived artifacts, and domain gap between panoramic footage and typical C.A. Yenne sideline video.
