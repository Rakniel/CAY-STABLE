# First-results coverage audit integrity — 2026-10-09

## Existing CAY logic extended
- Runtime module: `first_results_testability_gate_v1.js` (already loaded by the canonical STABLE integrator).
- Before: percentages outside 0–100 were silently clamped to 0 or 100, and negative participation/render durations could leak into player diagnostics.
- After: invalid/blank/non-finite/non-numeric percentages and negative durations are reported as `null` (unknown); direct calls to `summarizeCoverage` apply the same percentage validation.
- The coverage summary remains audit-only: no readiness promotion or invented minimum coverage threshold.
- Existing legitimate 0–100 percentages, nonnegative durations, roster exclusions and temporal weighting remain unchanged.
- Tests: `first_results_coverage_summary_nonregression.js`, `first_results_testability_gate_nonregression.js`, `first_results_invalid_coverage_evidence_nonregression.js`, plus existing temporal/roster suites.

## OSS reuse comparison (no imported code)
- Roboflow Trackers 2.6.1, https://github.com/roboflow/trackers, Apache-2.0. Candidate offline Python ByteTrack/BoT-SORT/McByte benchmark (SoccerNet/SportsMOT). Status **studied**, not imported; replaces future custom benchmark harness rather than CAY's browser tracker. Estimated avoided work: 1–3 engineering days, not measured. Risks: Python runtime, model/weight licenses, CPU/GPU, McByte optional torch/SAM/Cutie dependencies. Source version must be pinned and each model audited before integration.
- OpenCV 4.5.0+, https://github.com/opencv/opencv, Apache-2.0. Candidate for homography and camera motion in a separate optional producer. Status **studied**, not imported; avoids a custom robust homography solver. Risks: native/WASM runtime cost, calibration-point quality and model validation.
- No external code, weights, datasets or assets copied; no added runtime dependency or modifications to external components.

## Validation boundary
Synthetic JavaScript tests verify integrity only. GitHub CI, canonical HTML integration and representative C.A. Yenne videos remain mandatory before STABLE promotion.
