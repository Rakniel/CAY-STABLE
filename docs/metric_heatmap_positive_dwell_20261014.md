# Heatmap metric publication requires validated positive dwell (2026-10-14)

- Source/provenance: CAY-STABLE internal `metric_pitch_heatmap_v1.js`, original Git blob `25904d1c77d6eb1017f85e7898bd4b2d4d473116`, PR #456 validation branch.
- License: no third-party source or dependency introduced. Existing CAY motion-plausibility module reused unchanged.
- Modification: even when `minTemporalCoverage: 0`, `DISPONIBLE` requires `projectedIntervalSeconds > 0`; a zero-dwell rejection has a specific French reason. The usual positive threshold and confidence checks remain unchanged.
- Replaces: permissive zero-duration heatmap publication after a camera cut, unobserved gap, or implausible movement. No new heatmap or geometry engine.
- Measured on targeted synthetic inputs: 3/3 invalid cases were incorrectly available before; 0/3 after. A valid 0.5-second interval remains available. 25 existing-suite executions (1,215 assertions) and the new test (100 assertions) passed in an isolated JavaScript evaluator, not Node CI or browser.
- Expected impact: fewer unsupported heatmaps and no pitch-coordinate export on zero validated dwell. Time avoided: a few hours versus separate temporal validator, estimate not benchmarked.
- Status: integrated on validation branch only, pending full Node CI, browser checks and real club footage.
- Risks: callers explicitly setting a zero temporal threshold will now receive `INDISPONIBLE` until a continuous physically plausible metric interval exists; no change to roster capacity or the 11 simultaneous players rule.
