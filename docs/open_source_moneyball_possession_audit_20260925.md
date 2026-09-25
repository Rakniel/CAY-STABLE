# OSS audit — SMozaffar/moneyball possession hysteresis

Date: 2026-09-25
Upstream: https://github.com/SMozaffar/moneyball
Revision inspected: `cd6cc307f4d8d89cec8893dc33aa84edec79f838`
License: MIT (`LICENSE`, copyright 2025)
Upstream file inspected: `soccer_cv/metrics/possession.py`

## Useful upstream idea

Moneyball separates instantaneous nearest-player proximity from confirmed possession. A candidate owner must remain stable for several frames before becoming the current owner. This temporal hysteresis is a useful general design principle for avoiding one-frame ownership flips.

It also optionally holds the last owner for a configured interval while the ball is missing.

## CAY-STABLE decision

No upstream code is copied. CAY-STABLE already has stronger football-specific ownership/event evidence in `ball_event_state_v1.js` and existing non-regressions for temporal possession evidence, owner visibility, missing ball coordinates, opponent stability, detached pass sequences and evidence coverage. Duplicating Moneyball's estimator would create a second source of truth.

The candidate-stability principle is therefore **already covered / retained conceptually**, while the missing-ball hold behavior is **explicitly rejected for metric publication**. In CAY-STABLE, an unobserved ball is not evidence of possession: coverage must fall and possession/passes remain `INDISPONIBLE` when evidence is insufficient. This is stricter than a UI-friendly last-known-owner display and matches the product requirement that published statistics be defensible.

## License boundary

The repository code is MIT, but this does not automatically license external YOLO models, datasets, footage, pretrained weights, or third-party dependencies referenced by the project. None are imported here.

## Replacement / time saved

This audit prevents implementing a redundant possession state machine and prevents a tempting but unsafe "hold last possession while ball missing" shortcut. Estimated work avoided: 0.5–1.5 days of duplicate implementation/tuning plus future reconciliation of conflicting ownership semantics.

## Expected measurable impact

No runtime performance gain is claimed. The preserved CAY policy should keep `ownedSeconds` from increasing during ball-observation gaps, reduce false possession certainty, and preserve explicit coverage/`INDISPONIBLE` semantics.

## Status

- Temporal hysteresis principle: studied; already represented by CAY evidence logic.
- Upstream runtime/code: not integrated (duplication avoided).
- Missing-ball possession hold: rejected for published metrics.
- Risk: a future UI may legitimately show a clearly labelled "last observed owner"; that display state must never feed metric accumulation.
