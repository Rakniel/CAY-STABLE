# OSS audit — SoccerNet/sn-calibration

Date: 2026-09-17
Source: https://github.com/SoccerNet/sn-calibration
Observed default branch: `main`

## Why it matters to CAY-STABLE

The project is a mature football-specific camera-calibration benchmark and documents a useful reference pipeline: semantic pitch-element/extremity detection, homography estimation from pitch correspondences, camera-parameter decomposition, reprojection evaluation, and improvement paths using masks, RANSAC, lines and ellipses.

This is directly relevant to CAY-STABLE's existing `automatic_pitch_calibration_v1.js`, calibration candidate/benchmark contracts and multi-plan metric-validity gates. It provides a strong independent benchmark vocabulary for calibration quality without requiring CAY to invent football-specific evaluation concepts.

## License audit

GitHub repository metadata reports `license: null`. Inspection of the repository root on 2026-09-17 found no `LICENSE`, `LICENSE.md`, `COPYING`, or equivalent explicit software-license file.

**Decision: NO CODE REUSE.** CAY-STABLE must not copy, vendor, translate, port, or derive implementation code from this repository unless an explicit compatible license is later published and independently verified. Model weights and SoccerNet datasets are also separate artifacts and must never be assumed to inherit a software license.

## Safe adaptation: ideas / benchmark contracts only

CAY may independently implement or extend its own calibration logic around these non-code concepts:

- semantic pitch-line / landmark evidence;
- robust homography estimation with outlier rejection;
- reprojection residual as a calibration quality signal;
- completeness / valid-coverage reporting separate from geometric accuracy;
- optional line/ellipse refinement after a candidate homography;
- strict invalidation at camera cuts / plan changes.

These ideas must extend the existing CAY calibration contracts rather than introduce a duplicate calibration pipeline.

## CAY acceptance gates

Any future backend inspired by this benchmark must be measured on C.A. Yenne footage and must not publish upstream benchmark numbers as CAY accuracy. Required comparisons include:

1. valid metric coverage before/after;
2. median and p95 reprojection residual on trusted anchors;
3. false-metre drift on stationary/reference points;
4. recovery latency after a plan change;
5. zero projected metric samples across a rejected calibration or cut;
6. runtime cost versus the current CAY baseline.

If geometric evidence is insufficient, downstream distance/speed/heatmap metric samples remain `INDISPONIBLE`.

## Expected acceleration

Estimated work avoided: 0.5–1 day of calibration-evaluation design by reusing the benchmark *concepts* and terminology while retaining CAY's existing implementation and stricter publication gates.

## Status

- Project/source: SoccerNet/sn-calibration
- Function/idea adapted: football-specific calibration evaluation and refinement strategy
- License: **not explicitly granted / GitHub metadata `null`**
- Replaces: bespoke calibration-evaluation design work, not runtime code
- Expected impact: better calibration gating and more defensible metric coverage
- Status: **studied; ideas adapted; code rejected**
- Risks/dependencies: no software license; weights/data rights separate; broadcast-to-amateur domain shift
- Runtime dependencies added: none
- External code copied: none
