# OSS provenance — TrackLab-inspired candidate-independent re-entry correction (2026-09-12)

## Existing source boundary

- Reference project already audited: `TrackingLaboratory/tracklab`
- Upstream revision already pinned by CAY-STABLE: `5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2`
- Upstream version at that revision: `1.3.24`
- Upstream license: MIT
- Related evaluation concept already documented: SoccerNet Game State Reconstruction / GS-HOTA. Its GPL-3.0 implementation remains outside the CAY-STABLE runtime boundary.

No new upstream code, model, weight, dataset, configuration or implementation fragment is copied by this correction.

## Problem found in CAY-STABLE

`tracking_identity_episode_eval_v1.js` v1.1 intended to make persistent-identity re-entry opportunities candidate-independent. However, the ground-truth opportunity predicate still depended on `everMatched`, which is tracker output state.

A weak tracker that failed to establish a prediction identity before a genuine ground-truth disappearance could therefore erase that later re-entry from its own denominator. The promotion gate could then see different opportunity counts instead of directly measuring the candidate failure.

## Clean-room correction

Version `CAY_TRACKING_IDENTITY_EPISODE_EVAL_V1_2` separates two states:

- `everTruthSeen`: driven only by ground-truth visibility and used to decide whether a disappearance/re-entry or segment transition is an evaluation opportunity;
- `everMatched`: still used only for the legacy tracker-observed diagnostic metric.

A genuine ground-truth re-entry is now counted even when the candidate had no previous prediction ID. In that case recovery is explicitly false rather than removing the opportunity.

## What this replaces / work avoided

This removes the need for a separate post-processing pass that would reconstruct candidate-independent re-entry denominators after evaluation. Estimated engineering work avoided: about 0.25–0.5 day, while keeping the existing evaluator and promotion gate as the single source of truth.

## Expected measurable impact

- Baseline and candidate receive the same re-entry opportunity count for the same ground-truth sequence.
- Weak trackers can no longer improve or shrink their benchmark denominator by missing the player before an occlusion or camera-plan transition.
- Persistent identity promotion is rejected for an actual recovery regression rather than hidden behind a denominator mismatch.
- Downstream player cards, trajectories, heatmaps, distance, speed and sprint evidence remain better protected from identity contamination.

## Status and risks

Status: integrated as a CAY clean-room correctness fix; no external code added and no new runtime dependency.

Risk: representative C.A. Yenne clips with real long occlusions and multi-plan transitions remain necessary before claiming production accuracy. This correction makes the benchmark fairer; it does not itself improve the visual tracker.
