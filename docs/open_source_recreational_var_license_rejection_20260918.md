# OSS audit — Recreational Video Assistant Referee Senior Research

Date: 2026-09-18

## Source
- Project: `LucasKazaki/Recreational-Video-Assistant-Referee-Senior-Research`
- Source: https://github.com/LucasKazaki/Recreational-Video-Assistant-Referee-Senior-Research
- Repository default branch inspected: `main`
- Repository metadata reports no SPDX/license (`license: null`).
- Direct `LICENSE` path check returns 404.

## Useful technical ideas observed
The project demonstrates a compact operator-driven football pipeline: overlapping inference crops for wide frames, manual pitch/kit sampling, planar homography to a bird's-eye field, and heatmap aggregation from projected positions. Overlapping crops are potentially useful as a benchmark idea for small/distant player and ball recall in wide C.A. Yenne footage.

## License decision
**REJECTED FOR CODE REUSE.** No source code, assets, field image, model configuration, or implementation detail is copied, translated, vendored, or adapted from this repository because no reuse license is granted/verifiable at the inspected revision.

The repository may remain a high-level behavioral/reference example only. If a compatible license is added upstream later, it must be re-audited at an exact commit before any reuse.

## CAY-STABLE mapping
CAY already has detector candidate/benchmark contracts, validated homography, segment isolation, metric heatmaps and explicit coverage. Therefore no duplicate runtime path is justified.

The only clean-room experiment worth considering later is an **overlapping-crop detector benchmark** behind the existing detector interchange/benchmark contract. It must compare identical footage and detector weights against the current full-frame path, measuring at minimum player recall, ball recall, false positives (especially bench/spectators and yellow-detail false CAY), latency/FPS and duplicate-detection rate after crop overlap reconciliation.

It must not weaken:
- maximum 11 simultaneously active CAY players;
- bench/spectator exclusion;
- persistent roster identity rules;
- anti-yellow-detail CAY guard;
- segment/cut isolation;
- `INDISPONIBLE` publication policy.

## Estimated work avoided
Approximately 0.25–0.5 day of legal remediation or accidental unlicensed porting is avoided by rejecting implementation reuse now. If independently reimplemented and benchmarked later, overlapping crops may improve small-object recall but no accuracy gain is claimed until measured on representative C.A. Yenne footage.

## Status
- Project/source: studied
- Code reuse: rejected (no verified license)
- Idea: overlapping-crop detection retained only as a clean-room benchmark candidate
- Runtime integration: none
- New dependencies: none
