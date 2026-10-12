# SoccerNet sn-reid audit

## Provenance
- Project: SoccerNet Player Re-Identification (`SoccerNet/sn-reid`)
- Source: https://github.com/SoccerNet/sn-reid
- Audited revision: `621e2b0f2d2a7a3e207b8dd747542b6608bf72db`
- Code license: MIT (`LICENSE` present at repository root; copyright Kaiyang Zhou)
- Upstream status: SoccerNet ReID 2023 development kit; fork/adaptation of Torchreid.

## Useful capability
The project provides a football-specific ReID benchmark rather than a generic pedestrian-only protocol. Query/gallery samples are restricted to the same SoccerNet action and evaluation exposes rank-1 and mean average precision. The dataset includes difficult same-kit identities, varied crop resolution, player/referee classes and jersey-number metadata when visible.

The published 2023 leaderboard reports 93.26 mAP / 91.26 rank-1 for the leading entry and 91.68 mAP / 89.41 rank-1 for the supplied Inspur baseline. These are upstream benchmark numbers only; they are not CAY-STABLE performance claims.

## CAY-STABLE adaptation
Do not replace CAY roster identity with a ReID embedding ID. ReID remains secondary evidence behind the existing `reid_evidence_fusion_v1.js` contract and `NEVER_AUTO_MERGE` policy.

Use SoccerNet sn-reid as an offline benchmark/reference for future OSNet/ONNX extractors:
- measure rank-1 and mAP on football crops before considering a model;
- separately measure CAY-specific identity persistence, ID switches and false merges on representative C.A. Yenne footage;
- quarantine evidence at camera cuts/segment changes until identity is re-established;
- reject cross-team matches and low-quality crops;
- keep jersey number evidence separate from appearance evidence;
- never let ReID override bench/spectator exclusion, the 11-on-field invariant, or yellow-detail anti-false-CAY guards.

A model that improves SoccerNet rank-1 but increases CAY false merges is rejected.

## License / dependency boundary
The repository code is MIT, but dataset access/terms, pretrained weights and every transitive dependency remain separate legal artifacts and must be audited independently before redistribution or bundling. This audit imports no SoccerNet code, dataset, model weights or Python dependency into the browser-first STABLE runtime.

## What this avoids
This avoids inventing a bespoke ReID evaluation protocol and gives the existing CAY evidence-fusion layer a football-specific external benchmark target. Estimated work avoided: 0.5–1 day of benchmark/protocol design, excluding dataset acquisition and model evaluation time.

## Expected measurable impact
Before any extractor is promoted, record at minimum:
- SoccerNet rank-1 and mAP;
- CAY identity recovery after occlusion/re-entry;
- CAY false-merge rate;
- ID-switch delta versus tracking-only baseline;
- coverage of usable ReID evidence;
- inference latency and bundle/runtime cost.

No production accuracy gain is claimed until those measurements exist.

## Status
Studied / benchmark protocol adapted / no runtime import.