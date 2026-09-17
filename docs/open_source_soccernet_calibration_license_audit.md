# SoccerNet sn-calibration — licence and reuse audit

Audit date: 2026-09-17

## Source
- Repository: https://github.com/SoccerNet/sn-calibration
- Default branch audited: `main`
- Repository purpose: SoccerNet camera-calibration challenge baseline, including semantic pitch-element detection, homography estimation/decomposition, camera parameters and evaluation.

## Licence finding
At the audited repository root, no `LICENSE`/`COPYING` file is present and a direct request for `LICENSE` returns 404. The repository README and challenge material may be used as public research/documentation references, but absence of an explicit source-code licence means CAY-STABLE MUST NOT copy, vendor, translate, port, or derive implementation code from `sn-calibration`.

This corrects any overly broad interpretation of the existing `OPEN_SOURCE_COMPONENTS.md` wording. SoccerNet `sn-calibration` is reference-only unless a verifiable compatible licence is later published for the exact revision being reused.

## Useful idea, adapted independently
The useful architecture is the separation of:
1. semantic pitch-element observations,
2. pitch-model correspondences,
3. robust homography/camera estimation,
4. independent calibration evaluation.

CAY-STABLE already implements the compatible clean-room equivalent through its own automatic/manual calibration, robust homography consensus, per-segment metric registry and fail-closed validation. No SoccerNet implementation code is required or imported.

## What this replaces / avoids
- Avoids accidentally treating a public challenge repository as permissively licensed source code.
- Avoids a future direct port of SoccerNet camera classes when CAY already has a validated projector contract.
- Keeps calibration backends replaceable behind CAY contracts instead of coupling runtime metrics to one research implementation.

## Expected impact
- Legal: prevents unlicensed code incorporation.
- Engineering: approximately 0.25–0.5 day of future licence remediation / duplicate calibration-port work avoided.
- Runtime: zero dependency and zero behavioural change.
- Metrics: no claimed accuracy gain; CAY continues to expose metres only from independently validated calibration and otherwise returns `INDISPONIBLE`.

## Status
**Studied / useful design reference / code reuse rejected because no explicit source-code licence was found at the audited root.**

## Risks and dependencies
SoccerNet datasets, challenge data, pretrained weights and downstream packages have their own terms and must be audited independently before any future use. A repository-level public URL is not sufficient evidence of reuse permission.
