# SoccerTrack v2 benchmark audit

## Source
- Project: `AtomScott/SoccerTrack-v2`
- Upstream repository: https://github.com/AtomScott/SoccerTrack-v2
- Review date: 2026-08-31
- Code license: MIT
- Dataset license: CC BY 4.0
- Capability inspected: real full-pitch football benchmark data for persistent MOT / game-state reconstruction / ball-action spotting.

## Why it is useful for CAY-STABLE
SoccerTrack v2 provides 10 full-length panoramic 4K matches with per-frame 2D pitch positions, persistent player IDs, jersey identifiers, roles and teams. It also includes 12 timestamped ball-action classes and dedicated MOT/GSR/BAS benchmark material.

This is useful primarily as an external validation target, not as a replacement product stack. CAY-STABLE already owns its tracking, identity, multi-plan, metric-coverage and publication-safety contracts. The upstream dataset can reduce the amount of real-football benchmark material and event-taxonomy scaffolding we would otherwise need to create from scratch.

## CAY-STABLE adaptation
Retain the benchmark/evaluation value while keeping the CAY runtime independent:
1. map SoccerTrack persistent IDs into the CAY tracking-evaluation adapter without changing CAY IDs;
2. compare CAY track continuity / ID switches / false tracks against upstream ground truth where camera geometry is compatible;
3. use 2D pitch coordinates to validate trajectory and metric-projection error independently of CAY UI;
4. use the BAS event schema as a reference fixture for future pass/shot/cross/free-kick event evaluation;
5. never claim equivalence between panoramic full-pitch footage and CAY broadcast/club footage; retain a separate representative-CAY-video benchmark;
6. keep dataset attribution/citation metadata with every local benchmark fixture derived from SoccerTrack v2.

## License decision
**Studied / benchmark candidate accepted / no runtime dependency or dataset copied in this change.**

The upstream repository states that its code is MIT and the dataset is CC BY 4.0. Both permit commercial use, but CC BY 4.0 requires attribution. Any later downloaded dataset/video/annotation asset must retain the upstream attribution and license notice in CAY benchmark documentation.

No SoccerTrack v2 code, model weights, videos or annotations are copied by this audit.

## What this replaces / work avoided
This can replace part of the manual creation of real-football tracking ground truth and the initial event-label taxonomy/evaluation fixture design.

Estimated work avoided: **1–2 days** of benchmark/test-fixture design, plus substantially more manual annotation time if a compatible subset is later adopted for offline validation.

Expected measurable impact after benchmark integration:
- objective ID-switch / continuity measurement on real football data;
- independent trajectory/pitch-coordinate error checks;
- clearer separation between synthetic pass/fail tests and real-football performance;
- reusable event labels for later ball-action validation without inventing a proprietary taxonomy first.

## Risks / dependencies
- SoccerTrack v2 uses panoramic full-pitch multi-view footage; CAY footage may include broadcast pans, zooms, cuts and partial coverage, so results are not directly transferable.
- Dataset assets are CC BY 4.0 and require attribution; code being MIT does not change the dataset license.
- Models/checkpoints referenced by upstream baselines require their own license audit before reuse.
- The dataset must never be used to weaken CAY's `INDISPONIBLE` policy or infer metrics through unobserved footage.
- Any benchmark integration should run offline/dev-side first; it is not a production runtime dependency.

## Promotion criteria
Before importing any SoccerTrack v2 benchmark asset:
- record exact dataset version/revision and attribution;
- keep the benchmark optional and outside production bundles;
- add deterministic adapter tests for persistent IDs, pitch coordinates and missing frames;
- report ID switches, false positives, missed observations and trajectory error before/after candidate tracking changes;
- retain a separate CAY representative-video acceptance suite.

## Provenance
- Source: `AtomScott/SoccerTrack-v2`
- Function/idea adapted: real-football MOT/GSR/BAS benchmark and event-schema reference
- License: MIT code / CC BY 4.0 dataset
- Local modification: clean-room benchmark integration plan only
- Runtime dependency added: none
- External code/data copied: none
- Status: **studied / benchmark candidate accepted**
