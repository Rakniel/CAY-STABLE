# Open-source audit — SAM3 ball-in-play drift suppression

Date inspected: 2026-09-01

## Source
- Project: `holma91/sam3-ball-tracking`
- Repository: https://github.com/holma91/sam3-ball-tracking
- Revision inspected: `8ca5f335dff5846efb1ec7b4ebac2846a2c0c908` (2026-05-26).
- Ball-tracking code license: MIT.
- Vendored/model dependency note: SAM3 code/checkpoints are under Meta's separate SAM license and require gated Hugging Face access plus CUDA. Those components are **not imported** into CAY-STABLE.

## Useful upstream idea
The project deliberately separates permissive ball-candidate generation from conservative ball-in-play selection. A documented failure mode is a tiny ball track drifting onto a player/shoe/sock after contact or occlusion. The upstream system suppresses drift using sustained player attachment rather than killing every brief overlap.

## CAY-STABLE adaptation
No upstream implementation code is copied. `ball_player_drift_guard_v1.js` is a clean-room browser/Node implementation that fuses independent evidence before rejecting a candidate:
- sustained proximity to the same on-field player;
- stable ball-to-player relative geometry;
- propagated/interpolated/drift-risk provenance when available;
- low ball confidence when available;
- abnormal candidate-area growth versus recent clean ball observations.

A candidate becomes `DRIFTED` only after a minimum attachment duration and at least two drift signals. Brief overlaps remain `WATCH`. Bench/spectator/off-field detections cannot act as drift anchors. Segment/camera-plan changes and temporal gaps reset accumulated attachment evidence.

`ball_candidate_continuity_v1.js` was extended rather than duplicated: candidates already marked `drifted=true` or `driftStatus='DRIFTED'` are excluded before temporal selection.

## What this replaces / work avoided
This avoids building a second ball-selector or importing a SAM3/CUDA stack merely to obtain drift suppression. Estimated avoided prototype/integration effort: **0.25–0.75 day**.

## Expected measurable impact
Expected reduction in false ball locks caused by propagated tracks attaching to player clothing/shoes during occlusions. No production accuracy gain is claimed until measured on representative C.A. Yenne footage with the existing ball-event benchmark.

## Status
- Idea studied: yes.
- Clean-room adaptation integrated on validation branch: yes.
- Upstream code copied: no.
- Meta SAM3 runtime/model dependency imported: no.
- Promotion requirement: non-regression suite + syntax/integration guards must pass before merge.

## Risks
- A real ball can remain close to a player's foot during control/dribbling; therefore player proximity alone is never enough to reject it.
- Candidate-area evidence depends on consistent detector/tracker box or mask area semantics.
- The guard is conservative by design and should be tuned only from annotated football clips, not from intuition alone.
