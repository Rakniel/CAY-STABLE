# TrackEval benchmark bundle adaptation

- Upstream: `JonathonLuiten/TrackEval`
- License: MIT
- Upstream role: official/reference implementation for HOTA and support for Identity (IDF1/IDP/IDR) and CLEAR MOT (MOTA/MOTP/etc.) metrics.
- CAY-STABLE status: adapter integrated; TrackEval source code is not copied and TrackEval is not a browser/runtime dependency.

## What CAY reuses

CAY-STABLE already exports tracker rows in standard MOTChallenge 10-column format. TrackEval explicitly recommends converting custom benchmarks to an implemented dataset format, with MOTChallenge as the default recommendation. `tracking_trackeval_bundle_v1.js` therefore prepares the exact benchmark file layout and `seqinfo.ini` metadata expected for a CAY validation sequence, and validates tracker/ground-truth rows before evaluation.

The adapter recommends `DO_PREPROC=false` because CAY ground truth is already intentionally filtered to the club evaluation population; TrackEval documentation notes this option for custom MOTChallenge-format datasets when distractor preprocessing is not wanted.

## What this replaces

- no home-grown HOTA implementation;
- no home-grown IDF1/MOTA implementation;
- no repeated hand-built benchmark directory layout for each CAY video;
- no changes to the production tracker based only on generic leaderboard results.

## Safety / product boundaries

- benchmark-only module; it cannot create, merge, or reassign CAY track IDs;
- no relaxation of bench/spectator/yellow-detail exclusion;
- ground-truth rows must use confidence `1` and valid positive boxes;
- filenames are restricted to safe benchmark identifiers;
- no Python, NumPy, SciPy or TrackEval dependency is added to the browser build.

## Expected gain

Estimated 0.5–1 day of benchmark plumbing avoided on the first real CAY tracker comparison, plus reuse on every later ByteTrack/BoT-SORT/ReID experiment. Expected measurable impact is methodological: tracker changes can be promoted only after CAY-specific HOTA/IDF1/MOTA results are available.

## Risk

TrackEval itself remains a separate Python evaluation environment. Dataset annotation quality is the dominant benchmark risk; metrics are only as defensible as the CAY ground truth supplied to the bundle.