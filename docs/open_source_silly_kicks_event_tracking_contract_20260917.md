# OSS audit — silly-kicks event/tracking contract (2026-09-17)

## Source and licence

- Project: `karsten-s-nielsen/silly-kicks`
- Upstream purpose: maintained socceraction successor for SPADL event conversion, tracking/event analytics and action valuation.
- Audited release: PyPI `silly-kicks 4.110.0` (released 2026-09-06); PyPI declares SPDX `MIT` and Production/Stable.
- Repository licence: GitHub reports SPDX `MIT`.
- Repository state observed 2026-09-17; no upstream source is copied by this note.

## Useful reusable idea

The useful part for CAY-STABLE is not VAEP scoring. It is the explicit separation between a normalized football **event/action schema** and a parallel **tracking schema**, with adapters at the boundary. This is a mature way to prevent provider- or detector-specific fields from leaking into downstream football metrics.

CAY-STABLE already has `football_event_contract_v1.js`, `ball_event_evidence_bridge_v1.js`, `soccernet_gsr_export_v1.js`, `soccertrack_bas_adapter_v1.js` and canonical metric/tracking artifacts. Therefore importing the Python package into the browser/runtime would duplicate architecture and add unnecessary Python/pandas dependencies.

Adapt the design instead:

1. Keep raw ball/player evidence separate from published football events.
2. Require every event to carry normalized type, video timestamp, segment/plan provenance, actor/team identity when defensible, spatial evidence when defensible, confidence/evidence status, and an explicit unavailable/rejected reason otherwise.
3. Keep adapters one-way at the boundary (CAY canonical contract -> benchmark/export format), never let an external schema become the runtime source of truth.
4. Preserve CAY's stricter publication rule: ambiguous identity, missing calibration, plan transition, non-live interval or insufficient ball evidence => `INDISPONIBLE`, not an inferred pass/shot/possession value.
5. Use normalized event artifacts later for independent SoccerNet/SoccerTrack/SPADL benchmark comparison without changing the detector/tracker runtime.

## What this replaces / avoids

This avoids inventing a second event representation for passes, possession and shots and avoids bespoke conversion logic per benchmark/provider. Existing CAY contracts are extended rather than duplicated.

Estimated engineering avoided: **0.5–1.0 day** for schema design and later benchmark/export plumbing.

Expected measurable impact:

- 100% of published ball events have timestamp + segment/plan provenance;
- 0 events cross an invalid plan boundary;
- 0 provider-specific field assumptions inside the canonical runtime contract;
- benchmark adapters can be tested for round-trip/identity invariants independently;
- unsupported evidence remains `INDISPONIBLE` rather than silently coerced.

## Integration status

**Studied / architecture adapted / runtime import rejected as unnecessary.**

No upstream code, model, weights, dataset or dependency is imported. If direct package reuse is reconsidered, pin the exact version and preserve MIT attribution/notice requirements; optional extras and their transitive licences must be audited separately.

## Risk / dependency notes

- The project evolves rapidly, so any future direct integration must pin a release rather than follow `main`.
- Python >=3.10 and pandas-oriented data flows are not justified for the current CAY browser-first STABLE runtime.
- VAEP/xGBoost/CatBoost/other optional extras are out of scope and must not be pulled transitively without a separate licence and runtime audit.
