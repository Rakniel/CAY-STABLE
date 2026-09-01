# football-event-detection — non-live event suppression audit

## Source
- Project: `aviasoletechnologies/football-event-detection`
- Repository: https://github.com/aviasoletechnologies/football-event-detection
- Audited revision: `3a7b169d7c9a207a32573288932323a06130e2f1` (2026-03-26)
- Upstream idea inspected: suppress football events while broadcast footage is classified as replay / slow-motion / non-live.

## Licence boundary
The upstream README states that the project is released under the MIT licence. However, at the audited revision the repository root contains `.gitignore`, `analyze.py`, `readme.md`, and `requirements.txt` but **no LICENSE file**. CAY-STABLE therefore treats the upstream code licence as insufficiently evidenced for code reuse.

**No upstream source code, model, weights, configuration, threshold, OCR logic, optical-flow logic, or dependency stack was copied.** Only the high-level architectural idea — do not allow non-live broadcast segments to produce match events — was independently reimplemented.

Status of upstream code reuse: **REJECTED** (missing licence file at audited revision).
Status of high-level idea: **ADAPTED CLEAN-ROOM**.

## CAY-STABLE adaptation
`ball_event_evidence_bridge_v1.js` now contains a conservative live-play guard before the existing event engine. It does not create a parallel possession/pass implementation.

A frame is treated as non-live only when metadata says so explicitly (`isReplay`, `replay`, `isLive:false`, `live:false`, or an explicit frame/play class such as `REPLAY` / `SLOW_MOTION`). CAY-STABLE does not infer replay status from image appearance in this module.

For an explicit non-live run:
- ball evidence is invalidated;
- players are removed from ownership eligibility;
- a dedicated continuity segment is injected;
- entry and exit therefore break the existing possession/pass continuity engine;
- replay/non-live time remains in the timeline denominator and cannot improve coverage;
- no pass, turnover, or possession can bridge across the excluded run.

## Why this is safer for CAY
Broadcast edits can replay a valid pass or shot. Without a non-live boundary, the same real-world action can be counted again, or a replay can connect two unrelated live-play ownership states. CAY-STABLE already has strong continuity guards; this change extends those same guards instead of duplicating event logic.

## Expected gain
Estimated engineering work avoided: **0.25–0.5 day** versus building a separate replay-aware event state machine.

Expected measurable impact: fewer duplicate/false passes and possession transitions on edited footage once upstream frame classification metadata is available. No accuracy percentage is claimed before CAY video benchmark data exists.

## Dependencies / risks
- No new runtime dependency.
- Accuracy depends on the producer of replay/live metadata; the module intentionally does not guess.
- If no metadata is present, historical behavior is preserved.
- The upstream project itself is not a code dependency because licence evidence is incomplete at the audited revision.
