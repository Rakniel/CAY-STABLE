# Open-source audit — moneyball ball hard-example workflow (2026-10-06)

- Source: https://github.com/SMozaffar/moneyball
- Upstream revision: `cd6cc307f4d8d89cec8893dc33aa84edec79f838` (2025-12-29).
- License: MIT, verified from upstream `LICENSE`.
- Status: studied / workflow pattern retained; no upstream source code, model weights, datasets, or media copied.

## Useful pattern

The upstream project treats ball detection improvement as a repeatable data loop rather than only a model swap: export small crops around detector observations and motion candidates, keep crops with no ball as explicit negative examples, label the crops, visually sanity-check the resulting dataset, then retrain a dedicated ball detector.

This is useful for CAY-STABLE because the ball is small in wide football footage and the club requires cumulative learning. It can reduce annotation time while deliberately collecting hard negatives near lines, shadows, boots and motion artifacts.

## CAY-STABLE adaptation

Do not replace `ball_candidate_continuity_v1.js`, `ball_event_state_v1.js`, or their evidence gates. Add a future detector-learning export behind the existing ball-candidate boundary:

1. sample uncertain/missed/competing ball candidates and representative negatives;
2. export crop metadata with source frame/time, candidate source, confidence, calibration/segment id and immutable run provenance;
3. never convert motion fallback candidates into ground truth automatically;
4. require human labels before training;
5. split train/validation by match or temporal block, not random neighboring frames, to reduce leakage;
6. benchmark the candidate detector through the existing detector/ball-event gates before promotion.

The runtime must continue to report possession/passes as INDISPONIBLE when evidence coverage is insufficient.

## License/dependency boundary

MIT covers the audited repository code. It does not automatically license Ultralytics/YOLO code or weights, CVAT deployments, user match footage, datasets, or any separately downloaded checkpoints. Each artifact remains independently auditable. No upstream implementation is vendored by this audit.

## Expected value

Estimated 2–4 days of workflow/plumbing design avoided. Expected measurable benefit is faster creation of a C.A. Yenne-specific ball dataset and improved ball recall/precision after retraining, especially on small/far-side balls and hard negatives. No accuracy gain is claimed until measured on held-out C.A. Yenne matches.

## Acceptance measurements

Before promotion compare on the same held-out clips: ball precision/recall, false positives per minute, valid-ball coverage, ambiguous ownership rate, possession availability, pass/turnover precision, runtime cost, and regressions across camera cuts/multi-plan segments.
