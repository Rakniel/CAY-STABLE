# Metric visuals runtime integration — provenance and reuse

Date: 2026-09-01

## Open-source provenance
- Primary design source already audited by CAY-STABLE: **mplsoccer** — https://github.com/andrewRowlinson/mplsoccer
- License: **MIT**.
- Reused idea: football-pitch coordinate visualisation and heatmap semantics after conversion into a stable pitch coordinate system.
- Upstream code copied: **none**.
- Local implementation reused: `metric_pitch_heatmap_v1.js`, previously implemented in clean-room JavaScript and already covered by licence/provenance documentation.

## Integration added in this change
`stable_metric_visuals_runtime_v1.js` extends the existing `CAYStableTrackingBridge.report()` result instead of duplicating tracking, projection, heatmap or trajectory logic.

For every player report it now exposes:
- metric pitch trajectory in metres;
- pitch heatmap only when the existing strict availability gates pass;
- metric coverage;
- temporal coverage;
- average calibration confidence;
- defendable score and quality;
- explicit `INDISPONIBLE` state when calibration/coverage is insufficient.

The runtime never falls back to image coordinates for a pitch heatmap. Image-space visualisations remain separate from metric pitch visualisations.

## What this replaces
Before this integration, the metric heatmap/trajectory engine existed but was not wired into the canonical STABLE tracking report path. A separate UI-side recomputation would have duplicated the logic and risked inconsistent coverage/availability decisions.

Estimated avoided work: **0.5–1 day** of duplicate report/UI plumbing plus future maintenance of two metric-visualisation paths.

## Expected measurable impact
- First testable results can consume one canonical report object for player cards, trajectory and heatmap.
- No new Python/GPU/native dependency.
- No change to the 11-player invariant or membership guards.
- No physical metric becomes available unless the existing validated projector and coverage thresholds permit it.

## Risks
- Accuracy still depends on representative real-video calibration and tracking quality.
- Rendering of the returned grid/trajectory in the final C.A. Yenne UI remains a presentation-layer task; this change makes the validated data available to it without inventing data.
