# RUN21 — observation coverage evidence and OSS boundary (2026-10-16)

## CAY-STABLE correction
- Files: `first_results_runtime_guard_bridge_v1.js` and `tests/first_results_observation_consistency_nonregression.js`.
- Source: existing CAY strict-frame guard `strict_tracking_frame_guard_v1.js`; no external code imported or duplicated.
- Before: a report declaring `observationQuality: FIABLE` could publish physical metrics even if usable/unavailable counts were absent, contradicted total frames, or coverage was zero.
- After: validate explicit non-negative integer counts; require usable + unavailable = attempted; require coverage consistent with the exact ratio (tolerance for four-decimal producer rounding); recompute and cross-check quality. Explicit zero attempted frames fail closed. Legacy reports with no attempted-frame field remain unchanged for compatibility.
- Invalid evidence: `INDISPONIBLE` plus `observationCoverageGuard.evidenceError`; no physical or visual CAY result is promoted.
- Validation: 14 targeted integration scenarios, three independent passes (42 assertions on report status plus invalid-card checks); 3 V8 syntax/behavior passes. The existing legacy / valid reliable / partial / zero usable cases are preserved. Full repository CI and real C.A. Yenne footage remain unverified.

## Open-source shortlist — study only, no copied code
| Candidate | Pinned source | License | What could replace | Status / risk |
| --- | --- | --- | --- | --- |
| Roboflow trackers | v2.6.1 tag `3666546420b0fd564c8e63157a6621efffdfa01a` — https://github.com/roboflow/trackers | Apache-2.0 | Future Python/offline ByteTrack/BoT-SORT/GMC benchmark backend, not the current browser engine | STUDIED. Requires Python 3.10+, detector/weights licensing and CAY footage benchmarking. |
| Norfair | v2.3.0 — https://github.com/tryolabs/norfair | BSD-3-Clause | Optional ReID/moving-camera comparison | STUDIED. Python integration overhead; no CAY measured gains. |
| TrackLab | https://github.com/TrackingLaboratory/tracklab (revision not pinned) | MIT (repo declaration) | Research benchmark and state persistence reference | STUDIED; dependency and model licenses not cleared. |
| SoccerNet sn-gamestate | https://github.com/SoccerNet/sn-gamestate (revision not pinned) | GPL-3.0 | Research reference only; cannot be silently imported under current permissive-only CAY policy | REJECTED for code integration pending explicit legal acceptance. |

Roboflow trackers' public benchmark reports SoccerNet HOTA 84.5 for BoT-SORT versus 84.0 for ByteTrack using oracle detection boxes; these are NOT CAY-STABLE performance numbers. Expected engineering gain from a future offline adapter is reduced custom MOT development, not yet measured. No changes to CAY logos, visuals, detection models, weights or user data.
