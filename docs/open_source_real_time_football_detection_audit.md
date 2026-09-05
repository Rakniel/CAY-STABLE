# OSS audit — Real-Time-Football-Detection

## Provenance
- Project: `rustyneuron01/Real-Time-Football-Detection`
- Source: https://github.com/rustyneuron01/Real-Time-Football-Detection
- Upstream revision inspected: `9a6f3a7e96d4f3b38e8dfc3c4e0c71731178ab44` (master, 2026-03-13; reconfirmed as latest upstream revision on 2026-09-05)
- License: MIT, verified from upstream `LICENSE` at the inspected revision.
- CAY-STABLE status: **INTEGRATED AS A DESIGN PATTERN; no upstream source code or model weights copied.**

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

## What this replaces or avoids
- Avoids writing another ad-hoc multi-ball candidate selector when the detector produces several plausible balls in one frame.
- Avoids inventing a second team-clustering pipeline from scratch when evaluating whether appearance embeddings materially improve CAY-vs-opponent separation.
- Does **not** replace CAY's active-kit selection, yellow-detail false-CAY guards, roster identity rules, bench/spectator exclusion, manual identity merge guard or metric publication guards.

## CAY adaptation
The short-history ball continuity idea is implemented locally in `ball_candidate_continuity_v1.js`, behind CAY's own browser-first contracts. No upstream code is copied.

Local modifications versus the upstream idea:
- pitch-metre and image-coordinate modes are separated;
- low-confidence, invalid, invisible or drifted candidates are excluded before ranking;
- camera/segment changes reset the prior;
- a configurable temporal gap resets the prior rather than fabricating a bridge;
- CAY keeps confidence as secondary evidence rather than accepting proximity alone;
- as of 2026-09-05, the temporal gap is measured from the **last actually selected ball observation**, not from the last processed frame. Consecutive empty frames therefore cannot keep stale history alive indefinitely.

The team-appearance branch remains benchmark-only. Any future appearance model must stay secondary to explicit kit/roster/yellow-detail/bench/spectator guards, and model/checkpoint licenses must be checked separately.

## Measured local impact — observation blackout guard
Before the 2026-09-05 correction, repeated empty frames spaced less than `maxGapSec` advanced the generic frame clock. A five-frame blackout could therefore preserve an old centroid even though no ball had been observed for longer than the allowed continuity window. A legitimate reappearance far from that stale centroid could be rejected as `ALL_CANDIDATES_BREAK_CONTINUITY`.

After the correction:
- only a selected valid ball advances `lastObservedTime`;
- once elapsed time from the last real observation exceeds `maxGapSec`, history is reset exactly once;
- the first valid ball after the blackout starts a fresh history instead of being compared with stale evidence;
- the reset is auditable through `snapshot().resets` and `lastObservedTime`.

Regression coverage: `tests/ball_candidate_continuity_nonregression.js` includes successive empty frames followed by a distant valid reappearance on the same live segment.

Estimated work avoided by retaining the compatible short-history prior instead of replacing it with a second tracker: **0.25–0.5 day** for this correction, in addition to the earlier prototype/plumbing saving estimate of **0.5–1.5 days**.

## Risks / dependencies
- Upstream team classification pulls a heavy stack (`torch`, Transformers/SigLIP, UMAP, scikit-learn); this is not acceptable as a mandatory browser-first dependency without a measured gain.
- Two-cluster KMeans assumes the visual crops predominantly contain the two playing teams; referees, goalkeepers, bench staff and spectators can contaminate clustering. CAY's exclusions must run before or constrain this evidence.
- Centroid-based ball selection is intentionally simple and can fail on long ball flights, rebounds or rapid legitimate motion. It remains candidate-ranking evidence only and cannot be treated as authoritative ownership evidence.
- Camera/shot discontinuities must continue to reset continuity before any owner/pass/turnover inference.
- Upstream model/checkpoint licenses must be verified separately before any model asset is shipped; the repository MIT license does not automatically license third-party model weights.

## Decision gate
**Status: INTEGRATED (conceptual adaptation, zero copied source, zero added runtime dependency).** Future promotion of heavier appearance/model components still requires a representative C.A. Yenne benchmark showing measurable gain without increasing false CAY assignments or fabricated ball events.