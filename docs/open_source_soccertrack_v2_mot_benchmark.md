# SoccerTrack v2 MOT benchmark reference

- Project: SoccerTrack v2
- Source: https://github.com/AtomScott/SoccerTrack-v2
- Upstream status inspected: public repository, 2026-08-28
- Code license: MIT
- Dataset license: CC BY 4.0
- CAY-STABLE status: design/evaluation reference adapted; no upstream source code or dataset files copied into this repository.

## Useful upstream idea

SoccerTrack v2 exposes persistent-player multi-object tracking as a first-class evaluation task on football footage. CAY-STABLE adopts the same evaluation discipline: tracking changes must be measured on labelled football clips for observation coverage, identity continuity, ID switches and fragmentation rather than judged only from visual impression.

## Local adaptation

`tracking_benchmark_v1.js` is a lightweight browser/Node-compatible evaluator written specifically for CAY-STABLE. It consumes a small neutral row contract (`frame`, `gtId`, `trackId`, `visible`, `matched`) and reports:

- observed tracking coverage;
- identity continuity;
- ID-switch count;
- fragmentation count;
- ground-truth player count and produced track-ID count.

`compare(before, after)` makes before/after tracker changes measurable before they are promoted to STABLE.

## Why adapt instead of importing

The upstream dataset and loaders are valuable for external benchmarking, but making their Python stack or dataset mandatory would slow the current browser-first club build. The CAY evaluator keeps zero runtime dependency while allowing future SoccerTrack-labelled clips to be converted into the neutral contract.

## Safety / scope

This evaluator does not change player identity, merge tracks, infer hidden positions or manufacture statistics. It is test tooling only. Representative C.A. Yenne footage remains the final acceptance gate for tracking improvements.

## Expected gain

Avoids roughly 1-2 days of bespoke benchmark design and gives every future ByteTrack/BoT-SORT/ReID/camera-motion change a consistent measurable before/after gate. No runtime dependency added.
