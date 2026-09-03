# mplsoccer-inspired validated player trajectory rendering — 2026-09-03

## Upstream reference
- Project: `andrewRowlinson/mplsoccer`
- Source: https://github.com/andrewRowlinson/mplsoccer
- Audited revision: `ad40c4ccbade56263ccd1d038ad49044fa9928d8` (2026-07-31)
- License: MIT
- Upstream purpose: football-pitch plotting and football-coordinate visualisation.

## What CAY-STABLE reused
CAY-STABLE reuses only the mature design idea that player locations and paths intended for tactical/physical interpretation must be plotted in the football pitch coordinate system rather than directly in camera pixels. No mplsoccer source code, Python package, model weight or runtime dependency is copied into CAY-STABLE.

The implementation extends the existing CAY metric chain rather than introducing a second trajectory system:
1. `metric_pitch_heatmap_v1.js` remains the single producer of defended `PITCH_METERS` trajectory runs and heatmap evidence.
2. `stable_metric_visuals_runtime_v1.js` now carries the explicit metric pitch dimensions used by that producer.
3. `player_card_view_model_v1.js` forwards those dimensions without inference.
4. `player_card_renderer_v1.js` renders the already-validated trajectory runs on a lightweight C.A. Yenne red/black SVG pitch. Separate runs remain separate; gaps, camera cuts and rejected metric intervals are never silently joined.
5. The renderer now accepts the runtime heatmap payload `normalizedCells` as well as the older `cells` shape, fixing a display gap where valid pitch heatmap evidence could exist but be shown as unavailable.

## What this replaces
- No new metric calculation is introduced.
- Replaces the previous player-card behaviour where validated pitch trajectories were present in the report/view-model but invisible to educators.
- Replaces the renderer's legacy-only `cells` assumption for heatmaps with compatibility for the current metric runtime `normalizedCells` contract.

## Safety / evidence policy
- Trajectory rendering requires `pitchVisuals.status === DISPONIBLE`.
- Explicit finite positive `pitchLengthM` and `pitchWidthM` are mandatory; missing dimensions fail closed.
- Only finite points inside the explicit metric pitch bounds are rendered.
- Existing run boundaries are preserved; the renderer does not interpolate across gaps or segments.
- Camera-space observed heatmaps remain labelled as camera presence and are not converted into metres.
- Distance, speed and sprint publication gates are unchanged.

## Expected impact
- First defended pitch trajectory becomes directly visible on each player card, next to the already-produced heatmap and physical metrics.
- Removes a UI mismatch that could hide valid normalized metric heatmaps.
- Estimated work avoided versus a new tactical plotting subsystem: 0.25–0.5 day.
- Added runtime dependency: none.
- Added licence obligation: none beyond documenting the MIT design reference; no upstream code is redistributed.

## Validation
Non-regression tests cover:
- normalized metric heatmap rendering;
- validated trajectory visibility;
- multiple trajectory runs remaining disconnected;
- explicit 105x68 viewBox propagation;
- fail-closed behaviour when pitch dimensions are absent;
- custom pitch dimensions propagating through the metric runtime.

Status: **INTEGRATED / pending CI at authoring time**.
