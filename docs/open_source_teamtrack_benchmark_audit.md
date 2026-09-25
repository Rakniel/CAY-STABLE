# TeamTrack benchmark audit

Audit date: 2026-09-26

## Provenance

- Project: AtomScott/TeamTrack
- Source: https://github.com/AtomScott/TeamTrack
- Audited revision: `748a77db7d631818b9736d3af456e65346c466e5`
- Repository code license: MIT, verified from the upstream `LICENSE` file.
- External evaluation submodule declared by upstream: `JonathonLuiten/TrackEval`; it remains a separately auditable dependency and is not imported by this audit.

## Useful scope for CAY-STABLE

TeamTrack is unusually relevant to CAY because its benchmark is built around full-pitch team-sport footage rather than generic pedestrian MOT. The upstream README documents soccer, basketball and handball sequences at 4K–8K resolution, more than four million annotated bounding boxes with unique IDs, MOTChallenge-formatted ground truth compatible with TrackEval, and a separate trajectory representation projected to pitch coordinates. It also provides both side and top soccer views for tracking data; the trajectory package is limited to fixed side-view footage.

This can complement SoccerTrack/SoccerNet rather than replace them. CAY can use the MOT-format soccer subset to stress persistent player identity, re-entry, dense same-kit association and long trajectories, then keep CAY-specific invariants as a separate mandatory acceptance layer.

## License boundary

The repository's source code is MIT. This audit does **not** assume that the repository MIT file automatically grants redistribution rights over every downloadable match video, annotation package, Kaggle/Drive asset, model weight or third-party submodule. Dataset/media terms must be verified at the actual distribution source before downloading, redistributing, vendoring or shipping any TeamTrack data with CAY-STABLE.

Therefore no TeamTrack code, video, annotation, model, TrackEval submodule or generated asset is incorporated by this commit.

## Proposed benchmark adapter

If dataset terms are independently verified, reuse the existing CAY MOT export/evaluation boundary rather than writing a TeamTrack-specific tracker:

1. Select only soccer sequences and preserve the upstream train/val/test split.
2. Feed identical detections/frames to current CAY tracking and each permissive external backend candidate.
3. Evaluate MOT output with the already-audited TrackEval/sn-trackeval route for HOTA, DetA, AssA, LocA and IDF1.
4. Separately score CAY acceptance invariants: false CAY identities from yellow details, bench/spectator contamination, >11 simultaneous on-field CAY players, cut/plan leakage, re-entry identity breaks and explicit coverage.
5. For trajectory data, compare only intervals whose geometry is independently validated; never convert missing calibration into guessed metres.
6. A generic MOT gain cannot promote a backend if any CAY safety/identity invariant materially regresses.

## What this avoids

This avoids inventing a bespoke sports-MOT corpus and annotation format and gives the existing CAY tracker bake-off a second sports-specific stress domain. Estimated engineering/annotation work avoided if dataset rights are acceptable: roughly 2–5 days, excluding dataset download and compute time.

## Expected measurable impact

- Better evidence for ID persistence and re-entry than synthetic-only tests.
- Direct HOTA/IDF1 comparison on soccer full-pitch sequences.
- Additional long-trajectory evidence for future smoothing/coverage checks.
- No claimed runtime accuracy improvement until CAY and candidate backends are actually run on the same sequences.

## Status

**Studied / benchmark candidate accepted conditionally / no runtime integration.**

Blocking condition before data use: verify the exact dataset/media terms at the selected TeamTrack distribution source and record them in this file. Repository MIT alone is not treated as sufficient evidence for the downloadable footage/data assets.
