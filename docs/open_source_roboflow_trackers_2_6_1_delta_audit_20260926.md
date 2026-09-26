# Roboflow Trackers 2.6.1 delta audit — 2026-09-26

## Provenance

- Project: `roboflow/trackers`
- Upstream: https://github.com/roboflow/trackers
- Release audited: `2.6.1`, published 2026-09-25
- License: Apache-2.0, verified from upstream `LICENSE`
- CAY status: **benchmark/backend candidate only; no upstream source, wheel, model, weight or dataset imported in this change**.

## Why this delta matters to CAY-STABLE

CAY already has a detector-neutral MOT benchmark boundary, conservative identity/re-entry metrics, camera-motion evidence contracts and a promotion gate. Reimplementing another tracker in JavaScript would duplicate logic. The permissive Trackers project remains the preferred external bake-off candidate for ByteTrack/BoT-SORT-family experiments.

Release 2.6.1 is materially safer than the previously audited moving `develop` snapshot for a reproducible bake-off because it is a tagged release and fixes several evaluation/runtime edge cases:

1. OC-SORT now returns low-confidence supplied detections with `tracker_id=-1` instead of silently dropping them. CAY adapters must explicitly ignore `tracker_id=-1` for persistent identity while preserving detector coverage accounting.
2. Integer-input box conversion now preserves fractional coordinates. This avoids avoidable quantization in MOT interchange and IoU comparisons.
3. Numbered image inputs are read in temporal order (`2.jpg` before `10.jpg`), important for deterministic sequence evaluation.
4. Malformed/inverted boxes can no longer receive a spurious positive GIoU bonus.
5. BoT-SORT/McByte Kalman noise refresh behavior received a maintenance fix.

These fixes reduce benchmark plumbing risk and make `2.6.1` a better pinned candidate than an untagged development head.

## License / dependency boundary

Apache-2.0 covers the Trackers repository code. It does **not** automatically cover optional detector stacks, inference models, ReID weights, datasets or arbitrary downloaded assets. The 2.6.1 release raises the optional `trackers[detection]` dependency floor to `inference-models>=0.36.0`; that optional extra is not approved as a CAY runtime dependency by this audit.

For CAY experiments, prefer the detector-agnostic tracker path fed by existing CAY detection artifacts. Any future ReID model, detector package or dataset must retain a separate provenance/license record.

## CAY adapter contract before any runtime promotion

A 2.6.1 experiment must:

- pin the exact release/hash and record environment versions;
- feed the exact same detector artifact, frame set and timestamps to baseline and candidate;
- treat `tracker_id=-1` as untracked detection, never as a player identity;
- export through the existing MOT/TrackEval boundary rather than inventing a second evaluator;
- preserve CAY-specific gates: zero false CAY from yellow details, bench/spectator exclusion, <=11 simultaneous on-field CAY players, explicit cut/multi-plan boundaries, re-entry accounting and fail-closed coverage;
- reject promotion if generic HOTA/IDF1 improves while unsafe cross-segment identity carryover or any protected CAY invariant regresses.

## Expected gain

Estimated work avoided: **3–7 engineering days** versus implementing/maintaining another full MOT backend and its evaluation plumbing. Expected measurable impact is not claimed until identical-input C.A. Yenne/SoccerNet/SportsMOT-style bake-offs are run.

## Decision

**Studied / accepted as the preferred pinned external tracker bake-off candidate at version 2.6.1 / not integrated into STABLE runtime yet.**

Risk remains moderate around Python/native dependency weight and separately licensed optional assets. Browser-first STABLE remains unchanged until the external backend proves a measurable identity benefit without weakening club-specific safety rules.
