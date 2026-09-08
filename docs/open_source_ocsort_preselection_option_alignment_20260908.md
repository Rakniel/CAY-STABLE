# OC-SORT direction cue — overflow preselection alignment (2026-09-08)

## Provenance / licence
- Project: **OC-SORT — Observation-Centric SORT**
- Official repository: https://github.com/noahcao/OC_SORT
- Upstream revision already audited by CAY: `8462e7e729a93ccd3bd995c0a79a890336cb3a0b` (2026-04-21)
- License: **MIT**
- Existing CAY audit: `docs/open_source_ocsort_direction_consistency_20260906.md`

No OC-SORT source code, weights, Kalman implementation or dependency is copied or vendored here. This change only fixes propagation of options inside CAY's own clean-room JavaScript adaptation.

## Existing CAY logic inspected first
`tracking_core_v1.js` already owns the canonical `matchCost(track, detection, time, opts)` and its optional direction-consistency penalty. `tracking_two_stage_adapter_v1.js` already delegates overflow candidate scoring to that canonical function rather than reimplementing association cost.

The defect was narrower: during overflow preselection (`detections > maxPlayers`), the adapter called `matchCost` without `opts`. Consequently optional canonical evidence such as direction consistency and configurable appearance-gallery behavior could affect final association but not the earlier candidate preselection.

## Modification
`tracking_two_stage_adapter_v1.js` now calls:

`coreMatchCost(track, detection, time, opts)`

instead of omitting the options object.

No threshold, default, runtime flag, 11-player cap, ReID policy or category rule changes. Direction consistency remains opt-in exactly as before.

## Non-regression
`tests/tracking_preselection_core_cost_nonregression.js` now adds an overflow case with two spatially symmetric candidates. With the existing optional direction cue enabled, the reverse-motion candidate receives the canonical penalty and the forward-motion candidate survives preselection.

This checks that overflow preselection and final association consume the same evidence configuration. It does not claim real-video accuracy improvement.

## What this replaces / work avoided
This removes a divergent preselection behavior instead of adding another overflow-association heuristic or separate tracker stage. Estimated avoided work: roughly **0.25 day** of duplicate tuning/debugging and future per-option plumbing.

## Expected measurable impact
On crowded frames where candidate count exceeds the CAY simultaneous-player cap, optional association evidence can no longer be silently dropped before final matching. Expected effect, pending representative C.A. Yenne benchmark: fewer preventable identity/candidate-selection errors in overflow/crossing situations. Measurement remains through the existing same-sequence TrackEval gate (AssA, IDF1, HOTA/DetA) and false-CAY checks.

## Status / risks
**Integrated on validation branch; production promotion only after CAY syntax + STABLE integration/non-regression + calibration V2 checks are green.**

Risks are unchanged from the original OC-SORT direction adaptation: genuine sharp turns and weak camera-motion compensation can make image-space direction misleading. Mitigations remain opt-in behavior, bounded penalty, minimum-motion guard, segment resets and benchmark gating.
