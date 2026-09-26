# SRITrack re-entry tracking audit

Audit date: 2026-09-26
Upstream: https://github.com/kaoyuyukao/SRITrack
Upstream release stated by project: 2026-03-01
License checked: MIT (`LICENSE`, copyright 2026 Yu-Yung Kao)
Status for CAY-STABLE: benchmark/reference candidate only; no runtime code or weights imported.

## Why it matters to CAY-STABLE

SRITrack targets sports broadcast MOT with long occlusions, dynamic camera motion and players leaving/re-entering the view. Those failure modes overlap directly with CAY-STABLE's persistent-player identity requirement. The upstream README reports 85.2% HOTA on SportsMOT train+val under its online protocol and includes football demonstrations.

The useful architectural idea is to evaluate re-entry identity as a first-class capability rather than extending track age indefinitely. For CAY this means any candidate tracker/ReID backend must be measured separately on: ordinary short occlusion, out-of-frame exit/re-entry, camera cut/multi-plan boundary, and substitution/roster ambiguity. A tracker must not bridge a cut or plan transition merely to preserve an ID.

## License/dependency boundary

The repository root is MIT, but this does not automatically license external assets or dependencies. The README requires/suggests external SportsMOT/YOLOX detector weights and a separately downloaded ReID checkpoint. Those datasets/weights must be audited independently before use. SRITrack also acknowledges SportsMOT, Deep-EIoU, BoT-SORT and ByteTrack as foundations; their code/license provenance must remain independently traceable if any implementation is reused.

Therefore this audit authorizes no copying of detector weights, ReID weights, datasets, or transitive code into CAY-STABLE.

## CAY acceptance contract

A future SRITrack-inspired or SRITrack-derived candidate is accepted only if it improves identity continuity on a fixed offline corpus without regressing CAY-specific invariants: zero false CAY assignments caused by yellow details, bench/spectator exclusion, <=11 simultaneous on-field CAY players, explicit coverage, fail-closed `INDISPONIBLE`, and no fabricated metric continuity across camera cuts, stale homography, temporal gaps or incompatible planes.

Track quality must be reported with HOTA/AssA/IDF1 plus explicit re-entry recovery rate and false-reconnection rate. Coverage is reported separately so keeping identities alive longer cannot manufacture an apparent improvement.

## Reuse decision

Reuse now: evaluation design and re-entry benchmark concept only (clean-room adaptation).
Runtime integration: rejected for now.
Estimated avoided work: 1-3 days of designing a sports-specific re-entry evaluation from scratch.
Expected impact: better selection of ByteTrack/BoT-SORT/ReID candidates for persistent CAY identities, especially after genuine exits and returns.
Risks: external weight/data licensing, Python/PyTorch runtime weight, domain gap between SportsMOT and C.A. Yenne footage, and false reconnection if re-entry matching is over-aggressive.

No runtime performance or accuracy gain is claimed by this documentation-only change.
