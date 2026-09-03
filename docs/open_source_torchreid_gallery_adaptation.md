# ReID appearance gallery adaptation

## Upstream reference
- Project: `KaiyangZhou/deep-person-reid` (Torchreid / OSNet ecosystem)
- Source: https://github.com/KaiyangZhou/deep-person-reid
- Upstream revision inspected: `f8cd150fdf77e8d9e1ed143b7f308c2c609ded50` (2026-01-09)
- License: MIT. Verified from upstream `LICENSE` before this adaptation.

## What CAY-STABLE adapted
CAY-STABLE keeps several quality-approved appearance observations for each track in a bounded gallery while retaining the existing EMA appearance signature. Archived-player ReID can compare a returning detection against both the EMA and a small quality-weighted set of the closest historical observations. This is a clean local implementation of the mature ReID principle that identity should be supported by multiple appearance observations rather than one crop only.

No Torchreid source code, model weights or training assets are copied into CAY-STABLE. No Python, PyTorch, CUDA or OSNet runtime dependency is introduced.

## Local implementation
- `tracking_core_v1.js`
- `tests/reid_appearance_gallery_nonregression.js`

Defaults:
- accepted observations still require the existing appearance-update confidence gate (`0.50` unless configured);
- gallery is bounded to 12 samples by default;
- at least 3 compatible samples are required before gallery evidence is used;
- three nearest quality-weighted historical samples are combined with the existing EMA distance;
- normal active-frame association remains EMA-based; the gallery is used only for archived-track ReID to limit identity drift risk.

## Replaced behavior
Previously archived-player ReID depended on the single smoothed EMA feature. A player whose recent views differed from an earlier viewpoint could lose a valid identity even though several high-quality earlier observations matched the returning view.

## Safety / risks
- The gallery never creates a CAY identity from low-confidence evidence; rejected low-score observations are not stored.
- Existing category checks, maximum ReID gap, score threshold and uniqueness margin remain mandatory.
- The gallery does not bypass the 11-player invariant, bench/spectator guards, manual roster binding or metric publication rules.
- Risk: visually similar teammates can share close embeddings. Therefore the gallery is deliberately bounded, requires multiple samples, keeps EMA influence, and still uses the existing ambiguity margin before automatic archived-track recovery.
- A future learned OSNet/ONNX extractor must be benchmarked separately on representative C.A. Yenne footage and its model-weight license recorded before adoption.

## Expected gain
Estimated 0.5–1 day of bespoke long-occlusion ReID experimentation avoided. Expected product impact is fewer duplicate global IDs after camera cuts/long occlusions, improving continuity of player cards, trajectories and heatmaps without making unsupported physical metrics available.
