# TrackEval candidate promotion gate — provenance and CAY adaptation

## External source
- Project: TrackEval
- Upstream: https://github.com/JonathonLuiten/TrackEval
- License: MIT
- Role in CAY-STABLE: external/offline evaluator for HOTA, IDF1 and CLEAR MOT metrics. No TrackEval source code is copied into the browser runtime.

## CAY adaptation
`tracking_candidate_promotion_gate_v1.js` is a clean-room CAY-specific decision layer over benchmark results. It does not implement HOTA/IDF1/MOTA. It consumes already-computed benchmark numbers and prevents a candidate tracker from being promoted only because one headline metric improves.

Default promotion requires:
- at least 3 C.A. Yenne benchmark sequences in both baseline and candidate results;
- HOTA gain >= 0.5 point;
- no IDF1 regression;
- no MOTA regression;
- no increase in identity switches;
- zero increase in false CAY tracks;
- zero increase in bench/spectator false tracks.

All thresholds are configurable, but the defaults intentionally enforce the CAY-STABLE safety rules. Missing evidence never passes the gate; it returns `INSUFFICIENT_EVIDENCE`.

## What this replaces
This replaces manual, subjective tracker promotion decisions and avoids writing a home-grown HOTA/IDF1/MOTA evaluator. TrackEval remains the metrics engine; CAY-STABLE only adds club-specific acceptance criteria.

## Estimated work avoided
Approximately 0.25–0.5 day for each serious tracker comparison by standardizing the acceptance decision, plus repeated review time when ByteTrack, BoT-SORT, ReID or future candidates are benchmarked.

## Dependencies and risks
- No new runtime dependency.
- Benchmark numbers must still come from correctly aligned CAY ground truth and candidate exports.
- A small benchmark set can overfit; the gate therefore refuses promotion below the sequence floor.
- Thresholds should be revisited only with measured CAY evidence, not generic public benchmark scores.
