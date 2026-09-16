# Open-source audit — Ayan-OP/Soccer-Analytics camera motion

Date: 2026-09-16
Status: studied; runtime reuse rejected; masking principle already covered by CAY

## Provenance

- Project: https://github.com/Ayan-OP/Soccer-Analytics
- Upstream file reviewed: `camera_movement_estimator/camera_movement_estimator.py`
- Upstream file blob: `a2c1e5bf5ce6299066156aa2c142d829c8ffbbda`
- License: MIT (`LICENSE` blob `93bf2fb51f6ce1d5fa725a235bcbf58ae2eedf04`)
- No upstream code, weights, datasets, media or model artifacts copied into CAY-STABLE.

## Useful idea

The upstream estimator deliberately restricts optical-flow features to narrow image regions intended to contain background/static reference evidence rather than players. That supports CAY's existing design requirement that camera-motion evidence be derived from explicit background support, not foreground player motion.

CAY already implements the stronger form in `camera_motion_background_evidence_guard_v1.js`: every accepted sample must carry `backgroundMaskApplied === true`, a bounded `matchedReferencePointRatio`, an optional reference-age limit, and fail closed when runtime evidence is unavailable. Therefore importing the upstream implementation would duplicate weaker logic.

## Rejected implementation detail

The upstream implementation chooses the single tracked feature with maximum displacement as the camera-motion vector. CAY must not adopt this. One bad LK correspondence, moving spectator, flag, bench element, overlay edge, or foreground leak can dominate the estimate. CAY's consensus/outlier guards and explicit background evidence are safer for metric publication.

## What this replaces / avoids

Nothing in runtime is replaced. The audit avoids a regression that would otherwise simplify GMC by using a single extreme feature. Estimated avoided investigation/debug effort: 0.5 day.

## Measurable CAY acceptance criteria

Any future camera-motion backend must continue to beat the current baseline on the same sequences for:

- median/p95 residual background displacement after compensation;
- false motion on static-camera clips;
- robustness when one reference feature is an outlier;
- spatial support / retained-reference ratio;
- downstream stationary-player false distance and speed spikes;
- zero propagation across cuts/segment changes;
- `INDISPONIBLE` whenever background evidence is insufficient.

## License boundary

MIT permits reuse with preservation of copyright/license notice. This audit intentionally uses only the architectural observation and does not import upstream source. Dependencies and model/data licenses are not inferred from the repository-level MIT license and must be audited separately before any future reuse.
