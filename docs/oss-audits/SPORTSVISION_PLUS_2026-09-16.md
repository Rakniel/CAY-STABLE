# OSS audit — SportsVision+

Date: 2026-09-16

## Source

- Project: `Aaryan2304/sportsvision-plus`
- Repository: https://github.com/Aaryan2304/sportsvision-plus
- Upstream repository license: Apache-2.0 (verified from upstream `LICENSE` / GitHub license metadata at audit time).
- Scope reviewed: documented pipeline for player/ball/referee/goalkeeper detection, ByteTrack tracking, team-colour assignment, homography/radar projection and ball anti-teleport/interpolation.

## Useful ideas for CAY-STABLE

SportsVision+ keeps the football pipeline explicitly staged as detection -> tracking -> team classification -> homography -> tactical visualisation. Its ball tracker also separates anti-teleport smoothing/interpolation from player tracking. This reinforces CAY-STABLE's existing contract-first separation and gives a compact external reference for testing the future ball stage without coupling it to the already-prioritised player metric pipeline.

No upstream code is copied by this audit. CAY-STABLE keeps its existing modules and fail-closed `INDISPONIBLE` semantics.

## License / dependency boundary

The Apache-2.0 repository license is **not** treated as automatically covering external models, weights, datasets or dependencies. The documented stack includes Ultralytics YOLO11, Roboflow-hosted pitch inference, Supervision and SoccerNet data. Those components have their own terms and must be audited independently before any runtime, weight or dataset is introduced into CAY-STABLE.

In particular, this audit does not approve Ultralytics model/code redistribution, Roboflow hosted-model usage, SoccerNet media/data redistribution, or any downloaded checkpoint. CAY-STABLE must keep model/runtime provenance separate from repository-code provenance.

## CAY decision

Status: **studied / architecture benchmark retained / runtime not integrated**.

What it replaces: no CAY runtime module. It replaces part of the design/benchmark exploration for the later ball stage and documents a legal boundary that prevents accidental transitive import.

Estimated work avoided: **0.5–1 day** of pipeline/benchmark exploration.

Expected measurable impact when the ball stage starts:

- ball teleport rejection measured per 10 min;
- interpolation coverage reported separately from observed-ball coverage;
- no interpolated ball state across a cut or calibration-plan change;
- player metrics remain publishable independently when ball metrics are `INDISPONIBLE`;
- no external model/weight enters the runtime without a separate provenance + license record.

## Risks

- Repository-level Apache-2.0 does not grant rights to third-party weights, hosted models or datasets.
- Naive ball interpolation can create fictitious possession/passes during occlusion, aerial play or cuts.
- Team colour clustering alone is insufficient for CAY identity because yellow details, opponents, referees, bench and spectators must remain hard negatives.

## Modification record

CAY modification: documentation/benchmark criteria only; **0 lines of upstream runtime code copied** and **0 external dependencies added**.
