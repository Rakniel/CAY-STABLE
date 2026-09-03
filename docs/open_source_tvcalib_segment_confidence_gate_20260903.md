# TVCalib-inspired per-segment calibration confidence gate — 2026-09-03

## Source audited

- Project: **TVCalib — Camera Calibration for Sports Field Registration in Soccer**
- Upstream: `MM4SPA/tvcalib`
- Revision inspected: `1222c5230af2742395d74918ed6f34eb2b9bf7f9`
- License: **MIT** (SPDX `MIT` as reported by the upstream GitHub repository)
- Relevant mature idea: calibration is evaluated/self-verified before its geometry is trusted; TVCalib exposes explicit self-verification/evaluation workflows for soccer field registration.

## CAY-STABLE adaptation

No TVCalib source code, model weights, training data, or runtime dependency is copied or vendored.

CAY-STABLE already had a global fail-closed calibration-confidence policy for pitch heatmaps and trajectories. The remaining multi-plan weakness was that confidence was averaged across all projected observations. A strong segment (for example 0.90) and a weak segment (0.10) could therefore average to the publication threshold (0.50), allowing weak-segment coordinates into a metric trajectory.

The adaptation extends the existing `metric_pitch_heatmap_v1.js` projection gate instead of introducing a parallel metric pipeline:

- every segment projector with an explicit confidence below `minCalibrationConfidence` is rejected before its point reaches pitch-metric cells or trajectory runs;
- the rejected observation remains in the eligible denominator, so coverage decreases instead of disappearing;
- unknown confidence remains fail-closed through the existing complete-confidence guard;
- accepted segments still use the existing coverage + average-confidence publication gate;
- no image-coordinate fallback is introduced.

## Before / after regression case

Fixture: four structurally valid observations, two on a 0.90-confidence segment and two on a 0.10-confidence segment, `minCalibrationConfidence=0.50`.

Before:
- 4/4 observations could be projected;
- average confidence = 0.50;
- the 0.10-confidence segment could be present in the published trajectory.

After:
- 2/4 observations are accepted;
- 2/4 are explicitly rejected by the existing projection path;
- metric coverage = 0.50;
- accepted average confidence = 0.90;
- trajectory contains only the trustworthy segment;
- if `minMetricCoverage` is raised above 0.50, the heatmap becomes `INDISPONIBLE`.

## Time saved / impact

Estimated work avoided by adapting the established self-verification principle instead of designing a second confidence system: **0.25–0.5 day**.

Expected measurable impact on real multi-plan C.A. Yenne footage: fewer low-quality calibration segments contaminating heatmaps, trajectories and the downstream distance/speed chain. The trade-off is deliberately lower metric coverage when a segment is weak; this is preferable to publishing physically misleading positions.

## Status and risks

- Status: **integrated on validation branch; merge only after CAY non-regression/syntax/integration checks pass**.
- New runtime dependencies: **none**.
- License dependency added to CAY runtime: **none**.
- Code copied from upstream: **none**.
- Risk: an overly conservative threshold may discard usable points. Mitigation: threshold stays configurable and rejected observations remain visible through reduced coverage, allowing tuning on real C.A. Yenne video without inventing data.
