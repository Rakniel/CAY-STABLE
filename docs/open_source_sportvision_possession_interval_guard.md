# SportVision possession logic — CAY interval-defensible adaptation

## Upstream
- Project: `MohibShaikh/sportvision`
- Source inspected: `src/sportvision/analytics/possession.py`
- License: Apache-2.0
- Upstream behavior used as reference: nearest-player-to-ball possession accumulation with a proximity threshold.
- Code copied: none.

## CAY-STABLE adaptation
CAY-STABLE already uses metric player/ball positions and stable ownership. This change keeps that architecture and adapts only the accounting principle so possession and ball coverage are integrated over time rather than credited by frame count.

### Modification
`ball_event_state_v1.js` now credits an observation interval only when both interval endpoints have a defensible ball observation. Possession time is credited only when the same stable owner is observed at both endpoints. A visible frame followed by an unavailable frame no longer credits the whole following interval.

### Why this replaces previous behavior
The previous implementation evaluated interval duration before the current frame observation. Therefore the transition from an observable frame to an unavailable frame could still increase `observableSeconds`, `coverage`, `ownedSeconds`, and possession time. This could overstate ball coverage and possession.

### Tests
`tests/ball_event_state_nonregression.js` includes regression cases for:
- observed -> unavailable -> observed: 0 credited observable interval;
- direct owner transition: no full interval attributed to the previous owner;
- existing pass/turnover and low-coverage guards remain covered.

## License handling
Apache-2.0 is compatible with the intended use. No upstream code, model, dataset, weights, or dependency is vendored. This is an independently implemented behavioral adaptation, documented for provenance.

## Expected impact
- lower false confidence in possession percentages;
- lower risk of publishing possession from partially missing ball observations;
- no new runtime dependency;
- deliberately conservative recall in exchange for defensible statistics.
