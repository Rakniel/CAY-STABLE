# OSS audit — SoccerNet ActiveSpotting (2026-09-05)

## Source
- Project: `SoccerNet/ActiveSpotting`
- Upstream revision inspected: `33a81cb834978ee474ecec0c5a76b6f3f99b4bf4` (main)
- License: MIT (repository `LICENSE` / GitHub metadata)
- Upstream role: football action spotting with an active-learning workflow on SoccerNet features.

## CAY-STABLE assessment
ActiveSpotting is a useful mature reference for the later CAY event layer because it treats football events as temporally localized predictions whose confidence/uncertainty matters, rather than assuming that every candidate is equally publishable.

For the immediate STABLE build, importing the upstream Python/PyTorch stack would be counterproductive: CAY currently needs a lightweight browser-first runtime and defensible first metrics before a learned action-spotting model. No upstream code, weights, features or SoccerNet dataset material is copied and no runtime dependency is added.

## Reuse decision
- Status: **ETUDIE / NON INTEGRE**.
- Useful idea retained for the event roadmap: preserve an explicit distinction between a negative event decision and an event for which evidence is insufficient.
- Current CAY pass change is a local fail-closed extension of `ball_kick_evidence_v1.js`; it is not copied from ActiveSpotting.

## Current CAY consequence
When kick evidence is required, a candidate pass with `INDISPONIBLE` kick evidence must not silently become a published zero-pass result. CAY now keeps confirmed/rejected/unavailable candidates separate and marks the pass field `INDISPONIBLE` when any candidate cannot be assessed.

## Expected acceleration
For the later learned event layer, using SoccerNet's mature action-spotting family as the benchmark/reference should avoid roughly **0.5–1 day** of inventing event-confidence and temporal-evaluation conventions from scratch.

## Risks / dependencies
A real model integration would add Python/PyTorch/model-weight and dataset-governance concerns and therefore remains outside the immediate STABLE browser build. Dataset access/licensing must be audited separately before any SoccerNet data is imported.
