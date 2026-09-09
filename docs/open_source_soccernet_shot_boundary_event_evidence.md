# SoccerNet sn-spotting — camera-shot boundaries as event-evidence boundaries

- Source: https://github.com/SoccerNet/sn-spotting
- Upstream inspected: `main` at commit `9842826f94e1419580a9d17219c11aca7225f7ce` (latest upstream commit observed 2026-09-09; commit itself dated 2024-02-07).
- License: MIT (`LICENSE`, copyright SoccerNet 2021).
- CAY-STABLE status: design reference adapted; no SoccerNet source code, model weights, annotations, dataset or pretrained features copied.

## Useful upstream idea

SoccerNet treats action spotting and camera-shot segmentation as distinct but related temporal video-understanding problems. For CAY-STABLE, this reinforces a strict rule: temporal motion evidence used to infer a football event must never reuse derivative state from a different camera shot/plan.

The Ball Action Spotting task also includes `Shot` among fine-grained ball actions. CAY-STABLE does **not** import SoccerNet's learned spotting models here; it keeps the lightweight conservative multi-signal candidate layer already present in `shot_temporal_evidence_v1.js`.

## CAY adaptation

`shot_temporal_evidence_v1.js` already blocked direct speed computation across a continuity-key change, but `prevSpeed` survived that boundary. Therefore the first speed computed inside the new plan could still be differentiated against a speed from the previous plan, creating an artificial acceleration term.

CAY now resets:

- previous speed used for acceleration;
- accumulated temporal shot evidence;

whenever the continuity key changes (`segment`, `segmentId`, `planId`, or `shotId`). The positive intra-plan path and all existing thresholds remain unchanged.

## What this replaces

It removes cross-plan derivative leakage without adding a second shot detector, a learned action-spotting runtime, or another dependency. The existing CAY temporal evidence module is extended in place.

## Tests

`tests/shot_temporal_evidence_nonregression.js` includes a fixture where:

1. plan A ends with a low/zero ball speed;
2. plan B begins with a new coordinate frame;
3. only one acceleration increase is genuinely measurable inside plan B;
4. the former leaked `prevSpeed` would provide a second false strong-evidence frame.

Expected result: `candidateCount === 0`.

## Expected impact

- fewer false `SHOT_CANDIDATE` events immediately after camera cuts or manual multi-plan boundaries;
- no reduction of evidence inside a continuous calibrated plan;
- preserves the publication policy `A_VERIFIER` / `NEVER_AUTO_PUBLISH`.

## Dependencies and risk

- Runtime dependency added: none.
- External code copied: none.
- External weights/data copied: none.
- License propagation requirement: none beyond this provenance record because no SoccerNet code is redistributed.
- Remaining risk: if upstream samples lack all continuity metadata, CAY cannot infer an unseen camera cut from this module alone; upstream cut/plan detection must provide the boundary marker.