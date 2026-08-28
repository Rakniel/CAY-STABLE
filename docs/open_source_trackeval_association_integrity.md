# SoccerNet TrackEval association-integrity adaptation

- Source: https://github.com/SoccerNet/sn-trackeval
- Upstream commit inspected: `9c25232f6f2b56c9f203f1eb55784ff1e97df683` (2025-07-22).
- License: MIT.
- Upstream concept used: HOTA separates detection quality from association quality; SoccerNet tracking explicitly treats DetA and AssA as distinct failure dimensions.
- Status in CAY-STABLE: design/evaluation principle adapted; no TrackEval source code copied.

## Why this was needed

`tracking_benchmark_v1.js` already measured coverage, ID switches, fragmentations and a simple identity-continuity score. That catches one ground-truth player being split across multiple tracker IDs, but it can miss the inverse error: two different players can be assigned the same tracker ID for an entire sequence and still show zero ID switches and 100% legacy continuity.

## CAY-STABLE adaptation

The local benchmark now builds two matched-observation contingency views:

1. ground-truth identity -> produced tracker IDs, to detect identity splitting;
2. produced tracker ID -> ground-truth identities, to detect identity merging/collisions.

It exposes:
- `gtAssociationPurity`: weighted dominant tracker-ID share per ground-truth player;
- `trackAssociationPurity`: weighted dominant ground-truth-player share per produced tracker ID;
- `associationIntegrity`: geometric mean of the two purities;
- `mergedTrackIds`: produced IDs representing more than one ground-truth player;
- `splitGroundTruthIds`: ground-truth players represented by more than one produced ID.

These are CAY-specific lightweight diagnostics, not a reimplementation or claim of exact HOTA/AssA equivalence. Full benchmark publication should still use official TrackEval when appropriate.

## What this replaces

It strengthens the previous acceptance gate that could approve a tracker with perfect coverage and no ID switches even when two C.A. Yenne players had been collapsed into one persistent identity.

## Tests

`tests/tracking_association_integrity_nonregression.js` covers clean tracking, a two-player ID collision that legacy continuity misses, identity splitting and before/after improvement comparison.

## Dependency / risk

- New runtime dependency: none.
- License obligations added to distributed code: none, because no upstream source was copied.
- Main risk: these lightweight metrics require labelled ground-truth observations and are diagnostic rather than official HOTA scores.
