# Open-source provenance — auto-first analysis stage independence

## Upstream reference

- Project: `rafaelsouza-tech/soccer-tactical-vision`
- Audited revision: `4c557534c624948f3bfe3db956859c7ea3b442fa`
- License: MIT
- Upstream role studied: staged football-video pipeline with explicit detector / team / calibration / projection / render responsibilities and validation boundaries.

## CAY-STABLE adaptation

CAY-STABLE already owns separate detection, tracking, identity, metric-projection and reporting modules. This change does **not** copy upstream Python code, models, weights or SoccerNet data. It adapts the architectural principle that calibration is one stage of the pipeline and that a missing/failed metric projection must not prevent independent tracking or non-metric results from running.

The existing `validated_report_bridge_v1.js` already preserves presence, identity and per-segment image-space trajectories when metric projection is unavailable. The UI/orchestration was inconsistent with that contract because it required exactly three manual calibration references before exposing the analysis action.

Local changes:

- expose `ANALYSER / VALIDER LE MATCH` after scene scanning even with zero manual calibration references;
- describe automatic calibration as the primary path and manual calibration as a fallback/correction;
- change the logically inconsistent validation rule from `exactly 3` to `0..3` for a label that already meant `3 maximum`;
- preserve strict metric publication: absence of a validated calibration can still make distance/speed/heatmap metric outputs `INDISPONIBLE`; it no longer prevents tracking/result stages from executing.

## Why this is legally safe

- no upstream source copied;
- no upstream runtime dependency added;
- no external model or dataset incorporated;
- only an MIT-licensed architectural idea is adapted clean-room to existing CAY code.

## Estimated gain / impact

- Work avoided: roughly 0.5 day of redesigning a second orchestration layer.
- Measurable UX change: manual references required before the primary analysis button goes from `3` to `0`.
- Expected product impact: coaches can proceed video → team → analysis without a mandatory three-image calibration workflow; manual calibration remains available when automatic pitch geometry is insufficient.
- Risk: automatic calibration quality still depends on available field correspondences. Physical metrics remain guarded and may be `INDISPONIBLE` when calibration evidence is insufficient.
