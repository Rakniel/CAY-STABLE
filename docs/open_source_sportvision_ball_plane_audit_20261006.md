# Open-source audit — sportvision ball-plane evidence (2026-10-06)

## Provenance
- Project: MohibShaikh/sportvision
- Source: https://github.com/MohibShaikh/sportvision
- Audited revision: `972a3ed29d02aa9c7298924fa2ef8aafacd16998` (2026-09-11)
- Upstream release message: 0.5.1
- License: Apache-2.0 (verified from upstream LICENSE and GitHub SPDX metadata)
- Upstream code copied into CAY-STABLE: **none**
- Model weights/data copied: **none**

## Useful finding
The upstream 0.5.1 change explicitly stopped assigning the ball a tactical-map position for possession because a single pitch homography describes the ground plane, while an airborne/held ball is not on that plane. Upstream instead visualizes the player to whom possession evidence is attributed. The same release also rejects degenerate calibration geometry.

This is directly relevant to CAY-STABLE because `ball_event_state_v1.js` currently consumes pitch-metre ball coordinates for ownership, ball speed, pass travel and turnover travel. Those metrics are defensible only when the ball projection can be treated as ground-plane evidence (or when another producer supplies an explicitly validated equivalent).

## CAY decision
Status: **studied; no runtime integration yet**.

Do not copy the upstream implementation. Add a CAY-native fail-closed evidence field at the ball/projector boundary before changing event semantics:
1. preserve observed image-space ball evidence separately;
2. mark projected ball coordinates with plane/projection provenance;
3. allow ground-plane metric ball coordinates for distance/speed only when that evidence is defensible;
4. for airborne/held/unknown-plane states, ownership may use a separately validated image/player association, but metric ball travel must become `INDISPONIBLE`;
5. never let this weaken existing coverage, ambiguity, camera-segment, bench/spectator or event-transition guards.

Backward compatibility must be explicit: legacy samples without plane metadata must not silently be reclassified as verified ground-plane observations.

## What this can replace / avoid
This avoids extending the current nearest-player-in-metres rule into a false assumption that every detected ball lies on the pitch plane. It also avoids inventing a second possession state machine: the correct integration point is the existing ball evidence bridge/state contract.

Estimated work avoided: ~1–2 days of debugging misleading ball-to-player distances and pass travel on held/high balls.

## Acceptance benchmark
Before runtime promotion, add non-regression cases for:
- grounded ball: existing ownership/pass behavior unchanged;
- airborne/held ball: no fabricated metric travel/speed;
- unknown projection plane: fail closed for physical ball metrics;
- ambiguous nearby players: remains ambiguous;
- camera cut/segment change: continuity still resets;
- low ball coverage: possession/passes remain `INDISPONIBLE`.

Measure before/after: false owner assignments on aerial/held-ball frames, rejected metric-ball frames, pass precision/recall on annotated clips, ball-event coverage, and any regression in existing grounded-ball tests.

## Dependency/legal boundary
Apache-2.0 covers the upstream repository code, not arbitrary YOLO/RF-DETR weights, datasets, Roboflow services, Ultralytics artifacts, or transitive model assets. Any future dependency or weight must be audited independently.
