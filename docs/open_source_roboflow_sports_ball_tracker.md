# Open-source audit — Roboflow Sports ball tracking

Date inspected: 2026-09-01

## Source
- Project: `roboflow/sports`
- Repository: https://github.com/roboflow/sports
- Upstream revision inspected: `42c80c06b6b65a7f89455b89fe31cdf4c38ba227`
- Ball implementation inspected: `sports/common/ball.py`, blob `98ad76eaf48c2d77e7ea40de33877e88ce67b925`
- License: MIT (`LICENSE` in repository root).

## Useful upstream idea
Roboflow Sports keeps a short buffer of observed ball coordinates and, when several ball detections exist in a frame, selects the candidate closest to the centroid of recent ball positions. This is useful because a football detector may produce several small round-object candidates in the same frame.

## CAY-STABLE adaptation
No upstream source code is copied. `ball_candidate_continuity_v1.js` is a clean-room browser/Node implementation of the general temporal-candidate-selection idea, hardened for C.A. Yenne requirements:
- only chooses among actually observed detections; it never synthesizes/interpolates a ball position;
- minimum detector confidence is mandatory;
- supports validated pitch-metre coordinates when available, otherwise image coordinates;
- enforces a maximum temporal jump rather than always choosing some candidate;
- resets the temporal prior after a long observation gap;
- resets the temporal prior across segment/shot/plan changes;
- returns `UNAVAILABLE` when every candidate is implausible;
- exposes selection/reset/rejection provenance for audit.

## What it replaces / work avoided
This replaces a bespoke multi-candidate ball disambiguation design that would otherwise have to be created before connecting a real ball detector to `ball_event_state_v1.js`. Estimated avoided design/plumbing effort: **0.25–0.75 day**.

## Expected impact
Expected: fewer false ball locks when advertisements, socks, field markings or other small objects are detected as ball candidates; cleaner ball coverage and therefore fewer false possession/pass transitions. No accuracy gain is claimed until measured on representative C.A. Yenne video.

## Dependency / license risk
- Zero new runtime dependency: no NumPy, OpenCV or Supervision import is added to CAY-STABLE.
- MIT is compatible with the current reuse policy, but model weights feeding this selector remain separately auditable artifacts.
- The upstream centroid heuristic alone is intentionally not copied as-is because it always selects a candidate when detections exist; CAY-STABLE may reject all candidates and preserve `INDISPONIBLE` instead.

## Validation
`tests/ball_candidate_continuity_nonregression.js` covers distant high-confidence false candidates, hard continuity rejection, time-gap reset, camera/segment reset, minimum confidence and image-coordinate fallback.
