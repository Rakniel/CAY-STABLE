# Open-source audit — SoccerTrack v2 GSR export contract

## Source
- Project: AtomScott/SoccerTrack-v2
- Upstream revision inspected: main tree as reviewed on 2026-09-01; repository code license verified from `LICENSE`.
- Code license: MIT.
- Dataset license: separate from code; no dataset files are copied or bundled by CAY-STABLE.
- Relevant upstream concept: the GSR task represents per-frame tracked entities with persistent track identity, role, team side, jersey number when known, and 2D pitch coordinates in metres. Evaluation is designed to punish incorrect identity/attribute association strongly.

## CAY-STABLE adaptation
- File: `soccernet_gsr_export_v1.js`.
- Implementation method: clean-room adaptation of the public data-contract idea. No SoccerTrack source code was copied.
- No SoccerNet `sn-gamestate` implementation is imported. That upstream baseline repository is GPL-3.0 and is intentionally kept outside the CAY-STABLE runtime/license boundary.
- No external model, weight, Python dependency, scorer, or dataset is bundled.

## What it replaces
A bespoke one-off conversion script for every future GSR/MOT benchmark. CAY-STABLE now has one strict export boundary for validated metric tracking rows.

## CAY-specific guards
- Metric pitch coordinates must be explicitly validated by default.
- Player identity must be `FIABLE` by default.
- Unknown jersey numbers remain `null`; they are never guessed.
- Referee/other team and jersey attributes remain `null`.
- A frame containing more than 11 simultaneous CAY players is rejected rather than silently truncated.
- Rejection reasons and frame/player coverage are reported explicitly.

## Expected impact
- Makes the current tracking + homography output directly comparable against GSR-style benchmark data.
- Reduces benchmark plumbing and makes before/after changes measurable without weakening production rules.
- Expected engineering work avoided: roughly 0.5–1 day for future benchmark/export plumbing.

## Risks / dependencies
- The flat SoccerTrack v2 documentation and the large as-shipped production files are not structurally identical in every release. CAY therefore treats this module as a stable internal flat export contract, not as a promise that every external scorer can ingest it without a thin adapter.
- Official SoccerNet GS-HOTA tooling remains an external evaluation dependency if/when run. GPL code must not be copied into the CAY-STABLE runtime unless the project explicitly accepts the resulting license obligations.

## Status
Integrated on feature branch with dedicated non-regression tests. Promotion to `main` requires the full CAY-STABLE CI to pass.