# Calibration confidence range: fail-closed evidence (2026-10-09)

## Defect
Three CAY-STABLE consumers clamped invalid calibration confidence (e.g. 1.5) into the valid [0,1] interval. A bogus 150% confidence could therefore become 100% and unlock pitch heatmaps, trajectories, distance, or speed evidence.

## Change
- `metric_pitch_heatmap_v1.js`: out-of-range confidence is unknown; metric heatmaps and trajectories remain INDISPONIBLE.
- `player_stats_v1.js`: metric projector eligibility rejects out-of-range confidence.
- `metric_quality_guard_v1.js`: reuse `Stats.projectorInfo` rather than overriding it with duplicate clamping; strict fallback when Stats is absent.
- `tests/metric_calibration_confidence_range_nonregression.js`: six invalid inputs, four valid controls, and publication veto assertions.

## Provenance and licenses
Source: CAY-STABLE internal code at `main` commit `242d038595de039bccdca3a9412a136b6fca32f0`; modification is original CAY code. External code copied: none. New dependencies: none. Existing third-party licenses and model-weight boundaries are unchanged; see `OPEN_SOURCE_COMPONENTS.md`.

## Validation
Before commit: isolated JS module harness, 8 existing suites repeated three times (24/24), 1,188 assertions including new targeted checks; six invalid confidence inputs caused 11 false acceptances across three public projector-info consumers before, zero after. Four valid controls preserved. Syntax parsed for all three modified modules. These synthetic tests do not replace Node.js CI or real-match video validation. Merge only after GitHub Actions and representative video checks.
