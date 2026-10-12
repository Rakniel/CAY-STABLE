# CAY-STABLE — evidence-backed 20-minute setup SLA (2026-10-09)

## Scope
The existing `setup_sla_v1.js` already measures team, roster, video, analysis, launch and first-results stages. This patch **extends the existing guard**, not a second stopwatch or workflow.

## Defect / before
A completed stage with `seconds:-300`, `seconds:''`, `seconds:true` or `seconds:[]` could be treated as zero/one elapsed seconds. This allowed a false `PRET_MOINS_20_MIN` claim. Empty target minutes also became an unintended 1-minute target.

## Change / after
Accept only finite, non-negative numeric stage durations (numbers or nonblank numeric strings). Invalid/missing durations are **unmeasured**, returning `NON_MESURE` unless a stage is incomplete. Preserve legitimate zero, decimals, and the 20-minute default. No artificial time or claim of real-user performance is introduced.

## Validation
- Existing `tests/setup_sla_nonregression.js`: 5 repeated passes in isolated JavaScript execution.
- New `tests/setup_sla_invalid_durations_nonregression.js`: negative, empty, null, boolean, array, object, nonfinite, zero, numeric-string, incomplete-stage and target-default cases.
- 60 before/after synthetic assertions: 25 failures before, 0 after.
- Full GitHub CI and an observed educator setup session remain pending.

## External provenance and license
No external source code, models, assets or dependencies introduced. The patch is internal CAY-STABLE logic, with no new third-party license obligations. This does not replace the existing calibration/tracking/heatmap pipelines.

## Expected impact
Prevents misleading certification of the under-20-minute onboarding target. Actual time savings: **not measured**. Status: **tested; branch-only pending CI**.
