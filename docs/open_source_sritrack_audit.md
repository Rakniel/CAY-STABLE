# SRITrack audit for CAY-STABLE

- Project: `kaoyuyukao/SRITrack`
- Upstream revision inspected: `80ca110a3e0e4874a8700fa8bd57f84cdfa2d919` (2026-04-27)
- Repository release: 2026-03-01
- License: MIT
- Status: studied / benchmark and design candidate; no SRITrack source code or weights copied into CAY-STABLE.

## Useful findings

SRITrack targets sports-broadcast multi-object tracking with long occlusions, camera motion and player re-entry. Its public README reports 85.2% HOTA on SportsMOT train+val. The implementation combines camera-motion compensation, appearance/ReID evidence, high/low confidence association and a boundary-detection filter (`ris`). It also exposes a visual-priority matching mode (`vp_dga`) intended to protect identity continuity when geometry alone is ambiguous.

## CAY-STABLE relevance

CAY already contains equivalents for several architectural ideas: confidence-cascade tracking, camera-motion compensation, conservative archived-track ReID and explicit segment/camera-cut handling. SRITrack therefore should not be copied wholesale. The highest-value next experiments are narrower:

1. benchmark its re-entry/visual-priority principle against CAY's current archived-track scoring on amateur sideline footage;
2. evaluate a conservative boundary rule only for *new identity creation*, not for continuing a known player, because CAY footage frequently pans across players near frame edges;
3. compare identity continuity with the existing TrackEval/HOTA/IDF1 benchmark contracts before changing production thresholds.

## License and dependency decision

MIT is compatible with the current reuse policy, but upstream depends on a Python/CUDA tracking stack, detector weights and a ReID model. No dependency is imported into the browser-first STABLE build until a representative C.A. Yenne benchmark demonstrates a measurable gain. If source or weights are later incorporated, their exact provenance and separate model licenses must be recorded before merge.

## Estimated value

- Prototype/evaluation work avoided: approximately 0.5–1 day because the re-entry, boundary and camera-motion hypotheses are already isolated and benchmarked upstream.
- Expected impact if validated: fewer long-occlusion ID switches and fewer new false identities from partial boundary detections.
- Main risk: sports-broadcast benchmarks do not perfectly represent amateur fixed/sideline footage; aggressive boundary filtering could incorrectly discard real players entering the frame.
