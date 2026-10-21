# Soccer Sight license and identity-evidence audit

Audit date: 2026-09-16

## Upstream

- Project: `umitkacar/soccer-sight`
- Source: https://github.com/umitkacar/soccer-sight
- Audited revision: `3a904d4ad1cf88c3dbc34926bb20985e2d441693`
- Claimed license in README badge: MIT
- Verified repository license file at audited revision: **not present at repository root**
- CAY legal status: **code reuse rejected until an explicit applicable license text is present and verified**

CAY-STABLE does not treat a README badge or prose claim as sufficient permission to copy source. No Soccer Sight code, configuration, model, test image, weight, or dataset is incorporated by this audit.

## Useful independent finding

The project is nevertheless a useful architecture/benchmark reference for persistent football identity. It combines player detection and tracking with tracklet-level jersey-number OCR and team appearance classification. Its own README also exposes why headline accuracy must not be trusted without reproducing the exact benchmark: the feature table advertises a 92% SoccerNet OCR figure, while the repository's small local 16-image benchmark reports 22.9% for SoccerNet, 11.5% for EasyOCR and 10.4% for PARSeq.

CAY adapts only the general evaluation lesson, not implementation code:

1. jersey number is **secondary identity evidence**, accumulated over a tracklet rather than trusted from one blurred frame;
2. invisible/unreadable numbers remain unknown and never force an identity;
3. jersey evidence cannot override team/CAY guards, the yellow-detail rejection rule, bench/spectator exclusion, segment boundaries, or `NEVER_AUTO_MERGE`;
4. any future OCR backend must be benchmarked on representative C.A. Yenne crops and report coverage separately from accuracy;
5. model/checkpoint, OCR library and dataset licenses are audited independently from the wrapper repository.

## What this can replace

If validated later, tracklet-level number evidence can extend the existing CAY persistent identity/ReID evidence contract instead of creating a second identity pipeline. It can reduce manual player confirmation after occlusion/re-entry while preserving the existing roster and appearance evidence.

## Promotion gates

A future jersey-number evidence adapter is promoted only if all of the following are measured on C.A. Yenne footage:

- readable-number coverage;
- accuracy on readable crops/tracklets;
- false confident number rate;
- false CAY identity rate per 10 minutes;
- identity recovery rate after occlusion/re-entry;
- ID switches per player-minute before/after;
- no identity propagation across a cut/segment without independent evidence;
- latency and compute cost compatible with the STABLE workflow.

When evidence is unreadable, conflicting or insufficient, the result is `INDISPONIBLE`/manual review, not a guessed number.

## Estimated engineering impact

The architecture/benchmark review avoids roughly 0.5-1 day of exploratory OCR/identity design. Runtime impact today: zero. Dependency impact today: zero.

## Status

**Studied / benchmark idea adapted / source-code reuse rejected because the audited repository does not contain a verifiable root license file.** Re-evaluate only if upstream adds an explicit license text and each transitive model/data dependency passes a separate audit.
