# LTPI benchmark — open-source assessment

## Upstream
- Project: `FrontierSport/ltpi-benchmark`
- Repository created: 2026-04-09
- Upstream default branch reviewed: `main`
- Review date: 2026-08-30
- Repository code license: Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)
- GitHub metadata reports the license as `NOASSERTION`; the repository `LICENSE` file itself contains the CC BY-NC 4.0 text.
- Dataset terms are separate and non-commercial/research-only according to the upstream README.
- No upstream source code, weights, or dataset are copied into CAY-STABLE by this assessment.

## Why this is useful to CAY-STABLE
LTPI is specifically about long-term player identification from single-camera football video. Its pipeline combines TrackLab with player ReID, jersey-number recognition, pose information and team classification. This directly overlaps one of CAY-STABLE's hardest requirements: preserving a player's identity over long clips, occlusions, camera motion, plan changes and substitutions without inventing extra CAY players.

The useful contribution for CAY-STABLE is therefore the **benchmark structure and evaluation targets**, not the implementation itself.

## License decision
Status: **REJECTED FOR CODE INTEGRATION / STUDIED AS BENCHMARK REFERENCE**.

CC BY-NC 4.0 restricts use of the licensed material to non-commercial purposes. CAY-STABLE must remain deployable for a real football club without creating an avoidable licensing restriction on future distribution, hosting, sponsorship or commercial support. Consequently:
- do not copy LTPI source code into CAY-STABLE;
- do not vendor LTPI models or dataset assets;
- do not add LTPI as a runtime dependency;
- do not train on its dataset unless the dataset licence and intended use are separately reviewed and accepted;
- benchmark concepts and published evaluation ideas may be independently reimplemented in CAY-specific code, without copying protected implementation.

## Benchmark ideas worth adapting clean-room
1. **Long-term identity continuity** rather than frame-local tracking accuracy only.
2. **Re-entry identity** after a player leaves the camera view and returns.
3. **Occlusion recovery** without creating a second persistent identity.
4. **Appearance + jersey-number evidence fusion** when both are available, while keeping either signal optional.
5. **Team consistency** as a hard/strong identity constraint rather than a cosmetic label.
6. **Identity confidence and ambiguity reporting** so uncertain merges stay manual instead of silently corrupting player statistics.

## CAY-specific adaptation target
Extend the existing deterministic STABLE benchmark with CAY-owned fixtures for:
- 11 simultaneous CAY players but roster >11 through substitutions;
- one or more players disappearing for a long interval then returning;
- visually similar teammates crossing/occluding each other;
- controlled jersey-number evidence present, blurred, contradictory or absent;
- explicit camera-plan boundaries;
- bench/spectator/yellow-detail clutter;
- expected persistent player IDs and expected manual-review cases.

Suggested gates:
- long-term ID switch count = 0 for unambiguous fixtures;
- false CAY identity count = 0;
- duplicate persistent identities for one ground-truth player = 0;
- simultaneous published CAY count <= 11;
- ambiguous ReID cases must be flagged rather than auto-merged;
- substitutions may increase roster size without reviving an on-field slot incorrectly.

## What this replaces / work avoided
The LTPI benchmark design avoids inventing a long-term player-ID test plan from scratch. Estimated work avoided: **0.5–1 day** of benchmark design and failure-case enumeration.

Expected impact: a more realistic gate for persistent player fiches and cumulative statistics before relying on jersey OCR or a heavy ReID stack in production.

## Dependencies / risks
Upstream references include TrackLab, SoccerNet Game State Reconstruction, PRTreID, PARSeq and ViTPose. Their licences, model-weight terms and dataset terms are not automatically inherited from LTPI and must each be audited independently before any direct reuse.

The upstream dataset is research/non-commercial; it is therefore not a safe default training asset for CAY-STABLE.

## Provenance
- Source: `FrontierSport/ltpi-benchmark`
- Capability studied: long-term football player identification benchmark and evidence-fusion evaluation strategy
- License: CC BY-NC 4.0
- Local modification: conceptual clean-room adaptation only; no upstream implementation copied
- Runtime dependency added: none
- Model/dataset added: none

## Promotion criterion
No LTPI code should be promoted into CAY-STABLE under the current licence. Only independently written CAY tests or concepts may be retained unless a separate compatible permission/license is obtained.