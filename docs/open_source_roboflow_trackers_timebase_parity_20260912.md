# Roboflow Trackers 2.6.0 — benchmark input/timebase parity adaptation

Date: 2026-09-12

## Upstream provenance

- Project: `roboflow/trackers`
- Source: https://github.com/roboflow/trackers
- Audited release: `2.6.0`
- Audited revision: `0e839f348d8bf4ed09eea9f3bef58fd5f95dca3f`
- Code license: Apache-2.0
- CAY usage in this change: architecture/benchmark-contract adaptation only. No upstream source code, model weights, datasets or media are copied into CAY-STABLE.

## Useful upstream behavior

Roboflow Trackers supports optional capture timestamps on tracker updates. In timestamp mode, elapsed capture time influences Kalman prediction and lost-track pruning. The configured reference frame rate remains semantically relevant. Timestamps must be ordered, and switching between timestamped and non-timestamped updates changes the time anchor behavior.

This means a tracker A/B benchmark is not defensible if baseline and candidate are fed different detector outputs, a different selected frame set, a different timestamp mode, a different capture-timestamp manifest, or a different reference frame rate.

## CAY adaptation

`tracking_candidate_promotion_gate_v1.js` now requires benchmark input parity by default before evaluating HOTA/IDF1/MOTA or labelled identity evidence.

Required comparable inputs:

- identical `detectorArtifactId`;
- identical `frameSetId`;
- identical `timestampMode`;
- identical `referenceFrameRate`;
- when dynamic/capture-time mode is used, identical `timestampSetId`.

Mismatch or missing evidence produces `INSUFFICIENT_EVIDENCE`; it cannot promote a tracker even when the candidate reports better MOT metrics.

## What this replaces

This replaces an implicit assumption that matching sequence names were sufficient to guarantee a fair tracking comparison. The previous gate already required the same C.A. Yenne sequence set; the new logic extends that existing gate rather than introducing a parallel promotion path.

## Expected impact

- Prevents false gains caused by detector-output drift or frame sampling changes.
- Prevents timestamp-aware Roboflow 2.6.0 runs from being compared against fixed-rate runs as though the only changed variable were the tracker.
- Makes ByteTrack vs BoT-SORT/CMC benchmarks reproducible enough for promotion decisions.
- Keeps all current false-CAY and bench/spectator zero-regression rules intact.

## License boundary / risks

Apache-2.0 permits use and adaptation subject to its notice requirements, but this change imports no upstream implementation. Any future Python runtime dependency, ReID model or model weight still requires a separate dependency/weight audit. Roboflow benchmark scores are reference evidence only and do not constitute C.A. Yenne validation.
