# SoccerTrack v2 open-source audit

- Project: `AtomScott/SoccerTrack-v2`
- Audited revision: `6f5c47cd3a5c38b074c44e9c98dfba48daa230d3` (2026-08-11)
- Source-code license: MIT.
- Dataset license: CC BY 4.0 (`LICENSE-DATA`).
- CAY-STABLE status: studied as a benchmark/data-format reference; no SoccerTrack v2 code, dataset assets, model weights, or annotations are copied into CAY-STABLE by this audit.

## Useful scope

SoccerTrack v2 provides a current full-pitch, multi-view football benchmark covering persistent multi-object tracking (MOT), game-state reconstruction (GSR) and ball-action spotting (BAS). Its runnable evaluators and public annotation formats make it a useful external reference for measuring CAY tracking continuity and event quality instead of inventing a private metric from scratch.

## What CAY should reuse

Reuse the *evaluation contract and benchmark methodology* rather than importing a tracking stack into the browser build. CAY can later export a benchmark adapter from its existing persistent-track / roster / event artifacts into a SoccerTrack-compatible evaluation representation. This can quantify ID continuity and event quality while leaving CAY's 11-on-field, participation, yellow-detail, bench/spectator and fail-closed publication guards intact.

No local tracking logic is replaced by this audit. The likely work avoided is roughly 1–2 days of designing and validating bespoke MOT/GSR/BAS scoring conventions once representative benchmark work begins.

## License boundary / risks

The repository source is MIT and the dataset is CC BY 4.0 with attribution requirements. Individual optional backends and model dependencies still keep their own licenses: the repository includes a BoxMOT backend, while current BoxMOT licensing is not treated as permissive by CAY-STABLE. Therefore CAY must not infer that every third-party dependency transitively used by SoccerTrack v2 is MIT.

The dataset is not needed for the immediate STABLE browser runtime and should not become a mandatory download. Any future use of the dataset must preserve CC BY 4.0 attribution and document the exact dataset version/split.

## Modification record

2026-09-15: documentation-only audit added. No upstream source code modified or incorporated. Candidate future adaptation is limited to an exporter/evaluator bridge and benchmark methodology, subject to representative C.A. Yenne and/or licensed benchmark validation.
