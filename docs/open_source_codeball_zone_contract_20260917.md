# OSS audit — Metrica Sports Codeball zone/pattern contracts (2026-09-17)

## Provenance
- Project: `metrica-sports/codeball`
- Audited revision: `06161ac69f9b7b53e3820537e780ab962c4349e6` (release/0.4.0 merge)
- Upstream license: MIT, verified from root `LICENSE` (Copyright 2020 Metrica Sports).
- Upstream maturity signal: 116 commits; latest repository release line is 0.4.x, but the project describes itself as WIP and is tied primarily to Metrica Elite data.

## Useful reusable idea
Codeball cleanly separates provider data from football semantics. Its public API composes tracking/event filters with pitch `Zones`/custom `Areas`, then applies reusable `Pattern` logic (for example an event type filtered into the opponent box) before visualization/export.

For CAY-STABLE this is useful as an architectural contract, not as a runtime dependency:
1. canonical metric observations remain the only spatial source of truth;
2. pitch zones are derived from metric coordinates plus attacking direction, never from image pixels;
3. event/pattern rules consume canonical validated events and zones instead of detector/tracker internals;
4. renderers only visualize accepted facts and cannot manufacture an event;
5. an invalid calibration, missing attacking direction, plan break, identity ambiguity or insufficient evidence yields `INDISPONIBLE` rather than guessing a zone/event.

## What this replaces / avoids
This avoids building future passes-into-box, final-third entries, penalty-area presence, half-space occupation and similar club-facing metrics as independent ad-hoc coordinate tests scattered across UI/event code. CAY already has `metric_attacking_direction_v1.js`, `football_event_contract_v1.js`, metric projection/quality/publication guards and the canonical metric trajectory/heatmap chain, so the correct acceleration path is to extend those contracts with one reusable zone layer rather than duplicate spatial logic.

## Integration decision
- Status: **studied / architecture adapted / runtime import rejected as unnecessary**.
- No Codeball source is copied or translated in this change.
- No Python, pandas, Kloppy, Metrica API or provider dependency is added.
- If code is later reused verbatim/substantially, retain the upstream MIT notice in the distribution and record exact file/revision/modifications in `OPEN_SOURCE_COMPONENTS.md`.

## Expected gain
Estimated work avoided: **0.5–1 day** when the first zone-based football metrics are implemented, plus lower long-term regression risk by centralizing pitch geometry semantics.

Expected measurable acceptance gates for a future CAY zone layer:
- 100% of zone classifications originate from accepted metric coordinates;
- 0 classifications cross an unvalidated plan/cut;
- 0 image-coordinate fallback classifications;
- attacking-direction-dependent zones return unavailable when direction is unavailable;
- trajectory, heatmap and zone membership use the same accepted sample set;
- no change to the current strict publication/coverage thresholds.

## Risks / boundaries
Codeball's provider integration and visualization/API pieces are not needed for STABLE and would add Python/provider coupling. Its own README marks parts of the tactical roadmap as not implemented. Therefore CAY should reuse the semantic separation and composability idea while keeping its stricter evidence, coverage, multi-plan, roster identity and `INDISPONIBLE` contracts authoritative.
