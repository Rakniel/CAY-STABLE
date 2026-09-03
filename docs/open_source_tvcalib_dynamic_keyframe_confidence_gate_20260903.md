# TVCalib-inspired dynamic keyframe confidence gate — 2026-09-03

## External reference

- Project: `MM4SPA/tvcalib` — TVCalib: Camera Calibration for Sports Field Registration in Soccer.
- Upstream revision audited previously by CAY-STABLE: `1222c5230af2742395d74918ed6f34eb2b9bf7f9`.
- License: MIT.
- Relevant upstream idea: calibration quality must be self-verified before projected football-field geometry is trusted.
- Code copied into CAY-STABLE: **none**.
- Runtime dependency added: **none**.

## CAY-STABLE adaptation

`metric_segment_registry_v1.js` already supported multiple absolute calibration keyframes for a dynamic camera and interpolated projected points between fresh validated keyframes. A remaining failure mode existed when keyframes had very different calibration confidence: for example `.90` and `.10` produced a segment-level average of `.50`, which could make the low-confidence keyframe participate in a metric interpolation even though it would be unacceptable on its own.

The registry now applies a fail-closed per-keyframe confidence gate aligned with the existing metric publication floor (`0.50`):

- if at least one dynamic calibration keyframe has confidence `>= 0.50`, keyframes below `0.50` are excluded from metric temporal interpolation and nearest-keyframe projection;
- rejected weak keyframes remain visible in source diagnostics and reduce usable temporal coverage rather than being silently rescued by averaging;
- if every available keyframe is weak, the historical diagnostic projector is preserved with its real low confidence so downstream metric gates continue to publish `INDISPONIBLE` rather than losing the reason for rejection;
- no raw homography coefficient interpolation was introduced; CAY-STABLE continues to interpolate only projected pitch points between trustworthy absolute keyframes.

New diagnostics exposed by the temporal projector:

- `sourceKeyframes`
- `keyframes` (eligible keyframes)
- `lowConfidenceKeyframesRejected`
- `minDynamicKeyframeConfidence`

## What this replaces

Previous behavior: dynamic camera confidence could be rescued by averaging strong and weak absolute keyframes.

New behavior: a weak dynamic keyframe cannot contribute to defensible pitch coordinates merely because another strong keyframe raises the average.

## Expected impact

- Prevents deterministic contamination of trajectories/heatmaps and downstream distance/speed/sprint metrics around a weak dynamic-camera calibration refresh.
- Prefers lower explicit metric coverage to geometrically misleading interpolation.
- Estimated engineering work avoided by adapting the mature self-verification principle instead of inventing a separate calibration-quality subsystem: roughly **0.25–0.5 day**.

## Validation

Dedicated non-regression: `tests/dynamic_keyframe_confidence_gate_nonregression.js`.

It covers:

1. `.90 + .10` keyframes: only the `.90` keyframe is metric-eligible;
2. after the trusted keyframe exceeds the freshness window, projection becomes unavailable rather than falling back to the nearby `.10` keyframe;
3. an all-low-confidence sequence remains diagnosable at its true low confidence for downstream fail-closed publication.

## Risks / dependencies

The default `0.50` threshold is deliberately conservative and aligned with the existing CAY metric confidence floor. It can reduce temporal metric coverage when calibration quality oscillates. This is intentional until real C.A. Yenne video benchmarks justify a different threshold. No third-party code, model, dataset or runtime package is introduced by this adaptation.
