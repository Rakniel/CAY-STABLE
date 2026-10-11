# OSS audit — SoccerTrack v2 (2026-10-11)

- Project: AtomScott/SoccerTrack-v2 — https://github.com/AtomScott/SoccerTrack-v2
- Revision inspected: `a752d294df2a0e816e827b70f284980698f5a50e` (main); no release version claimed.
- Code license: MIT (upstream LICENSE). Dataset license: CC BY 4.0 (upstream LICENSE-DATA), with attribution, license link and indication of changes required.
- Scope: 10 amateur panoramic 4K matches (~900 minutes); GSR player IDs, team/role/jersey, metric pitch coordinates; MOTChallenge labels; BAS timestamps for 12 football actions.
- Status: STUDIED — no source, video, annotations, model weights or dependencies imported into CAY-STABLE.
- Reuse candidate: benchmark fixture and format adapter for existing CAY MOTChallenge / TrackEval export, pitch-coordinate coverage and ball-event evidence contracts; extend those existing contracts, do not build a duplicate tracking pipeline.
- What it could replace: manually constructing a large multi-plan football ground-truth set for initial automated benchmarking. Estimated 2–5 days of fixture preparation avoided if a compatible licensed subset is available; not measured.
- Expected measurable impact: compare HOTA/IDF1/ID switches, pitch-coordinate error in metres, unavailable-rate under missing calibration, and event precision/recall against annotated sequences. No improvement asserted without experiments.
- Risks: 4K storage and compute, panorama domain shift vs C.A. Yenne cameras, mapping between team-side and CAY roster, exact video/data distribution terms and privacy review. Do not publish dataset footage in the club UI. No false CAY classification from colour details.
- Before integration: pin a dataset revision/checksum; retain attribution and original license; run a held-out benchmark; ensure licensing for any external pretrained weights separately.

## Other candidates assessed
- SportsLabKit (https://github.com/AtomScott/SportsLabKit): GPL-3.0; useful MOT and pitch calibration reference, **not imported** into CAY proprietary-compatible runtime without an accepted GPL compliance plan.
- OpenSportsLib (https://github.com/OpenSportsLab/opensportslib): AGPL-3.0 / commercial dual licensing; useful football event spotting reference, **not imported** without legal approval and explicit deployment obligations.

This audit adds no runtime dependency and changes no application logic.
