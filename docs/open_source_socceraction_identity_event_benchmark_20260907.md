# OSS provenance — socceraction identity-aware event benchmark

Date: 2026-09-07

## Upstream reviewed

- Project: `ML-KULeuven/socceraction`
- Upstream revision audited: `93a1242d46c104889205753accaabadb00c45c6d`
- Package version observed in upstream metadata: `1.5.3`
- License: MIT
- Relevant concept: SPADL represents an action with explicit player/team identity and action coordinates/results, rather than treating an action as only a timestamp + label.

## CAY-STABLE adaptation

CAY-STABLE does **not** copy socceraction/SPADL implementation code, schemas, datasets, trained models, or Python dependencies.

Clean-room idea adapted into `ball_event_benchmark_v1.js`:

- if the annotated reference event contains an actor/player id, team id, PASS receiver id, or receiver team id, the benchmark now requires the prediction to agree with that attribution before it can become a true positive;
- old reference sets without identity fields remain evaluable exactly as before;
- `identityMode: 'off'` remains an explicit compatibility escape hatch for timing-only experiments;
- diagnostics report how many candidate matches were rejected for actor/team/receiver mismatch.

This closes a validation gap where a PASS at the correct timestamp but credited to the wrong C.A. Yenne player could previously count as a benchmark true positive.

## Why this is useful for C.A. Yenne

Player cards, pass counts, possession attribution and later per-player event statistics must be defendable. Type/time-only matching can overstate event quality while still assigning statistics to the wrong player. Identity-aware matching makes promotion tests stricter without changing the runtime detector/event inference path.

## Estimated engineering gain

Approximately 0.25–0.5 day of event-schema/benchmark design avoided by adapting the mature SPADL action-identity principle rather than inventing another event representation.

## Runtime/dependency impact

- New runtime dependency: none
- Copied upstream code: none
- Copied upstream data/model: none
- License obligation introduced into distributed runtime: none beyond documenting the conceptual provenance; no MIT source is vendored.

## Validation required before merge

- root JavaScript syntax/non-regression workflow
- STABLE integration workflow
- calibration V2 workflow
- dedicated `tests/ball_event_benchmark_nonregression.js` cases for actor, team and receiver mismatches
