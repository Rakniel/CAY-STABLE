# OSS audit — DataBallPy metric validation reference (2026-09-16)

## Provenance
- Project: DataBallPy
- Source: https://github.com/Alek050/databallpy
- Audited branch: `develop`
- Upstream README version observed: `0.7.3` (2026-04-14)
- License: MIT, verified from upstream `LICENSE`.
- Upstream code copied into CAY-STABLE: **none**.
- Models/checkpoints/datasets copied: **none**.

## Why it matters to CAY-STABLE
DataBallPy is a mature soccer tracking/event analysis package with explicit preprocessing for tracking quality, velocity/acceleration, covered distance, team/player possession and synchronization of tracking with event streams. Its `Game` abstraction also normalizes several provider formats.

CAY-STABLE already owns the browser-first evidence, calibration, identity, coverage and `INDISPONIBLE` contracts. Importing DataBallPy into the browser would duplicate those responsibilities and add a Python/data-provider stack. The useful reuse is therefore **offline validation methodology**, not a second runtime pipeline.

## Adapted validation idea
When distance/speed/sprint and later possession become publishable in CAY-STABLE, compare exported CAY pitch-coordinate artifacts against an independent DataBallPy-compatible/offline calculation on the same validated intervals. Compare only intervals where CAY has:
1. validated metric calibration for the camera segment;
2. stable roster identity;
3. no bench/spectator exclusion failure;
4. sufficient metric coverage;
5. no `INDISPONIBLE` gap being silently interpolated.

Required comparison outputs:
- covered-distance absolute and relative delta per player;
- velocity distribution median/p95 delta;
- acceleration/sprint-boundary sensitivity once sprint rules are enabled;
- valid-duration/coverage equality before comparing totals;
- possession agreement only after ball ownership is independently defensible.

This reference **does not replace** CAY's metric runtime. It replaces bespoke design work for an independent football-domain validation oracle and gives us a mature target vocabulary for cross-checks.

## Legal boundary
The DataBallPy code is MIT, but datasets and provider data have separate terms. Upstream documents its open DFL/Sportec example data as CC-BY-4.0. Dataset licenses are not inherited from the code license and must be audited independently before any fixture is committed or redistributed.

## Expected gain
Estimated 0.5–1.5 engineering days avoided when building independent distance/velocity/possession validation. Expected measurable impact is not a claimed accuracy improvement: it is earlier detection of unit, filtering, synchronization and coverage-accounting errors before CAY publishes physical metrics.

## Status
**Studied / validation methodology adapted / runtime not integrated.**

No new dependency is introduced. Any future Python validation adapter must remain offline/optional and must not weaken CAY's fail-closed publication policy.