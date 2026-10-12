# OSS audit — ELASTIC event candidate alignment (2026-09-18)

## Source and license

- Project: `hyunsungkim-ds/elastic`
- Upstream branch inspected: `cikm2026`
- Purpose: trajectory-based synchronization of football event and tracking data.
- License: Mozilla Public License 2.0 (`LICENSE` verified at upstream branch).
- Upstream README also identifies benchmark event data as CC BY 4.0. Dataset and benchmark files are **not** imported into CAY-STABLE.
- No upstream source code, benchmark data, model, asset, or dependency is copied by this change.

## Useful idea

ELASTIC reduces event timing to physically plausible candidate frames using football trajectory evidence, notably ball acceleration, player-ball distance and kick distance, then aligns the ordered event sequence against ordered candidate frames. This is a useful reference for CAY-STABLE because it separates:

1. evidence generation from player/ball trajectories;
2. candidate-touch generation;
3. ordered event assignment;
4. publication/evaluation.

The architecture is stronger than frame-local nearest-player heuristics because it can use temporal order and physical evidence without pretending that every ownership change is a pass.

## CAY-STABLE adaptation boundary

CAY-STABLE should adapt the **idea**, not copy the MPL implementation. Existing CAY components remain authoritative: ball candidate continuity, kick evidence, ball/player drift guard, possession/pass state, roster ownership bridge, plan/cut guards and canonical football event contract.

A future clean-room CAY event-candidate layer should consume only accepted metric samples and emit candidate touches with at least:

- video timestamp/frame;
- plan/calibration segment id;
- player/roster candidate;
- player-ball metric distance;
- ball acceleration / velocity-change evidence where defensible;
- kick-distance / detached-ball evidence;
- confidence and rejection reasons;
- coverage/evidence provenance.

Ordered assignment may then be benchmarked against the current local state machine, but must never bridge a camera cut, invalid calibration interval, roster quarantine, substitution boundary, or missing-ball interval. If required evidence is not defensible, the downstream event remains `INDISPONIBLE`.

## Acceptance benchmark

Before any runtime integration, compare current CAY event inference with the clean-room candidate/ordered-assignment experiment on the same labelled clips. Record:

- pass precision / recall / F1;
- false passes caused by ID switches or same-team ownership flicker;
- median and p95 event timestamp error;
- false events across cuts / plan changes (target: 0);
- percentage of published events carrying complete evidence provenance (target: 100%);
- runtime cost and accepted coverage.

Integration is allowed only if precision does not regress, cut/plan false events remain zero, and timing error or recall improves measurably.

## Expected acceleration

Estimated work avoided: 0.5–1 day of event-candidate architecture and benchmark design. Expected impact is fewer false pass/touch events around ambiguous ownership transitions and a measurable timing benchmark for passes/receives. No runtime gain is claimed until CAY clips are benchmarked.

## Status / risk

Status: **studied; clean-room architectural adaptation approved; upstream runtime/code not integrated**.

Risk: MPL-2.0 is file-level copyleft. Directly copying or modifying covered upstream source would create source-disclosure obligations for those covered files and requires license/notice handling. To keep the current CAY boundary simple, this audit deliberately imports nothing. Benchmark data is separately CC BY 4.0 and is also excluded from the product/runtime.