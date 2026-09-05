# ELASTIC kick-evidence design audit

- Upstream project: `hyunsungkim-ds/elastic`
- Upstream revision inspected: `bc41bcdf43451ae639c6ae7b299c1ccd3712d00e` (2025-11-04)
- License: Mozilla Public License 2.0 (confirmed from upstream `LICENSE` at the inspected revision)
- Upstream role: synchronization of football events with tracking using motion evidence such as ball acceleration, kick distance, player-ball distance and receive detection.
- CAY-STABLE status: concept/design reference only. No ELASTIC source file, model, weights or dataset is copied into CAY-STABLE and no ELASTIC dependency is added.

## CAY adaptation

CAY already had its own clean-room `ball_kick_evidence_v1.js`, inspired by the general idea that a pass should have measurable release evidence rather than only an ownership change. This revision strengthens that local implementation without copying upstream code:

1. local ball-speed evidence is now accepted only between temporally continuous observations;
2. a pair is rejected when its gap exceeds the configured `maxObservationGapSec` (default 0.75 s);
3. a pair is rejected when `segment`, `segmentId`, `shotId` or `planId` indicates a camera/plan boundary;
4. rejected continuity pairs are exposed in `continuityRejectedPairs` for audit;
5. if no continuous pair can support a kick, the evidence returns `INDISPONIBLE`/`REJECTED` rather than converting a camera cut into an artificial ball acceleration.

## What this replaces

Previously, the local kick-evidence layer could compute a large local speed from two adjacent rows even when the rows belonged to different camera plans or were separated by a long blackout. That could incorrectly strengthen a pass candidate.

## Expected/measured impact

The added non-regression fixture contains a large apparent ball displacement exactly across a plan boundary. Before this guard that displacement was eligible for release-speed evidence; after the guard the boundary pair is rejected and cannot confirm a kick. A second fixture covers a same-plan temporal blackout longer than 0.75 s and prevents that gap from confirming a kick as well.

Estimated work avoided by reusing the mature ELASTIC evidence pattern as a design reference instead of designing a pass-release feature family from scratch: about 0.25-0.5 day. Runtime dependency impact: none.

## License decision

MPL-2.0 code can be used under its file-level obligations, but CAY-STABLE does not need to import the upstream implementation here. Keeping this as a clean-room conceptual adaptation avoids unnecessary Python dependencies and keeps the browser-first runtime simple while still documenting the source of the design idea.
