# OSS audit — aviasoletechnologies/football-event-detection

Audit date: 2026-09-25

## Source

- Repository: https://github.com/aviasoletechnologies/football-event-detection
- Repository created: 2026-03-26
- Default branch: `master`
- GitHub repository metadata inspected on 2026-09-25 reports no detected license (`license: null`).
- A direct request for the repository-root `LICENSE` file returned 404 at audit time.
- The README/search presentation describes the project as MIT, but that statement is not sufficient for CAY-STABLE's reuse policy while the actual license grant is absent from the repository.

## Useful ideas observed

The project describes several potentially useful football-video workflow patterns:

1. An analyst-assisted wide/eagle-eye frame for rapid player tagging rather than requiring a pre-existing roster database.
2. Replay-aware event suppression using multiple signals (camera-cut evidence, motion evidence and broadcast-overlay evidence).
3. Re-identification combining appearance evidence with a cheaper colour fallback.
4. Structured uncertainty states for identity/tagging rather than silently forcing a player identity.

These are useful product/validation ideas for CAY-STABLE, especially the goal of getting team setup below 20 minutes and preventing replay footage from inflating event counts.

## License decision

**Status: REJECTED FOR CODE REUSE / REFERENCE-ONLY UNTIL LICENSE IS FIXED UPSTREAM.**

CAY-STABLE must not copy, vendor, translate, port, adapt or derive implementation code from this repository while an explicit license grant cannot be verified in the repository. The README's MIT statement is recorded as a claim only; it does not override the missing license file for our fail-closed compliance policy.

No source code, model weights, thresholds or assets from this project have been incorporated into CAY-STABLE.

If upstream later adds a valid license file, the exact licensed revision must be re-audited before reuse. Model weights and transitive dependencies must still be licensed separately.

## CAY-STABLE consequence

The useful workflow concepts may be independently implemented or tested from first principles, but they do not justify duplicating existing CAY logic. In particular:

- replay/cut handling should extend the existing segment/event evidence contracts;
- identity uncertainty should extend existing conservative ReID/manual-review contracts;
- rapid roster tagging belongs in the existing team/trombinoscope setup flow;
- no replay detector should suppress or create a statistic without explicit coverage/provenance evidence.

## Expected work avoided

The audit avoids an unsafe integration and an eventual license-remediation rewrite. Estimated avoided rework: roughly 0.5–2 days if this repository had otherwise been imported based only on the README claim.

No runtime accuracy or speed gain is claimed from this documentation-only audit.
