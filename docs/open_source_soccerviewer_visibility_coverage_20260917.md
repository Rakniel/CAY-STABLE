# OSS audit — soccerviewer visibility / extrapolation semantics

Date: 2026-09-17

## Provenance
- Project: `andrewRowlinson/soccerviewer`
- Source: https://github.com/andrewRowlinson/soccerviewer
- Audited branch: `main`
- License: MIT, verified from the repository root `LICENSE` on 2026-09-17.
- Code imported into CAY-STABLE: none.

## Useful upstream behavior
`soccerviewer` distinguishes raw tracked coordinates from corrected/display coordinates and makes camera visibility explicit. Its README states that the pitch region outside the broadcast camera is shaded, positions in that region are extrapolated guesses and are marked as such. It also skips broadcast cut-away gaps instead of pretending that tracking exists there.

This is a useful product/contract pattern for CAY-STABLE because CAY already requires explicit coverage and defensible statistics.

## CAY-STABLE adaptation
Do not create another tracking pipeline. Extend the existing canonical evidence/publication path so every player position consumed by trajectories, heatmaps and later distance/speed carries an observation provenance state:

- `OBSERVED_VALIDATED`: directly supported by accepted player tracking + valid segment calibration.
- `INTERPOLATED_DISPLAY_ONLY`: short interpolation allowed only for visual continuity; never contributes metres, speed, sprint, possession or event evidence.
- `EXTRAPOLATED_DISPLAY_ONLY`: prediction outside direct observation; visual aid only and visibly distinguishable.
- `UNOBSERVED`: camera/cut/gap/invalid calibration means no defensible position.

Hard requirements:
1. Metric trajectory/heatmap/stat consumers accept only `OBSERVED_VALIDATED` samples unless a future metric explicitly documents and validates another policy.
2. Cut-away gaps and segment changes create hard discontinuities; no trajectory segment or metric delta bridges them.
3. Coverage denominator/numerator must be reportable independently from display interpolation.
4. UI may render display-only estimates, but must visually distinguish them and never present them as measured player positions.
5. `INDISPONIBLE` remains authoritative whenever validated observed coverage is below the metric threshold.

## What this replaces / avoids
This avoids letting each future renderer or metric invent its own meaning of interpolation, extrapolation and camera visibility. It extends the existing canonical metric-evidence model rather than duplicating trajectory/heatmap logic.

## Expected measurable impact
- Target: 0 metric samples sourced from display-only interpolation/extrapolation.
- Target: 0 metric trajectory segments bridging cut-away or invalid-calibration gaps.
- Target: exact parity between reported metric coverage and count/duration of accepted `OBSERVED_VALIDATED` evidence.
- Expected work avoided: roughly 0.5–1 day of later reconciliation/debug across trajectories, heatmaps and distance/speed.

## Status
Studied / contract pattern adapted / runtime code not imported.

## Risks / dependencies
- MIT code license does not grant rights to third-party tracking datasets or assets; those remain separately licensed.
- Upstream corrections such as snapping the ball to a possessor are not adopted as measurement evidence. CAY ball association must remain evidence-driven and independently validated.
- Interpolation thresholds must eventually be benchmarked on representative C.A. Yenne footage; no accuracy gain is claimed from this documentation alone.
