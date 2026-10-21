# SoccerNet sn-reid benchmark audit (2026-09-16)

## Provenance and license
- Project: SoccerNet/sn-reid
- Source: https://github.com/SoccerNet/sn-reid
- Upstream revision inspected: `621e2b0f2d2a7a3e207b8dd747542b6608bf72db`
- Upstream code license: MIT (`LICENSE` verified at the pinned revision).
- Scope inspected: repository metadata, license and challenge README.
- No upstream source code, model weights, thumbnails, annotations or datasets are copied into CAY-STABLE by this change.

## Useful upstream function / idea
SoccerNet Re-Identification is a football-specific multi-view player ReID benchmark. Its challenge evaluates ranking of the same player across different camera viewpoints and reports standard retrieval measures including mAP and rank-1. The public 2023 leaderboard demonstrates that this is a mature football-specific evaluation target rather than a generic pedestrian-only ReID toy benchmark.

## Existing CAY-STABLE architecture inspected first
CAY already has the conservative runtime pieces needed to consume ReID evidence without allowing an embedding model to silently rewrite identity:
- `reid_evidence_fusion_v1.js`: quality-filtered multi-observation appearance evidence, team constraint, similarity margin and `A_VERIFIER` suggestions only;
- `tracking_core_v1.js` / persisted appearance gallery: bounded multi-frame appearance memory;
- roster/manual identity contracts remain authoritative.

Therefore importing the SoccerNet baseline runtime would duplicate existing CAY logic and is not justified. The useful reuse is the benchmark contract and football-domain validation target.

## CAY adaptation
Use SoccerNet-style retrieval evaluation as an optional offline gate for any future ReID extractor (OSNet/ONNX or another permissively usable model) before that extractor is allowed to feed CAY's existing evidence-fusion contract.

For a C.A. Yenne validation set, measure at minimum:
1. mAP and rank-1 over player crops across camera plans / re-entry intervals;
2. same-player vs nearest-wrong-player similarity margin;
3. false CAY suggestion rate, with special slices for yellow details, opponents, referees, bench and spectators;
4. identity recovery after occlusion / out-of-frame re-entry;
5. downstream ID switches per player-minute when the candidate evidence is enabled vs disabled;
6. latency per crop and memory footprint on the target club machine.

The runtime safety rule remains `NEVER_AUTO_MERGE`: a good retrieval score may improve evidence ranking but cannot bypass roster/team/manual identity guards.

## What this replaces
This avoids inventing a bespoke ReID evaluation protocol based only on generic cosine-similarity anecdotes. It provides a football-specific benchmark vocabulary and known retrieval metrics while preserving CAY's stricter identity policy.

## Estimated work avoided / expected impact
- Engineering/research work avoided: approximately 0.5–1.5 days of benchmark design and metric selection.
- Expected impact: faster, objective selection or rejection of future ReID extractors; fewer regressions hidden by aggregate tracking scores.
- No numerical C.A. Yenne accuracy gain is claimed until representative footage/crops are measured.

## Status
**STUDIED / BENCHMARK CANDIDATE.** No runtime integration or dependency added.

## Risks and dependencies
- The repository's MIT license covers its code; dataset/media/model rights must be audited separately before downloading, redistributing or bundling them.
- SoccerNet challenge crops are broadcast-football data and may not match C.A. Yenne camera height, resolution, kit similarity or lighting. CAY-specific validation remains mandatory.
- High mAP/rank-1 alone does not prove safe persistent identity in video; temporal tracking, team constraints, manual roster identity and false-CAY guards remain separate gates.
- Any future pretrained ReID weights require their own exact source/version/license provenance before use.
