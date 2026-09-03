# Open-source audit — Supervision-inspired player card UI

Date: 2026-09-03

## Source
- Project: `roboflow/supervision`
- Repository: https://github.com/roboflow/supervision
- License: MIT
- Reference family: trace/heatmap annotators and separation of reusable analytics data from presentation.

## What CAY-STABLE reused
No third-party source code was copied. CAY-STABLE adapted the architectural idea that visualization consumes a prepared tracking/analytics contract rather than recomputing tracking or metrics inside the renderer.

The new `player_card_renderer_v1.js` consumes only `CAY_PLAYER_CARD_VIEW_MODEL_V1`. It does not recalculate distance, speed, sprint count, tracking identity, calibration or heatmaps. This replaces the older ad-hoc HTML rendering path that directly read raw report fields and therefore could drift from the publication guards.

## C.A. Yenne modifications
- red/black visual identity;
- club terminology in French;
- explicit split between `IMAGE_NORMALIZED` camera-presence visuals and `PITCH_METERS` validated terrain visuals;
- `INDISPONIBLE` remains visible rather than silently converted to zero;
- defended zero sprint count remains zero;
- no logo is redrawn or modified;
- no external runtime dependency added.

## Expected gain
Estimated 0.5–1 day of UI/data-plumbing work avoided by reusing the existing view-model contract and the mature visualization separation pattern rather than creating a second analytics path.

## Status
Integrated as an adapted idea, with no copied third-party code. Risk is limited to browser loading of the local renderer file; analytics remain unaffected if rendering is unavailable.
