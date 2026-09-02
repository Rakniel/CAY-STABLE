# TrackEval / CAY-STABLE — same-sequence promotion protocol

## Source
- Project: TrackEval
- Repository: https://github.com/JonathonLuiten/TrackEval
- License: MIT
- Role in CAY-STABLE: external evaluation reference for HOTA / IDF1 / CLEAR MOT metrics and MOTChallenge-style benchmark protocol.
- Code copied: none.
- Runtime dependency added: none.

## Open-source idea reused
TrackEval evaluates trackers against an explicit dataset/sequence selection. Benchmark scores are only comparable when they come from the same evaluation set. CAY-STABLE already exported MOTChallenge-compatible data and guarded promotion on HOTA/IDF1/MOTA plus club-specific false-track counters, but the promotion gate previously compared only the number of CAY sequences.

## CAY adaptation
`tracking_candidate_promotion_gate_v1.js` now requires proof that baseline and candidate were measured on the identical CAY sequence set. Evidence can be supplied as:
- `sequenceSetId` / `sequenceManifestId` / `seqmapId`, or
- an explicit `sequenceIds` / `sequencesEvaluated` / `sequenceNames` array, normalized as a sorted unique set.

If sequence-set evidence is missing, the verdict is `INSUFFICIENT_EVIDENCE`. If the sets differ, the verdict is `CAY_SEQUENCE_SET_MISMATCH`; no tracker can be promoted even if its aggregate HOTA/IDF1/MOTA are much better.

## What this replaces
Manual checking that two benchmark summaries happened to use the same videos.

## Expected impact
- prevents an easier/different CAY clip set from producing a false tracker promotion;
- makes ByteTrack / BoT-SORT / ReID comparisons reproducible;
- preserves zero-tolerance guards for false CAY, bench/spectator false tracks and identity-switch regressions.

## Estimated work avoided
About 0.25–0.5 day per serious tracker comparison once benchmark manifests are in use, plus avoidance of invalid benchmark decisions.

## Status
Integrated in code on the validation branch; merge only after syntax/non-regression CI is green.

## Risks / dependencies
Sequence IDs or manifest IDs must be stable and generated from the benchmark configuration. A future benchmark runner should emit this identifier automatically rather than rely on manual entry.
