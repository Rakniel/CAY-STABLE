# Open-source audit — usamahanif349/Sports-vision-tracker

Date: 2026-09-27

## Source and revision

- Repository: https://github.com/usamahanif349/Sports-vision-tracker
- Audited revision: `0a42579721a61b650f3a50d4d7a3b19571f48bd7`
- Upstream repository metadata reports no declared license (`license: null`).
- Upstream currently has only two commits and no release/tag maturity signal.

## Useful ideas observed

The project separates detection/tracking, team classification, analytics and visualization. Its CLI also exposes diagnostic-oriented configuration and reports frames processed, ball detection rate and closest ball-to-player distances after a run. The README explicitly distinguishes pixel speed from calibrated physical speed and warns that physical units require calibration.

These are useful product/diagnostic references for CAY-STABLE, especially the idea of surfacing evidence diagnostics next to a metric rather than silently producing a number.

## License decision

**REJECTED for code/runtime reuse.** No source file, algorithm implementation, configuration block or model asset from this repository may be copied, adapted, vendored or imported into CAY-STABLE while the upstream project has no explicit reusable license.

The repository also depends on Ultralytics YOLOv8, whose licensing must be evaluated independently; an upstream repository's eventual license would not automatically relicense that dependency, model weights or datasets.

## CAY-STABLE mapping

No runtime replacement is needed. CAY-STABLE already has stronger evidence-aware components including `metric_publication_guard_v1.js`, `metric_quality_guard_v1.js`, `roster_metric_pipeline_v1.js`, `metric_pitch_heatmap_v1.js`, ball evidence guards and explicit `INDISPONIBLE` publication behavior.

The only retained idea is architectural/product-level: expose concise per-run diagnostics for metric evidence and ball evidence so educators can understand why a result is available or unavailable. This is an independently described idea, not copied code.

## Estimated impact

- Code reused: none.
- Work avoided: approximately 0.25–0.5 day of product/diagnostic design by confirming a compact diagnostics pattern.
- Expected impact: faster troubleshooting of calibration/ball evidence and fewer misleading physical metrics.
- Status: **studied / runtime rejected / diagnostic concept retained**.
- Risk: upstream has no license and very low maturity; do not promote it to a dependency without a future license and maturity re-audit.
