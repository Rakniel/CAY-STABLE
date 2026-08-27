# SoccerTrack v2 BAS design reference — conservative pass evidence

- Source: https://github.com/AtomScott/SoccerTrack-v2
- Upstream inspected: repository `main`, 2026-08-27; source repository actively updated through 2026-08-16.
- Code license: MIT (`LICENSE`). The dataset is separately licensed and is not imported into CAY-STABLE.
- CAY-STABLE status: design reference adapted; no SoccerTrack v2 source code or dataset copied.

## Useful upstream idea
SoccerTrack v2 separates Ball Action Spotting (BAS) from MOT/game-state reconstruction. CAY-STABLE keeps the same conceptual separation: ownership evidence is not itself enough to assert a football action.

## CAY adaptation
`ball_event_state_v1.js` now requires a same-team ownership transition to contain observable ball-flight evidence before publishing a `PASS`:

1. stable ownership by player A;
2. at least one confident detached/ambiguous ball observation between owners;
3. a minimum metric ball displacement (default 3 m) between the last stable ball point and the receiving ownership point;
4. a bounded transition duration (default <= 3 s);
5. stable ownership by player B of the same team.

A direct A -> B ownership switch without observed detached-ball evidence is recorded only as `rejectedPassTransitions` and is not published as a pass. Opponent ownership transitions remain turnovers because they are directly supported by the stable ownership change.

## What this replaces
Previously, any stable same-team owner change could be counted as a pass even if no ball flight was observed. That could misclassify close challenges, identity errors, occlusions or detector jumps as passes.

## Tests
`tests/ball_event_state_nonregression.js` now covers:
- validated pass with observable flight and metric travel;
- rejection of a direct ownership-only pseudo-pass;
- validated turnover;
- low ball-coverage suppression;
- ambiguous intermediate ball observations.

## Dependencies and risk
- No new runtime dependency.
- No Python/PyTorch requirement.
- Thresholds (3 m / 3 s) are conservative defaults and must be benchmarked on representative C.A. Yenne footage before loosening.
- Ball/passes remain `INDISPONIBLE` when coverage is insufficient.

## Expected impact
Higher precision for first-pass statistics and fewer false passes, at the cost of intentionally lower recall when the ball is occluded or not sampled during flight. This trade-off matches the CAY-STABLE rule: only publish defensible statistics.
