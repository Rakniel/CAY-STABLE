# OSS audit — cyyyp100/Football_Analytics ball-carrier / possession pattern (2026-09-16)

## Provenance and legal boundary

- Upstream: `cyyyp100/Football_Analytics`
- Evaluated revision: `41460b3d1867b1c7f567afa97becef53ba7b1496`
- Upstream code license: MIT, copyright 2026 Cyprien Vial.
- Tracking data used by the upstream project is explicitly not redistributed by that repository and is not covered by its code license.
- CAY-STABLE copies **no upstream source code, model, weight, dataset, media, or configuration** in this change.

## Useful idea

The upstream pipeline has a compact separation that is useful as an independent reference for CAY's later possession stage:

1. infer a ball carrier from pitch-coordinate player/ball proximity;
2. optionally require a minimum continuous hold before accepting control;
3. derive team possession from accepted carrier intervals;
4. derive possession sequences only after carrier evidence exists.

The useful part for CAY is the **ordering**, not the upstream implementation. It reinforces that possession must be downstream of validated ball/player pitch coordinates and persistent roster identity, rather than being inferred directly from raw detections or team colour.

## CAY adaptation — stricter than upstream

CAY-STABLE must remain fail-closed. We must **not** adopt unconditional forward/back filling across unknown carrier intervals. An interval may be published as possession only when all required evidence is valid:

- active calibration/segment is valid for ball and player samples;
- ball continuity is sufficient;
- candidate player is an on-pitch roster identity, never bench/spectator/referee;
- ball-player association passes the existing drift/ownership evidence gates;
- a minimum stable-control interval is met;
- plan/cut boundaries reset carry-over state;
- ambiguity or missing evidence yields `INDISPONIBLE`, not inherited possession.

This should extend the existing `ball_candidate_continuity_v1`, `ball_player_drift_guard_v1`, `ball_roster_ownership_bridge_v1`, `ball_kick_evidence_v1`, `ball_event_evidence_bridge_v1`, and `ball_event_state_v1` contracts rather than creating a second possession pipeline.

## Expected work avoided

Estimated design/benchmark work avoided: **0.5–1 day**. The upstream project provides an independent sanity check for the carrier → possession → sequence decomposition, while CAY keeps its stronger evidence and publication rules.

## Required C.A. Yenne benchmark before runtime integration

Measure on representative CAY footage, including pans, cuts, occlusion, bench/spectators and yellow details:

- carrier precision/recall on manually checked control intervals;
- false carrier assignments per 10 minutes;
- false CAY ownership assignments per 10 minutes;
- possession precision/recall and absolute possession-share error;
- unknown/`INDISPONIBLE` coverage percentage;
- possession state leakage across cuts or calibration-plan boundaries (target: zero);
- latency to confirm a new carrier after a real control/change of possession;
- effect of minimum-hold threshold on false touches vs retained coverage.

A future integration is accepted only if it improves possession accuracy without reducing the explicit coverage/unknown semantics or weakening existing CAY identity/calibration guards.

## Risks / dependencies

- Nearest-player proximity alone is insufficient for aerial balls, tackles, deflections and occlusion.
- Carrying possession through unknown intervals can create convincing but undefendable statistics; CAY explicitly rejects that behavior.
- Upstream data rights are separate from the MIT code license.
- Any future model or dependency considered from the upstream environment requires its own license audit.

## Status

**Studied / design pattern adapted / runtime integration deferred.** No runtime or dependency change in this audit.