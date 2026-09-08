# OSS audit — SoccerNet Game State Reconstruction / TrackLab — 2026-09-08

## Sources inspected

### SoccerNet Game State Reconstruction
- Project: `SoccerNet/sn-gamestate`
- Revision inspected: `1c958345067218297d221e45e1a6405f975f83e0`
- Revision date: 2026-05-02
- License file: GNU GPL v3
- Current README note at the inspected revision: TrackLab 1.3.24 is the referenced framework version for the GS-HOTA evaluation fix.

### TrackLab
- Project: `TrackingLaboratory/tracklab`
- Version: `1.3.24`
- Revision inspected: `5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2`
- Revision date: 2026-05-01
- License: MIT

## Technical relevance to CAY-STABLE

The SoccerNet Game State Reconstruction stack is a strong architecture/benchmark reference for the exact family of problems targeted by CAY-STABLE: player/goalkeeper/referee detection, tracking, ReID, team/role identification, pitch calibration/localisation and game-state reconstruction on a minimap. Its current baseline is built around TrackLab, whose modular producer/consumer architecture remains directly relevant to CAY's external tracking and ReID artifact contracts.

## Legal boundary

`SoccerNet/sn-gamestate` itself is GPL-3.0. Under the current CAY-STABLE permissive-reuse policy, its source code is therefore **not copied, vendored, translated, merged or adapted into CAY-STABLE**. It may be used as a public architecture, benchmark and evaluation reference only unless the project owner explicitly accepts GPL obligations for a future isolated component.

TrackLab 1.3.24 is MIT. CAY may continue to interoperate with TrackLab-shaped artifacts and may adapt permissively licensed interface ideas, provided any copied substantial code retains required MIT notices. Existing CAY-STABLE work deliberately uses clean-room artifact contracts rather than vendoring TrackLab source.

Repository licenses do **not** automatically license datasets, pretrained checkpoints or third-party dependencies. Every SoccerNet dataset release, detector/ReID/calibration checkpoint and dependency must retain its own provenance, version/revision/hash and license decision before use.

## CAY-STABLE decision

- SoccerNet `sn-gamestate` source: **REJECTED FOR CODE REUSE (GPL-3.0)**.
- SoccerNet architecture/evaluation concepts: **STUDIED / BENCHMARK REFERENCE ONLY**.
- TrackLab 1.3.24 source/interface concepts: **PERMISSIVE REFERENCE (MIT)**; prefer the existing CAY artifact adapters and extend them rather than vendoring framework code.
- Dataset/model weights: **NOT APPROVED BY THIS AUDIT**; separate evidence required per artifact.

## What this avoids

This audit prevents an attractive but legally incompatible shortcut: copying SoccerNet baseline modules simply because TrackLab itself is MIT. It preserves the existing single CAY tracking/metric pipeline while keeping TrackLab as a compatible external producer target.

## Expected engineering impact

No runtime accuracy gain is claimed. The concrete gain is avoided rework/legal rollback: future calibration, ReID and game-state work can immediately classify `sn-gamestate` as benchmark-only while continuing to use TrackLab-shaped permissive extension points already present in CAY-STABLE.
