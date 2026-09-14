# SoccerNet Team Ball Action Spotting — review 2026-09-14

## Source

- Project: `SoccerNet/sn-teamspotting`
- Upstream revision reviewed: `091fed2fc35c33f7489f3596958a2fe385e37d65`
- Purpose: SoccerNet Team Ball Action Spotting development kit / baseline and evaluation tooling.
- License observed in upstream root `LICENSE`: GNU GPL v3.

## Compatibility decision

No upstream source code, model implementation, configuration, weights or copied constants are imported into CAY-STABLE in this change. GPL-3.0 is intentionally treated as incompatible with the current permissive clean-room reuse policy for runtime integration unless the project licensing strategy is explicitly changed later.

Dataset/video/annotation access terms are a separate concern from the repository source-code license and must be reviewed independently before using SoccerNet assets for C.A. Yenne validation.

## Idea retained without code copying

The public task specification is useful as an evaluation reference: Ball Action Spotting uses dense ball-action timestamps with strict temporal evaluation, and Team Ball Action Spotting additionally associates the responsible team. CAY-STABLE keeps the same high-level discipline that an event must have temporal evidence and actor/team context before publication, but implements its own lightweight evidence contracts.

## CAY-STABLE adaptation in this run

The existing local `shot_temporal_evidence_v1.js` is now added to the canonical STABLE ball-runtime integration path. It remains diagnostic-only: generated `SHOT_CANDIDATE` records stay `quality: A_VERIFIER`, `publishable: false`, with `publicationPolicy: NEVER_AUTO_PUBLISH`.

This does not replace the future validated shot classifier. It only makes the already-developed temporal multi-signal diagnostic available in the testable STABLE bundle without weakening publication rules.

## Expected gain

- Avoids duplicating a new shot detector solely to expose diagnostics in STABLE.
- Estimated work avoided: roughly 0.5 day of parallel runtime/plumbing work.
- Measurable integration gain: canonical STABLE ball runtime goes from 0 loaded shot-evidence module to 1, while the publication rate for diagnostic shot candidates remains 0% by contract.

## Risks / dependencies

- Ball speed and acceleration depend on valid metric projection and timing.
- Kick evidence must remain trustworthy; a candidate is not a confirmed shot.
- Broadcast cuts/replays and discontinuities must keep breaking temporal continuity.
- No automatic shot statistic should be exposed until validation on labeled C.A. Yenne footage supports it.
