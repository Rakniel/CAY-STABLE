# TrackEval / SoccerNet tracking-evaluation adaptation

- Upstream reference: https://github.com/SoccerNet/sn-trackeval
- License: MIT.
- Upstream scope: standardized multi-object-tracking evaluation, including detection/association quality and MOT metrics.
- CAY-STABLE status: design/evaluation contract adapted; no upstream implementation code copied.
- Local implementation: `tracking_eval_metrics_v1.js`.
- Local test: `tests/tracking_eval_metrics_nonregression.js`.

## What CAY-STABLE reuses conceptually
CAY-STABLE now measures tracker changes on annotated clips with explicit IoU matching and reports precision, recall, detection F1, MOTA-style error rate, mean matched IoU, ID switches, fragments and an identity-continuity indicator. `compareTracking()` returns before/after deltas so ByteTrack/GMC/ReID changes can be accepted only when they improve representative football clips rather than merely looking better.

## Modifications / differences from upstream
The CAY module is a small browser/Node-compatible evaluator written specifically for the existing CAY data contracts. It does not implement the full TrackEval/HOTA stack, does not import Python, NumPy or SciPy, and does not claim exact HOTA/IDF1 equivalence. Matching is deliberately lightweight and deterministic for regression tests and short manually annotated club clips.

## Safety / product impact
This is an evaluation-only component: it does not create, merge or rename player IDs and it cannot alter runtime tracking. Empty ground truth returns `INDISPONIBLE`. The purpose is to quantify false positives, missed players, ID switches and fragmentation before committing future tracker changes.

## Expected time saved
Roughly 0.5-1.5 days versus designing an ad-hoc scoring protocol and repeatedly debating tracker changes by visual inspection only.
