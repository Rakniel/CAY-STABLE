# Open-source audit — Kloppy + IDSSE synchronized football benchmark

Date inspected: 2026-09-01

## Kloppy
- Source: https://github.com/PySport/kloppy
- License: BSD-3-Clause.
- Relevant capability: standardized football event/tracking models and provider loaders, allowing event and tracking data from different sources to be compared through a common representation.
- Status in CAY-STABLE: design/reference only in this change; no Kloppy source code copied and no Python dependency added to the browser runtime.

## IDSSE / Sportec open synchronized dataset
- Reference exposed through Kloppy `sportec.load_open_event_data` / `load_open_tracking_data`.
- Dataset paper: Bassek et al., *An integrated dataset of synchronized spatiotemporal and event data in elite soccer*, Scientific Data (2025).
- License: Creative Commons Attribution 4.0 for the published dataset as stated by Kloppy's provider documentation.
- Relevant capability: seven full matches with synchronized event data and tracking positions for both teams and the ball.
- Status in CAY-STABLE: external benchmark source only. Dataset files are not vendored into the application.

## Local adaptation
`ball_event_benchmark_v1.js` is original CAY-STABLE code. It introduces a small provider-neutral validation contract that compares CAY-produced PASS/TURNOVER events against synchronized reference events using:
- explicit event-type matching;
- configurable timestamp tolerance;
- one-to-one greedy temporal matching;
- precision, recall and F1;
- false-positive / false-negative counts;
- mean absolute event timing error;
- per-event-type metrics;
- before/after deltas.

The evaluator returns `INDISPONIBLE` when no reference events are provided. It does not infer or fabricate ground truth.

## What this replaces / work avoided
This avoids designing a bespoke football-event scoring format separately for every future public dataset or detector experiment. Estimated avoided benchmark/plumbing effort: **0.5–1 day**, with additional savings each time another standardized provider is evaluated.

## Expected measurable impact
No runtime accuracy increase is claimed by this change. It makes future changes to ball association, possession, pass/turnover logic and eventually shots objectively promotable only when precision/recall/F1 and event timing improve on synchronized football data.

## Risks / dependencies
- The current evaluator is a CAY-specific promotion guard, not an official SoccerNet metric.
- Timestamp tolerance must be fixed before comparing candidates to avoid benchmark tuning after seeing results.
- Public dataset attribution/license obligations apply if dataset-derived results are distributed.
- Kloppy remains optional tooling; CAY-STABLE runtime stays browser-first with zero new Python dependency.
