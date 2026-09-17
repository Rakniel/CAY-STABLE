# OSS audit — Soccer Sight temporal jersey consensus (2026-09-17)

## Source
- Project: https://github.com/umitkacar/soccer-sight
- Audited revision: `3a904d4ad1cf88c3dbc34926bb20985e2d441693`
- Relevant upstream file inspected: `ocr/temporal_filter.py`
- Upstream README claims MIT, but the audited repository root does **not** contain a `LICENSE` file and GitHub contents lookup for `LICENSE` returns 404.

## Legal decision
**No source code, configuration, model weights, assets or dependency lock data are copied into CAY-STABLE.**

The missing license text means the README badge/claim is not sufficient for our strict reuse policy. Treat implementation as **license not verifiable / code rejected** until an explicit license file or other authoritative grant is present at the audited revision.

## Useful idea, independently adapted
The project demonstrates a useful identity-evidence pattern for jersey OCR:
1. keep several OCR observations per tracked player;
2. reject observations below a confidence floor;
3. aggregate repeated observations over time rather than trusting one crop;
4. use hysteresis/consensus before accepting a jersey number;
5. require sustained contradictory evidence before replacing an accepted number.

For CAY-STABLE this is a design reference only. If jersey-number evidence is added, it must extend the existing persistent roster identity/evidence contracts rather than create a second identity system.

## CAY-specific safety adaptation
- Jersey number is **supporting evidence**, never a sole auto-identity authority.
- Evidence is scoped to the same tracking/camera segment and roster candidate.
- Reset or quarantine evidence on shot/camera-plan cut, confirmed ID switch, manual identity correction, substitution boundary or team mismatch.
- Never let OCR override manual roster identity.
- Never allow a yellow digit/patch/detail to turn a non-CAY person into a CAY player; existing team/roster/bank/spectator gates run first.
- Ambiguous, conflicting or insufficient observations remain `A_VERIFIER`/`INDISPONIBLE`, not a guessed shirt number.
- Roster may exceed 11, while simultaneously active CAY players remain capped at 11.

## What this avoids/replaces
Avoids implementing a fragile single-frame jersey-number decision path. It also prevents future OCR work from duplicating persistent identity logic already present in CAY-STABLE.

## Benchmark gate before runtime integration
On representative C.A. Yenne footage measure:
- precision of accepted jersey-number locks;
- false-lock rate;
- median/p95 observations and seconds to stable consensus;
- unlock/switch error rate around occlusions and substitutions;
- identity-switch delta versus tracking without OCR evidence;
- false-CAY delta, including yellow-detail negatives;
- coverage: accepted / ambiguous / unavailable.

A candidate is accepted only if false identity assignment does not regress and persistent-ID quality measurably improves. Otherwise keep OCR advisory-only or reject it.

## Estimated engineering gain
Approximately **0.5–1 day** of identity/OCR state-machine design and edge-case exploration avoided.

## Status
**Studied / idea adapted independently / upstream code rejected pending verifiable license.**

## Dependency/model risks
Upstream also references Ultralytics YOLO, SoccerNet/PARSeq and SigLIP. Their code/model/data licenses are separate boundaries and are **not inherited from a README MIT claim**. None is imported by this audit.