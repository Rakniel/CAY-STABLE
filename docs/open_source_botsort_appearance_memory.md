# BoT-SORT appearance-memory adaptation

- Upstream project: `NirAharon/BoT-SORT`
- Source: https://github.com/NirAharon/BoT-SORT
- Upstream revision inspected: `251985436d6712aaf682aaaf5f71edb4987224bd`
- License: MIT (verified from upstream `LICENSE`; copyright Nir Aharon, 2022).
- Upstream function/design studied: per-track appearance feature memory with an exponentially smoothed feature used by BoT-SORT for ReID-aware association.
- CAY-STABLE status: design principle adapted; no upstream source code copied and no external runtime dependency added.

## Local adaptation

`tracking_core_v1.js` previously replaced `track.feature` with the most recent detection feature. That made archived-track ReID depend on a single last crop, so one atypical crop immediately before an occlusion could prevent a valid re-entry from recovering its persistent global ID.

CAY-STABLE now maintains an element-wise exponential moving average of the existing feature representation, preserving the current feature scale and the established CAY distance thresholds rather than importing BoT-SORT's NumPy/FastReID implementation. Default smoothing alpha is `0.90` and is configurable through `appearanceSmoothingAlpha`.

A second guard, `appearanceUpdateMinScore` (default `0.50`), prevents low-confidence detections from changing an already-established identity appearance memory. Those detections can still participate in spatial continuity through the existing tracker policy; they simply cannot poison the ReID memory.

## What it replaces

- Replaces: last-observation-only appearance memory in `tracking_core_v1.js`.
- Does not replace: CAY confidence cascade, manual identity merge guard, reciprocal/margin ReID evidence, segment guards, team evidence or the 11-player limit.
- Does not auto-merge player identities.

## Validation

`tests/tracking_appearance_memory_nonregression.js` creates a deterministic failure case for the previous behavior: a stable feature `[0,0]` is followed by a still-matchable atypical crop `[0.20,0.20]`, then the player disappears and re-enters with `[0,0]`. Last-observation-only memory would be outside the configured `0.10` ReID threshold. The smoothed CAY memory remains within threshold and recovers the original global ID instead of creating a replacement ID.

The test also checks that a low-confidence appearance observation is rejected from the identity memory.

## Expected impact

- Fewer ID breaks after short/medium occlusion or re-entry when the final pre-occlusion crop is blurred, partially turned or atypical.
- More stable player trajectories and heatmaps because fewer physical player paths are split across technical IDs.
- No change to metric publication rules: distance, speed and sprint statistics still require validated pitch projection and coverage.

## Estimated work avoided

Approximately 0.5-1 day of bespoke feature-memory design and edge-case testing by adapting a mature MOT principle instead of designing a new appearance lifecycle from scratch.

## Risks

- An EMA can become too inert if the feature extractor changes appearance distribution strongly during a match; alpha remains configurable and must be benchmarked on representative C.A. Yenne video.
- The local feature vector is not assumed to be a FastReID embedding, so no upstream similarity thresholds are copied.
- This change improves persistence only when meaningful `feature` vectors are supplied by the detector/ReID path; it creates no synthetic identity evidence.
