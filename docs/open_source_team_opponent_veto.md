# OSS adaptation — conservative opponent evidence veto

## Provenance
- Primary design source: `rustyneuron01/Real-Time-Football-Detection`
- Upstream revision inspected previously: `9a6f3a7e96d4f3b38e8dfc3c4e0c71731178ab44` (2026-03-13)
- License: MIT
- Relevant upstream idea: appearance-based separation of player crops into the two playing teams using SigLIP embeddings, UMAP and KMeans.
- Local status: **ADAPTED IN CLEAN ROOM**. No upstream source code, model weights, SigLIP, UMAP, scikit-learn or PyTorch components are copied or imported.

## CAY-STABLE adaptation
CAY-STABLE does not treat an appearance classifier as positive proof that a player belongs to C.A. Yenne. Instead, `team_opponent_evidence_veto_v1.js` defines a narrow negative-evidence contract:

- a candidate can be vetoed as CAY only when it is explicitly classified as opponent;
- confidence must be high (default >= 0.86);
- at least two independent evidence-source labels are required;
- conflicting explicit CAY evidence disables the automatic veto and leaves the case for review;
- goalkeeper veto is disabled by default because goalkeeper kits are intentionally atypical;
- the module only writes `cayEligible:false` / `teamEvidenceValid:false`; it never writes positive CAY membership.

This contract is intentionally compatible with the existing `stable_tracking_bridge_v1.js` eligibility semantics, which already reject detections carrying `cayEligible:false` or `teamEvidenceValid:false`. A future classifier can therefore feed this veto without changing the tracker identity model or inventing a second CAY-positive classifier.

## What this replaces / avoids
- avoids a bespoke browser-side team-clustering stack before representative footage proves it is worth shipping;
- avoids importing the upstream heavy SigLIP/UMAP/scikit-learn/PyTorch dependency chain;
- provides a single stable negative-evidence interface for future kit-colour, embedding-cluster or manual opponent labels.

## Expected gain
- Estimated engineering work avoided: **0.25–0.75 day** of team-classifier plumbing and duplicated eligibility logic.
- Expected impact: fewer false CAY candidates from visually similar opponents while preserving the zero-false-CAY priority.
- No accuracy percentage is claimed until measured on representative C.A. Yenne footage.

## Risks and dependencies
- Two appearance signals derived from the same underlying crop/model are not truly independent; producers should use distinct source labels only when the evidence pipelines are materially different.
- Referees, spectators and bench personnel must still be excluded by the existing field/role guards before team evidence is trusted.
- Similar kits can still create high-confidence wrong clusters; therefore this is a veto-only contract, never a positive identity source.
- Any future model weights require their own license verification; repository MIT licensing does not automatically cover third-party checkpoints.

## Validation
- `tests/team_opponent_evidence_veto_nonregression.js` covers strong multi-source veto, weak confidence, insufficient evidence, conflicting CAY evidence, goalkeeper protection and filter behavior.
- Local Node syntax check and dedicated non-regression test pass before PR creation.
