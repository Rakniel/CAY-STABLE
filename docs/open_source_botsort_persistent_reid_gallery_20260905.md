# BoT-SORT appearance memory -> persistent CAY tracker state (2026-09-05)

## Source and license
- Project: NirAharon/BoT-SORT
- Source: https://github.com/NirAharon/BoT-SORT
- Upstream revision inspected: `251985436d6712aaf682aaaf5f71edb4987224bd`
- License: MIT (`LICENSE` verified in the upstream repository).
- Upstream file inspected: `tracker/bot_sort.py`.

## Useful upstream principle
BoT-SORT keeps both a smoothed appearance feature (`smooth_feat`) and a bounded history of recent appearance features (`features`, a deque). This lets identity association use more than the most recent visual crop.

## CAY-STABLE problem found
CAY's live `tracking_core_v1.js` already follows the same useful principle with an EMA-like `feature` plus a bounded `appearanceGallery`. However, `tracker_state_v1.js` previously serialized only the legacy `appearance` vector. A direct snapshot of a live CAY tracking-core track could therefore lose the gallery, and even its `globalId`/`seen`/`segmentsSeen` fields required external remapping.

That meant the long-term tracking runtime could resume the correct team/video scope but with weaker ReID evidence than existed immediately before the save.

## Adaptation integrated
No BoT-SORT source code is copied.

`tracker_state_v1.js` now:
- accepts the native CAY tracking-core shape (`globalId`, `seen`, `segmentsSeen`, `feature`, `appearanceGallery`);
- persists both the current appearance feature and the bounded gallery;
- keeps the old `appearance` alias for backwards compatibility;
- hydrates legacy snapshots containing only `appearance` back into `feature` on import;
- caps persisted gallery history at 48 samples, matching the existing CAY tracking-core maximum;
- rejects malformed gallery dimensions or invalid quality scores rather than allowing corrupted ReID evidence to poison a resumed identity.

## What this replaces
This removes the need for a separate hand-written adapter whose only purpose would be to translate CAY tracking-core identity memory into the persistence schema. It also replaces the previous lossy persistence of appearance evidence.

## Measurement / expected impact
Synthetic non-regression fixture:
- before: 2 live gallery samples -> 0 gallery samples after tracker-state serialization;
- after: 2 live gallery samples -> 2 gallery samples after export/import;
- live `globalId=12` and `seen=31` now persist directly as `trackId='12'` and `observations=31`.

Expected engineering work avoided: roughly 0.25-0.5 day of adapter/plumbing and future debugging around identity degradation after resume.

Expected product impact: fewer avoidable ID breaks immediately after save/resume because the same appearance memory used by the active tracker remains available. This is not a claim of a specific real-video ID-switch reduction until representative C.A. Yenne footage is benchmarked.

## Status
**INTEGRATED CONCEPTUALLY AND LOCALLY.**

## Dependency / legal impact
- New runtime dependency: none.
- Copied upstream code: none.
- Copied model weights/datasets: none.
- License obligation added to CAY distributed source: none beyond retaining this provenance record, because only the design principle was adapted in original CAY code.

## Risks
- Persisted embeddings must keep a consistent dimensionality; mismatches now fail closed.
- A historically contaminated gallery can still be harmful; existing CAY confidence/update guards and bounded history remain necessary.
- Real-match validation remains required before claiming measurable identity-switch gains.
