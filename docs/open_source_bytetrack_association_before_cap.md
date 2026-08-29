# ByteTrack — association before hard on-field cap

- Upstream project: ByteTrack (`ifzhang/ByteTrack`, original project by Yifu Zhang et al.)
- Upstream capability inspected: preserve association opportunities for existing tracklets before discarding lower-ranked detections.
- Paper: *ByteTrack: Multi-Object Tracking by Associating Every Detection Box* (ECCV 2022).
- License: MIT for the original ByteTrack project.
- Review context: 2026-08-29.
- Code reuse status: **no upstream source code copied**. CAY-STABLE keeps its existing browser JavaScript tracker and adapts the association-order principle independently.

## Problem in CAY-STABLE

`tracking_core_v1.js` intentionally limits published CAY players to 11, but it also sorts detections by category/confidence and truncates the candidate list before association. Under clutter, 12+ high-confidence detections can therefore remove a slightly lower-confidence true player before that player has a chance to match an already active identity.

That behavior is especially damaging for C.A. Yenne because a spectator/bench/referee-like detection must never replace an established CAY player merely because its detector confidence is higher on one frame.

## Adaptation

Local integration point: `tracking_two_stage_adapter_v1.js`.

1. The existing two-stage ByteTrack-style adapter remains the only tracking path.
2. When a confidence bucket contains more candidates than the remaining on-field capacity, a lightweight continuity preselection first reserves candidates compatible with established active tracks.
3. The core tracker remains responsible for the final association decision; the preselection does not create identities itself.
4. Remaining capacity is filled by the existing category/confidence ordering.
5. New identities can only consume slots left after active-track recovery, so the hard invariant remains **11 CAY maximum simultaneously**.
6. Overflow is counted in `state.byteTrackPreselectionOverflow` for audit and future video benchmarks.

## Validation

Targeted test: `tests/bytetrack_preselection_overflow_nonregression.js`.

The fixture starts with 11 active identities, then submits 12 high-confidence candidates: the 11 true continuations plus one higher-confidence clutter candidate. Expected result:

- 11/11 original IDs retained;
- zero new ID;
- roster total remains 11;
- the lower-confidence but continuity-compatible player remains association-eligible;
- the clutter candidate is not published;
- overflow is auditable.

## Dependency and license impact

No new runtime package, detector, model weight or service is introduced. The MIT-licensed ByteTrack project is used as an architectural reference only; the implementation is clean-room and remains native to the existing CAY-STABLE JavaScript architecture.
