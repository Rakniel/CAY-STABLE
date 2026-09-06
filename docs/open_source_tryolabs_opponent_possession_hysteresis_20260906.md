# Tryolabs soccer-video-analytics — opponent possession hysteresis adaptation

Date: 2026-09-06

## Source and license

- Project: `tryolabs/soccer-video-analytics`
- Upstream revision inspected: `b00c7c75a1d52bd5ca183521a35fc76fbd89cc0e`
- Relevant upstream file: `soccer/pass_event.py`
- License: MIT (`LICENSE.md`, Copyright (c) 2022 Tryolabs)
- Code copied into CAY-STABLE: **none**
- Runtime dependency added: **none**
- Models / weights / datasets imported: **none**

## Useful upstream idea

The upstream `PassEvent` keeps a normal possession confirmation threshold of 3 observations and a stronger threshold of 4 when a change involves a different team. The reusable idea is therefore asymmetric temporal hysteresis: an opponent taking possession must be confirmed more strongly than an internal reception before the event state changes.

## CAY-STABLE adaptation

CAY-STABLE already owns a metric/time-based ball state machine, pass evidence, turnover motion evidence and coverage guards. No second event engine was introduced.

`ball_event_state_v1.js` now:

- keeps `minStableOwnershipSec` for initial ownership and same-team receptions;
- adds `minOpponentStableOwnershipSec` for a change from a stable owner to the opposing team;
- defaults the opponent threshold to `4/3 * minStableOwnershipSec`, mirroring the upstream 4-vs-3 confirmation ratio while remaining frame-rate independent;
- never allows the opponent threshold to be configured below the standard threshold;
- exposes `opponentStabilityDeferrals` for auditability;
- records `receiverStableSec` on validated turnovers;
- leaves pass flight, movement, coverage, multi-plan continuity and minimum turnover-observation guards unchanged.

## What this replaces

This replaces the previous symmetric CAY ownership stabilization rule where a same-team reception and an opponent takeover both became stable after the same `minStableOwnershipSec` duration. Existing logic is extended in place; no duplicate ownership/event logic is created.

## Expected / measured effect

With the standard CAY test threshold of 0.30 s, the derived opponent threshold is 0.40 s. A synthetic opposing takeover lasting 0.35 s with otherwise sufficient turnover motion evidence is now deferred instead of published. The same transition sustained for 0.40 s remains publishable.

Expected production impact: fewer transient false turnovers caused by a short nearest-player flip, overlap, partial occlusion or momentary ball-player association error, without adding latency to same-team pass reception.

## Estimated work avoided

Estimated 0.25–0.5 day of event-state design/tuning avoided versus inventing a second turnover confirmation state machine. No package installation or integration plumbing is required.

## Risks

- A real very fast interception visible for less than the strengthened duration may remain unconfirmed; this is intentional under the STABLE requirement that uncertain statistics become unavailable rather than overclaimed.
- The 4/3 ratio is a concept adaptation, not copied implementation. It must still be benchmarked on real C.A. Yenne footage before any claim about real-world false-turnover reduction.
- The guard must not be treated as sufficient evidence by itself: existing ball motion, transition observation, coverage and continuity rules remain mandatory.

## Status

**Integrated for validation** on branch `automation/opponent-possession-hysteresis-20260906`; merge is permitted only if the complete CAY non-regression/syntax workflows are green.
