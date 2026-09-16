# OSS audit — SportVision 0.5.1 evidence rules (2026-09-16)

## Provenance and licence

- Project: `MohibShaikh/sportvision`
- Upstream revision audited: `972a3ed29d02aa9c7298924fa2ef8aafacd16998` (release 0.5.1, 2026-09-11)
- Upstream code licence: Apache-2.0 (verified from upstream `LICENSE` at the pinned revision)
- CAY-STABLE treatment in this change: **design/benchmark reference only**. No upstream source, model, dataset, media or dependency is copied or vendored.
- If code is imported later, preserve Apache-2.0 notices and audit every transitive dependency/model/data licence independently before integration.

## Useful upstream findings

SportVision 0.5.1 documents three failure modes directly relevant to CAY-STABLE:

1. **Planar homography must not invent a ball ground position.** Upstream removed its tactical ball position after observing that a floor homography can place an elevated/held ball far from its true player association. CAY adaptation: keep ball/player association as evidence, but never turn an image-space ball into metric pitch coordinates unless a defensible ground-contact/3D assumption exists.
2. **Team classification needs enough evidence.** Upstream reports 56% agreement when KMeans was fitted from an undersampled first frame versus 92% after collecting a wider opening sample. CAY adaptation: do not auto-label CAY from a tiny colour sample; preserve explicit unknown/unassigned state, manual kit evidence and the existing anti-yellow/bench/spectator guards.
3. **Degenerate calibration must fail closed.** Upstream now rejects collinear/near-singular calibration inputs instead of allowing plausible-looking but wrong projections. CAY adaptation: keep calibration validity and confidence gates ahead of trajectories, heatmaps, distance and speed; an invalid geometry yields `INDISPONIBLE`, never a plausible fallback.

## What this replaces / avoids

This does not replace a CAY runtime module. It replaces three tempting but unsafe implementation shortcuts:

- projecting every detected ball through the player/floor homography;
- assigning a team from the first minimally populated frame;
- accepting a homography because a matrix was returned.

Estimated work avoided: **1–2 engineering days** of reproducing and debugging these failure modes independently.

## Expected measurable impact in CAY-STABLE

Future runtime changes influenced by this audit must be evaluated with:

- false metric ball positions / 10 min: target **0 published** when ground-contact evidence is absent;
- CAY/opponent assignment precision plus explicit unknown coverage, with special fixtures for yellow details, referees, bench and spectators;
- calibration rejection on collinear/near-singular point sets: **100% fail closed**;
- player trajectory/heatmap contamination from invalid calibration: **0 accepted points**;
- distance/speed publication: remains `INDISPONIBLE` whenever calibration evidence is not defensible.

## Status

**Studied / design rules adopted / runtime code not imported.**

Risk/dependencies: Apache-2.0 applies to the audited repository code, not automatically to external detector weights, datasets, Roboflow services/models, Supervision, Ultralytics or other transitive assets. Those remain separately gated by CAY's licence policy.
