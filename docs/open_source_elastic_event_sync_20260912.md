# ELASTIC — event/tracking synchronization audit (2026-09-12)

## Provenance
- Project: `hyunsungkim-ds/elastic`
- Default branch inspected: `cikm2026`
- Paper: **ELASTIC: Trajectory-Based Synchronization of Event and Tracking Data in Soccer** (CIKM 2026)
- Repository purpose: synchronize soccer event timestamps with player/ball tracking trajectories.

## License boundary
- Source code: **MPL-2.0** (`LICENSE` at repository root).
- Benchmark event data: **CC BY 4.0**, derived from the Sportec Open DFL dataset with attribution requirements.
- Decision for CAY-STABLE in this pass: **study/reference only; no ELASTIC source code or benchmark data copied**.
- Reason: MPL-2.0 is file-level copyleft and is not needed for the current STABLE runtime priority. If code reuse is later justified, keep covered files isolated, preserve notices/source obligations, and re-audit dependencies before integration.

## Useful technical idea
ELASTIC narrows possible ball-touch frames using physically meaningful trajectory evidence, notably:
- ball acceleration,
- player-ball distance,
- kick distance,
then aligns the ordered event sequence to candidate frames with Needleman-Wunsch dynamic programming.

For CAY-STABLE this is most relevant to the **later** ball/pass/event phase, after ball tracking is defensible. The useful design lesson is to avoid declaring pass-like events from a single proximity threshold: first produce sparse physically plausible touch candidates, then enforce temporal/order consistency.

## What it could replace
If validated on C.A. Yenne footage, this could replace a future home-grown event/touch synchronization heuristic and reduce bespoke design around pass/control timestamp alignment.

## Estimated work avoided
- Approximately **1–2 engineering days** of designing a first event/tracking synchronization benchmark and candidate-frame strategy from scratch.
- Additional value: published evaluation scripts and sensitivity sweeps provide a ready reference protocol even if no code is imported.

## Expected impact
- Fewer temporally implausible pass/control assignments once reliable ball trajectories exist.
- Better separation between **ball-touch candidate evidence** and **event classification**, consistent with CAY-STABLE fail-closed publication rules.
- No claimed production gain yet: CAY footage and camera conditions have not been benchmarked against ELASTIC.

## Status
**ÉTUDIÉ / RETENU COMME RÉFÉRENCE DE BENCHMARK — NON INTÉGRÉ.**

## Risks / dependencies
- Requires sufficiently reliable ball and player trajectories; it does not solve CAY's current detector/calibration bottlenecks by itself.
- MPL-2.0 obligations apply to reused covered source files.
- Benchmark data carries CC BY 4.0 attribution obligations.
- Elite multi-sensor tracking data may not transfer directly to single-camera amateur-club video.
