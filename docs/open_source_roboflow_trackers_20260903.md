# Roboflow Trackers audit — 2026-09-03

## Source
- Project: `roboflow/trackers`
- URL: https://github.com/roboflow/trackers
- Branch inspected: `develop`
- License: Apache-2.0
- Runtime requirement upstream: Python >= 3.10

## Useful evidence
The upstream project publishes clean-room tracker implementations and benchmark results on MOT17, SportsMOT, SoccerNet and DanceTrack. On the published SoccerNet table, ByteTrack reaches HOTA 84.0 and BoT-SORT 84.5 with default parameters. BoT-SORT includes camera-motion compensation. The project also documents a heavier McByte option using propagated segmentation masks, with SoccerNet HOTA 85.0, but that path adds Torch/SAM/Cutie-class dependencies.

## CAY-STABLE decision
- Status: studied / benchmark reference; no upstream source code copied in this change.
- ByteTrack/BoT-SORT remain priority backend candidates for a future measurable A/B benchmark against the current browser tracker.
- No Python backend is introduced merely to gain a tracker name. Adoption requires representative C.A. Yenne footage to demonstrate fewer ID switches / higher observed coverage without weakening the 11-player, bench/spectator and CAY-identity guards.
- Heavy mask-conditioned McByte is not integrated at this stage because its dependency cost is disproportionate to the immediate STABLE test-build objective.

## Concrete work avoided
The published SoccerNet comparison prevents spending time re-implementing and tuning multiple tracker families blindly. It narrows the next benchmark to ByteTrack vs BoT-SORT first, with McByte only if lightweight tracking plateaus.

Estimated engineering time avoided: 0.5–1 day of tracker-family prototyping and parameter guesswork before real-video benchmarking.

## Risks / dependencies
- Upstream package is Python-first; CAY-STABLE is currently browser-first.
- Published benchmark numbers do not guarantee the same result on amateur touchline footage.
- Detector quality, camera cuts, benches/spectators and CAY kit evidence remain dominant constraints.
- Any future copied/adapted upstream code must preserve Apache-2.0 notices and provenance.
