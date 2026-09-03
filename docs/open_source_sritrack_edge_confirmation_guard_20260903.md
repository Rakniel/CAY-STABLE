# SRITrack edge-partial confirmation guard — 2026-09-03

## Source and license
- Project: SRITrack (`kaoyuyukao/SRITrack`)
- Audited revision: `80ca110a3e0e4874a8700fa8bd57f84cdfa2d919`
- License: MIT (repository `LICENSE`)
- Upstream role: sports multi-object tracking with ReID, camera-motion compensation and handling of partial/border detections.

## CAY-STABLE adaptation
CAY-STABLE does **not** copy SRITrack source code, model weights or dependencies. The adapted idea is narrower: border/partial detections are useful for continuity, but are weaker evidence for creating a new identity.

The existing `player_candidate_recovery_v1.js` already marks recovered border fragments with `edgePartial=true` and lowers appearance-only confidence. This change extends that metadata into `tracking_two_stage_adapter_v1.js` confirmation policy:

- an `edgePartial` detection remains available for association/recovery;
- it may continue an identity that is already confirmed;
- it cannot increment the consecutive-strong-evidence streak of a still-tentative identity;
- repeated edge-only observations therefore cannot create a new confirmed CAY player;
- once complete non-edge observations arrive, the same technical track can be confirmed after the normal consecutive-frame gate;
- suppression is counted in `state.cayEdgePartialConfirmationSuppressed` and exposed per frame as `confirmation.edgePartialSuppressed`.

## What this replaces
Previously the edge guard reduced visual confidence but temporal confirmation did not distinguish full detections from border fragments. Two sufficiently high-score edge fragments on consecutive frames could therefore satisfy `minimumConsecutiveFrames=2` for a fresh track.

## Expected/measurable impact
Synthetic non-regression now verifies:
1. two consecutive edge-partial observations produce **0 confirmed player**;
2. the tentative technical track is retained instead of deleted;
3. two later complete observations confirm that same track ID;
4. a confirmed identity is not revoked by a later edge-partial observation.

This directly reduces one false-identity path at camera entry/exit while preserving continuity. Estimated avoided design/debug effort: ~0.5 day versus implementing a separate border-state tracker.

## Status
**Integrated candidate — pending full CI and same-sequence benchmark promotion gate.**

## Risks / dependencies
- Correct behavior depends on upstream CAY candidate recovery propagating `edgePartial` metadata.
- Very long sequences filmed almost exclusively with a player clipped by the border will delay identity confirmation; this is intentional and safer than inventing a player identity.
- No runtime dependency, Python package or model is added.
