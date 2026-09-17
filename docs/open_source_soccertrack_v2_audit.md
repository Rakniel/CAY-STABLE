# SoccerTrack v2 open-source audit

Date audited: 2026-09-17

## Provenance

- Project: AtomScott/SoccerTrack-v2
- Source: https://github.com/AtomScott/SoccerTrack-v2
- Audited upstream revision: `6f5c47cd3a5c38b074c44e9c98dfba48daa230d3`
- Code license: MIT, verified from upstream `LICENSE`.
- Dataset license: CC BY 4.0, verified separately from upstream `LICENSE-DATA`.
- Upstream scope: full-pitch multi-view football data/tooling for Game State Reconstruction (GSR), Ball Action Spotting (BAS), and Multi-Object Tracking (MOT). The dataset exposes per-frame metric pitch coordinates, persistent jersey-based identities/roles/teams, plus 12 ball-action classes.

## Useful reuse for CAY-STABLE

The immediate value is not another runtime tracker. CAY-STABLE already owns stricter browser-first contracts for roster identity, camera segments, calibration, coverage and `INDISPONIBLE`. SoccerTrack v2 is instead a strong offline benchmark seam for the STABLE path already being built:

1. export CAY observations into an isolated evaluation adapter;
2. compare persistent identities and pitch-metre positions against GSR annotations;
3. evaluate MOT/GSR without weakening CAY-specific bench/spectator/yellow-detail guards;
4. later evaluate ball actions against BAS only after the ball/event pipeline is mature.

The upstream repository also documents an important evaluator lesson: its August 2026 GS-HOTA fix added a ground-truth-vs-ground-truth identity test expected to score 1.0 and corrected format seams between documented and shipped annotations. CAY should copy the *testing principle*, not assume an external schema is correct: every future adapter must first prove an identity fixture and fail closed on schema/version mismatch.

## What this replaces / avoids

- Avoids inventing a synthetic-only football benchmark for persistent IDs + metric pitch positions.
- Avoids designing a bespoke event-class benchmark taxonomy before CAY's pass/shot phase.
- Provides a realistic multi-view/panoramic stress source for validating coverage and identity continuity independently from C.A. Yenne footage.

Estimated engineering avoided: **1–2 days** for benchmark/schema/evaluator design, excluding dataset download and representative C.A. Yenne annotation work.

## CAY safety boundaries

- No SoccerTrack code or dataset is copied into the browser runtime by this audit.
- Dataset attribution remains mandatory under CC BY 4.0 and is tracked separately from MIT code provenance.
- Dataset benchmark results never override CAY's fail-closed rules: invalid calibration, unknown roster identity, camera-segment mismatch, bench/spectator evidence, or insufficient coverage remain `INDISPONIBLE`.
- The 11-on-field invariant remains CAY-owned; a benchmark annotation cannot create a 12th CAY player.
- Jersey-number identity in SoccerTrack is benchmark evidence only. CAY persistent identity still requires its own roster/evidence contracts.
- External schema mismatches must fail closed; never silently coerce coordinates/timestamps.

## Expected measurable impact

When the adapter is implemented, measure at minimum:

- identity continuity / ID switches;
- valid metric-position coverage;
- pitch-position error median and p95 in metres;
- unavailable-rate split by calibration, identity and segment guard;
- false on-field CAY identities, especially bench/spectator leakage;
- later: BAS event precision/recall/F1 and temporal error for passes/shots.

No accuracy gain is claimed by this documentation-only audit.

## Status

**Studied / benchmark adapter candidate / not integrated into runtime.**

Next implementation gate: add a small CAY-to-GSR evaluation adapter only if it can remain offline/optional, preserve explicit provenance, pass an identity-fixture self-test, and introduce no mandatory heavy dependency into STABLE.
