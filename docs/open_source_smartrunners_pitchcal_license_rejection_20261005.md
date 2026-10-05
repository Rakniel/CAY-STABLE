# Open-source audit — Smart Runners pitchcal (2026-10-05)

- Source: https://github.com/smartrunners/smartrunners-pitch-calibration
- Upstream package: `pitchcal` 0.1.0.
- License verified from upstream `LICENSE`: **proprietary / all rights reserved**. Redistribution, modification, or use outside an active Smart Runners license agreement is prohibited without written consent.
- Status: **rejected for code reuse/vendor/dependency**. No upstream source code was copied into CAY-STABLE.

## Why it was inspected

The project targets moving-camera football calibration. Its public README describes time-indexed calibration: manual pitch landmarks are grouped into temporal clusters, a RANSAC homography is fitted per cluster, and intermediate timestamps are mapped using interpolation between neighboring homographies. It also distinguishes moving-camera (`veo`) and fixed panoramic (`pano`) modes.

This is relevant to CAY-STABLE's multi-plan/manual-frame requirements, but the license is incompatible with unrestricted reuse in the current project.

## CAY-STABLE decision

Do **not** import, vendor, translate, or adapt implementation code from `pitchcal`. Do not add it as a runtime dependency without a separate commercial license decision.

The high-level problem statement is retained only as benchmark/product evidence: calibration must be time/segment aware for moving cameras. CAY-STABLE already has independent calibration, camera-motion and metric-projection contracts, so no parallel calibration engine is introduced.

Any future temporal interpolation implementation must be independently designed from CAY requirements and permissively licensed/public-domain mathematical references, and must remain fail-closed: weak or stale calibration yields `INDISPONIBLE`, never guessed physical metrics.

## Technical caution

The README states that the upstream implementation linearly interpolates the nine homography matrix elements and renormalizes by H[2,2]. Even apart from licensing, CAY-STABLE should not adopt that method without validation because projective homographies do not generally have a physically meaningful element-wise linear interpolation. Existing anchor/flow and geometric validation gates remain the safer integration path until measured otherwise.

## Dependency boundary

The upstream package declares NumPy >=1.24 and OpenCV >=4.9. Their licenses do not override the proprietary license of the `pitchcal` source itself.

## Expected value

Estimated 0.5–1 day of unsuitable integration work avoided by catching the proprietary license before implementation. The audit also prevents a false assumption that a public GitHub repository or installable Python package is automatically open source.
