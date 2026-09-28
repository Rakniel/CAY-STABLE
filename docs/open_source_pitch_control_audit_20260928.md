# OSS audit — mkh1991/pitch-control

Date: 2026-09-28

## Provenance
- Project: `mkh1991/pitch-control`
- Source: https://github.com/mkh1991/pitch-control
- Audited revision: `41c12858e7d556fe307dd146c0130e0d6f5bf3a7`
- Repository license: MIT (copyright 2025-2026 Mayukh Samanta).

## Useful technical findings
The repository cleanly separates a pitch-control model from the CV pipeline feeding it through a shared tracking-data contract. Its CV path combines player/ball detection, tracking, team assignment, metric pitch calibration, velocity estimation and scene-change-triggered recalibration. The README reports two independent calibration correspondence paths (RF-DETR pitch keypoints and PnLCalib point/line detections), RANSAC plus plausibility gating, and a causal Kalman velocity stage.

The strongest near-term CAY-STABLE reuse is **not** to add pitch-control output to the current STABLE milestone. Instead, retain the MIT implementation as a later tactical-metric candidate once CAY's own persistent identities, metric coordinates, velocities and ball position are sufficiently validated. This preserves the current priority order: first trustworthy player cards/tracking/coverage/trajectories/heatmaps, then physical metrics, then ball/events, then richer tactical metrics.

## License / dependency boundary
The repository root code is MIT and therefore compatible in principle with CAY-STABLE provided copyright and permission notices are retained for copied/substantial portions. However its optional CV pipeline names several separately governed dependencies/models (including RF-DETR, PnLCalib, supervision/trackers and model assets). Root MIT does not automatically relicense those dependencies, weights or datasets. No upstream source, model, weight or asset is copied in this audit.

## CAY adaptation decision
**STUDIED / APPROVED AS A FUTURE CANDIDATE; NOT INTEGRATED INTO STABLE YET.**

What it can eventually replace: a future from-scratch implementation of team pitch-control / territory probability once the evidence chain is mature.

What CAY should adapt now at architecture level:
1. preserve a stable metric tracking-data contract independent of detector/tracker implementation;
2. keep velocity downstream of validated metric coordinates, never pixels;
3. treat recalibration as event-driven around scene/camera changes rather than assuming one homography for the entire video;
4. gate any future pitch-control surface on complete enough player state + ball state and publish `INDISPONIBLE` otherwise.

These ideas extend existing CAY modules rather than duplicate them. CAY already has metric projection, motion plausibility, trajectory, kinematics, publication guards and first-results gates, so a parallel CV stack would be counterproductive.

## Expected value
- Estimated avoided future work: ~2–4 days for a tested pitch-control core plus verification scaffolding, if/when CAY reaches the tactical-metric phase.
- Immediate work avoided: ~0.5 day of designing another incompatible tracking-to-tactical data contract.
- Expected measurable impact: none claimed for current STABLE output until benchmarked on CAY evidence; later target is deterministic pitch-control computation from already validated CAY player/ball states.
- Status: **studied / future integration candidate / no runtime code copied**.
- Risks: optional CV dependencies and model assets require separate license/provenance audits; pitch-control is invalid if identities, metric geometry, velocities or ball state are incomplete.
