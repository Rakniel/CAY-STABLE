# OSS audit — Real-Time-Football-Detection

## Provenance
- Project: `rustyneuron01/Real-Time-Football-Detection`
- Source: https://github.com/rustyneuron01/Real-Time-Football-Detection
- Upstream revision inspected: `9a6f3a7e96d4f3b38e8dfc3c4e0c71731178ab44` (master, 2026-03-13)
- License: MIT
- CAY-STABLE status: **STUDIED / design and benchmark candidate; no upstream source code or model weights copied.**

## Relevant upstream pieces
The upstream project exposes a football-specific pipeline around player/ball/referee tracking and pitch keypoints. Two compact patterns are directly relevant to CAY-STABLE:

1. `miner/sports/common/ball.py`
   - keeps a short history of ball positions;
   - when several detections exist, selects the candidate nearest the recent-position centroid;
   - useful as a cheap candidate-ranking prior before the stricter CAY ball evidence/state machine.

2. `miner/sports/common/team.py`
   - extracts visual embeddings from player crops with SigLIP;
   - reduces embeddings with UMAP and separates two teams with KMeans;
   - useful as a benchmark/reference for appearance-based team separation when shirt-colour evidence is weak.

## What this may replace or avoid
- Avoid writing another ad-hoc multi-ball candidate selector if the current detector produces several plausible balls in one frame.
- Avoid inventing a second team-clustering pipeline from scratch when evaluating whether appearance embeddings materially improve CAY-vs-opponent separation.
- Does **not** replace CAY's active-kit selection, yellow-detail false-CAY guards, roster identity rules, bench/spectator exclusion, manual identity merge guard or metric publication guards.

## CAY adaptation policy
No direct import is proposed yet. The first useful adaptation is a benchmark-only experiment behind existing CAY contracts:

- **Ball candidate prior:** compare the current ball candidate ranking against a short-history centroid prior on identical detections. Promotion requires improved valid-ball coverage without increased wrong-owner associations or fabricated events.
- **Team appearance evidence:** compare current shirt/kit evidence against embedding clustering only as secondary evidence. It must never overrule explicit C.A. Yenne kit configuration, player roster identity, yellow-detail exclusion, bench/spectator rejection or manual review guards.
- Any future copied/adapted MIT code must retain attribution/notice and record the exact upstream revision and local modifications.

## Expected measurable impact
- Ball path: fewer ambiguous multi-detection frames and fewer short false jumps, potentially improving possession/pass evidence coverage.
- Team path: fewer unresolved team assignments under blur/lighting variation while preserving zero-false-CAY priority.
- Estimated work avoided if validated: **0.5–1.5 days** of prototype design and plumbing.

## Risks / dependencies
- Upstream team classification pulls a heavy stack (`torch`, Transformers/SigLIP, UMAP, scikit-learn); this is not acceptable as a mandatory browser-first dependency without a measured gain.
- Two-cluster KMeans assumes the visual crops predominantly contain the two playing teams; referees, goalkeepers, bench staff and spectators can contaminate clustering. CAY's exclusions must run before or constrain this evidence.
- Centroid-based ball selection is intentionally simple and can fail on long ball flights, camera cuts, rebounds or a stale history buffer. It cannot be treated as authoritative ownership evidence.
- Upstream model/checkpoint licenses must be verified separately before any model asset is shipped; the repository MIT license does not automatically license third-party model weights.

## Decision gate
Status remains **STUDIED** until a representative CAY video benchmark shows a measurable improvement. No runtime dependency or copied source is introduced by this audit.