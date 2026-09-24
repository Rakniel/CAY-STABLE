# SRITrack audit for CAY-STABLE

Audit date: 2026-09-24

- Project: `kaoyuyukao/SRITrack`
- Source: https://github.com/kaoyuyukao/SRITrack
- Upstream revision inspected: `80ca110a3e0e4874a8700fa8bd57f84cdfa2d919` (2026-04-27)
- Repository release: 2026-03-01
- License: MIT (`LICENSE` in the upstream repository)
- Status: studied / external benchmark and design candidate; no SRITrack source code, model weights or dataset copied into CAY-STABLE.

## Useful findings

SRITrack targets sports-broadcast multi-object tracking with long occlusions, camera motion and player re-entry. Its public README reports **85.2 HOTA on SportsMOT train+val** under its online protocol. This is an upstream result only and must never be presented as CAY-STABLE accuracy.

The implementation combines appearance/ReID evidence, high/low-confidence association, camera-motion-aware tracking and a boundary-oriented filter (`ris`). It also exposes a visual-priority matching mode (`vp_dga`) intended to protect identity continuity when geometry alone is ambiguous.

The most useful architecture pattern for CAY is detector/tracker separation: SRITrack can consume public/precomputed detections. CAY already exports MOT/TrackEval-compatible tracking artifacts, so a future external benchmark can compare association/re-entry behavior on the same detections instead of changing detector and tracker simultaneously.

## CAY-STABLE relevance

CAY already contains equivalents for several architectural ideas: confidence-cascade tracking, camera-motion evidence, conservative archived-track ReID, MOTChallenge/TrackEval export and explicit segment/camera-cut handling. SRITrack therefore must **not** be copied wholesale.

Highest-value experiments are narrower:

1. benchmark its re-entry/visual-priority principle against CAY's current archived-track scoring on amateur sideline footage;
2. evaluate a conservative boundary rule only for **new identity creation**, not for continuing a known player, because CAY footage frequently pans across players near frame edges;
3. compare HOTA/IDF1 plus CAY-specific re-entry errors before changing production thresholds;
4. run the comparison from identical detections whenever possible so detector quality cannot hide an association regression.

## License and dependency boundary

The repository code is MIT, which is compatible with CAY's current permissive reuse policy. That does **not** automatically clear external assets referenced by the project.

Upstream references:

- SportsMOT / YOLOX detector checkpoints;
- a separately downloaded ReID checkpoint;
- SportsMOT data/evaluation material;
- Python/CUDA/PyTorch-style runtime dependencies.

Every checkpoint and dataset must receive its own provenance/license audit before CAY downloads, redistributes or embeds it. Repository MIT status is not treated as a blanket model/data license.

No SRITrack model weight is vendored by CAY-STABLE. No SRITrack Python source is copied into the browser-first STABLE runtime.

## What this avoids/replaces

This avoids writing another tracker solely to experiment with re-entry identity. CAY can keep its existing runtime and compare its MOT/TrackEval exports against SRITrack externally on the same detections/sequences.

Estimated bespoke prototype work avoided: **3–6 engineering days** if SRITrack is used as an external oracle/benchmark rather than reimplementing a second tracker. This is a planning estimate, not a measured runtime gain.

## Acceptance gates before deeper integration

A SRITrack-derived idea or optional backend is acceptable only if representative C.A. Yenne clips show a measurable improvement without regression in:

- long-occlusion/re-entry ID switches;
- false CAY assignments, especially yellow-detail false positives;
- bench/spectator exclusion;
- the maximum-11-on-field invariant;
- camera-cut and multi-plan isolation;
- manual identity overrides and locked identities;
- processing/setup cost sufficient to threaten the sub-20-minute club workflow target.

TrackEval/HOTA/IDF1 must be reported alongside CAY-specific false-identity and re-entry cases. ReID remains secondary evidence: ambiguous evidence must stay manual-review/`INDISPONIBLE`, never silently auto-merge two roster identities.

## Modifications in CAY-STABLE

This revision strengthens provenance, dependency boundaries and measurable acceptance gates only. It imports **no runtime logic, model, checkpoint, dataset or upstream source code**.
