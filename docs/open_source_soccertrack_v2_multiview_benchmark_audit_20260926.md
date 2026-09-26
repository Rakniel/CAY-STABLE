# SoccerTrack v2 — multi-view benchmark and licence audit

Date: 2026-09-26

## Source and provenance

- Project: `AtomScott/SoccerTrack-v2`
- Upstream: https://github.com/AtomScott/SoccerTrack-v2
- Audited default branch: `main`
- Repository observed pushed: 2026-09-24
- Purpose upstream: full-pitch multi-view football dataset/toolkit for Game State Reconstruction (GSR), Ball Action Spotting (BAS), and Multi-Object Tracking (MOT).

## Licence boundary

- Repository source code: MIT. The upstream `LICENSE` explicitly scopes MIT to source code including `src/`, scripts, notebooks, configs and docs.
- Dataset: CC BY 4.0 under separate `LICENSE-DATA`; this includes panoramic videos and GSR/BAS/MOT annotations distributed separately.
- No upstream code, video, annotation, checkpoint or model is copied into CAY-STABLE by this audit.
- Any future use of the dataset must retain attribution, link the CC BY 4.0 licence, and indicate changes. Model/checkpoint licences remain separate and must be audited if introduced.

## Useful capability found

SoccerTrack v2 provides a unusually useful football-specific evaluation target for CAY-STABLE because its annotations join, per frame:

- 2D pitch coordinates,
- persistent jersey-based player identities,
- roles and teams,
- multi-view/full-pitch footage,
- MOT ground truth,
- 12 ball-action classes: Pass, Drive, Header, High Pass, Out, Cross, Throw In, Shot, Ball Player Block, Player Successful Tackle, Free Kick, Goal.

The upstream release describes 10 full-length panoramic 4K matches. This makes it useful as an *external benchmark contract* spanning several CAY subsystems rather than as another runtime pipeline.

## CAY-STABLE adaptation decision

Status: **benchmark methodology accepted; runtime not integrated**.

CAY already has dedicated runtime components for calibration, tracking/ReID, trajectory/heatmap publication, physical metrics and ball-event evidence. Replacing them with another monolithic pipeline would duplicate logic and weaken CAY's fail-closed publication rules.

Instead, future benchmark fixtures/adapters should be able to map CAY evidence into a SoccerTrack-v2-like evaluation tuple:

`frame -> segment/view -> player identity -> role/team -> pitch (x,y) -> ball action`

This should be used to evaluate end-to-end consistency across tracker + ReID + calibration, not just bounding-box overlap. Promotion remains subject to existing CAY vetoes: zero false CAY caused by yellow details, bench/spectator exclusion, <=11 simultaneous CAY players, unsafe cross-segment carry-over, explicit coverage and calibration evidence.

For ball events, the 12-class BAS taxonomy is useful as an external coverage checklist. CAY must still publish only events for which its own evidence contract is defensible; unsupported classes remain `INDISPONIBLE`, never inferred merely to match the taxonomy.

## Expected impact

- Avoided work: approximately 2–4 engineering days designing a football-specific multi-view end-to-end benchmark schema from scratch.
- Expected measurable benefit: future tracker/ReID/calibration candidates can be scored on persistent identity **and** pitch-position correctness across views, while ball-event coverage can be measured against a stable football taxonomy.
- No runtime accuracy/speed gain is claimed by this documentation-only change.

## Risks / dependencies

- Dataset size is substantial (full-length panoramic 4K video); it should remain an optional/offline benchmark, not a mandatory CAY runtime dependency.
- CC BY 4.0 attribution obligations apply if dataset material is redistributed or adapted.
- SoccerTrack v2 is panoramic/full-pitch and will not perfectly reproduce C.A. Yenne broadcast/handheld camera cuts; CAY's own multi-plan and re-entry regression corpus remains mandatory.
- Upstream benchmark performance must never be reported as CAY performance without running CAY against the same evaluation material.

## Modification record

This CAY change contains documentation and an independently described benchmark mapping only. No upstream implementation, dataset sample, annotation, weight or binary was copied or modified.
