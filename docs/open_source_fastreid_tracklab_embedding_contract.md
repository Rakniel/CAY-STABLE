# External ReID embedding contract — FastReID / TrackLab

## Sources audited

### FastReID
- Project: `JDAI-CV/fast-reid`
- Repository: https://github.com/JDAI-CV/fast-reid
- License: Apache-2.0
- Upstream revision audited: `c9bc3ceb2f7a6438b62fb515ea3df6d1e999e95d`
- Upstream role: mature person ReID toolbox and design reference for appearance embeddings.

### TrackLab
- Project: `TrackingLaboratory/tracklab`
- Repository: https://github.com/TrackingLaboratory/tracklab
- License: MIT
- Repository status audited 2026-09-08; source remains an optional external/native backend candidate, not a browser dependency.
- Upstream role: modular tracking/ReID producer capable of exporting per-detection appearance features.

## CAY-STABLE adaptation

No FastReID or TrackLab source code, Python package, model, dataset or model weights are copied into CAY-STABLE by this change.

The existing `motchallenge_tracking_artifact_adapter_v1.js` already accepts external `feature`/`embedding` vectors. This change hardens that existing extension point instead of adding a second ReID pipeline:

- valid external embeddings are L2-normalized by default before entering `tracking_core_v1.js`;
- one artifact uses one explicit embedding dimension; inconsistent dimensions are rejected;
- zero vectors, NaN/Infinity and malformed vectors are rejected rather than silently accepted;
- normalization can be explicitly disabled for a producer whose feature contract requires passthrough;
- the artifact reports embedding policy, observed dimension, accepted embedding rows and rejected feature rows;
- existing tracking identity logic, gallery accumulation, ambiguity margin and archived-track ReID remain unchanged.

For unit-normalized vectors, Euclidean distance is monotonic with cosine distance, so CAY can continue using its existing distance implementation while accepting the common cosine-oriented ReID embedding convention without duplicating identity association logic.

## Legal / model boundary

Repository license does **not** automatically license every pretrained checkpoint. Any real FastReID, TrackLab, OSNet or other ReID weights used by a future producer must carry their own source, license and revision/hash and must pass the existing permissive-weight provenance policy in the MOT artifact adapter.

GPL/AGPL code or weights with incompatible/unknown terms remain rejected from this path unless CAY-STABLE deliberately changes its distribution policy.

## Expected impact

This removes per-backend embedding normalization/dimension plumbing for future TrackLab/FastReID/OSNet/native producers, while making identity evidence more stable across producers whose raw embedding magnitude differs. Expected engineering work avoided: roughly 0.5–1 day per ReID backend. No accuracy percentage is claimed until representative C.A. Yenne footage is benchmarked before/after.

## Validation

`tests/mot_reid_embedding_normalization_nonregression.js` verifies:
- deterministic L2 normalization;
- scale-invariance of equivalent embeddings;
- dimension mismatch rejection;
- zero-vector rejection;
- explicit passthrough compatibility.
