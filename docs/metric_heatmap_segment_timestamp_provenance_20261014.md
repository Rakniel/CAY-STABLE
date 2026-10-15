# 2026-10-14 — Metric heatmap segment and timestamp guard

- Source: CAY-STABLE internal `metric_pitch_heatmap_v1.js`, original blob `c7fc29b8888fc686ae47663650ce18479731af90`, branch `fix/tracking-completion-evidence-runtime-20261012`.
- License/provenance: internal CAY module; no external code copied or dependency added.
- Changes: explicit nonnegative safe-integer segment ID and nonnegative finite timestamp guards for trajectory and timed occupancy. Existing numeric-string compatibility preserved.
- Replaces: implicit coercion of negative/fractional camera-plan IDs and negative timestamps in pitch heatmaps.
- Local validation: 15 existing test executions (three suites × five runs) plus 35 negative/fractional/unsafe-ID assertions. Invalid publications 6/7 before to 0/7 after. No video benchmark or full CI claim.
- Expected impact: no publication of negative-time/fractional-segment pitch occupancy; fewer misleading first-results metrics.
- Risks: malformed legacy segment IDs become unavailable; metrics need valid timestamp and calibrated segment. Verify complete CI and real club footage before STABLE certification.
