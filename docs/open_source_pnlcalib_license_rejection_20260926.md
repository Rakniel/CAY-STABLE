# Open-source audit — mguti97/PnLCalib

Audit date: 2026-09-26
Upstream: https://github.com/mguti97/PnLCalib
Pinned revision: `8c87391d6f4ea40c5e4d65e61529916c7a49ce62`
Repository license: GPL-2.0 (GitHub SPDX metadata; upstream license must remain authoritative)
CAY-STABLE status: **runtime/source reuse rejected; research ideas only**.

## Why it was investigated

PnLCalib is directly relevant to CAY-STABLE's hardest calibration cases. It combines soccer-field keypoints with detected field lines and applies a point-and-line refinement stage after initial calibration. Upstream reports evaluation on SoccerNet-Calibration, WorldCup 2014 and TS-WorldCup, including single-view and multi-view settings.

This is technically attractive for weak/partial pitch views where keypoint-only homography can become fragile.

## License decision

Do **not** copy, vendor, translate, port, or derive runtime source from PnLCalib into CAY-STABLE under the current permissive-component policy. The repository is identified as GPL-2.0, which is not on CAY's permissive runtime allowlist and carries copyleft obligations that are not accepted for this integration path.

The same restriction applies to a superficially rewritten port if it is derived from GPL implementation details. CAY may independently implement general published ideas from the paper/specification, but must not use upstream source as the implementation template.

Model weights and datasets are separate artifacts and are not licensed merely because the repository has a source-code license. They remain rejected until separately audited.

## Safe research ideas retained

Only high-level, independently implementable concepts are retained:

- evaluate point-only calibration against point+line evidence;
- use field-line residuals as an independent geometric validation/refinement signal;
- require multi-view/multi-plan evaluation rather than optimizing only the main broadcast camera;
- compare reprojection quality and calibration completeness separately;
- never let a refined transform bypass CAY coverage, segment-boundary and fail-closed metric contracts.

These ideas should be implemented from mathematical/publication descriptions or through a separately licensed permissive component, not copied from PnLCalib source.

## What this replaces / avoids

This audit prevents PnLCalib from being accidentally promoted as a drop-in calibration backend simply because it is technically strong. It also prevents transitive contamination through projects that vendor PnLCalib while presenting their own top-level MIT license.

Estimated work avoided: **2–5 days** of integration followed by license remediation/removal. Expected impact: no immediate runtime accuracy gain, but a materially safer calibration shortlist and a clear target for a permissive point+line alternative.

## CAY-specific acceptance constraints

Any future permissive point+line implementation must still pass CAY's existing calibration candidate and runtime benchmark boundaries and preserve: multi-plan segmentation, explicit coverage, bounded/stated calibration reuse, metric trajectory validation, `INDISPONIBLE` for unsupported statistics, no fabricated continuity across cuts, and downstream player/ball metrics only from accepted pitch-space coordinates.
