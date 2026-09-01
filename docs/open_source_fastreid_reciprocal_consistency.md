# FastReID reciprocal-consistency adaptation audit

## Source
- Project: JDAI-CV/fast-reid
- Upstream purpose: mature person/instance re-identification toolbox with retrieval/re-ranking support.
- Upstream license: Apache-2.0.
- Repository inspected: https://github.com/JDAI-CV/fast-reid
- Inspection date: 2026-09-01.
- Repository state observed: public, default branch `master`, latest upstream push shown by GitHub metadata as 2024-07-30.

## CAY-STABLE reuse boundary
No FastReID source code, model weights, PyTorch runtime, training configuration or model-zoo artifact is copied or vendored.

CAY-STABLE adapts only the general retrieval-consistency idea: a proposed identity correspondence can optionally be required to be the best match in both directions before it is considered a stronger ReID suggestion. The implementation is original JavaScript built on the existing CAY `reid_evidence_fusion_v1.js` cosine/evidence pipeline.

## Modification
`reid_evidence_fusion_v1.js` now exposes:
- `rank(trackId, candidateIds)` for deterministic evidence ranking,
- `pairScore(leftId, rightId)` for the existing evidence score,
- `reciprocalCheck(trackId, bestId, candidateIds)` for mutual-best evidence,
- optional `suggest(..., {requireReciprocalMatch:true})` guarding.

Legacy `suggest(trackId, candidateIds)` behavior is preserved. The guard never auto-merges identities: all positive results remain `A_VERIFIER` and retain `NEVER_AUTO_MERGE`.

## What this replaces
This avoids building a separate ReID re-ranking service or importing the FastReID/PyTorch stack only to obtain a reciprocal-candidate consistency check.

Estimated engineering avoided: 0.25-0.5 day of separate ranking/plumbing plus an additional heavy runtime dependency chain.

## Expected impact
- Reduce ambiguous cross-occlusion / cross-segment identity proposals where A prefers B but B more strongly prefers C.
- Preserve existing temporal-diversity, team and sample-quality evidence gates.
- No claimed real-video accuracy gain until evaluated with CAY identity episodes / LTPI-style benchmarks.

## Risks / dependencies
- Reciprocal consistency is not proof of identity and must not trigger automatic merging.
- Candidate-set composition affects reciprocity; incomplete candidate galleries can create apparent reciprocity.
- Generic person-ReID models may underperform on football broadcast footage, small crops, identical kits and long-distance players. Model weights require separate license/provenance review before any future integration.
- LTPI code/dataset restrictions remain separate; this adaptation does not import LTPI assets.

## Status
Rebased on latest `main` after validated camera-motion integration. Promotion to `main` requires the full CAY-STABLE CI and non-regression suite to pass.
