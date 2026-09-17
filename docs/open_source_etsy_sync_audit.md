# ETSY open-source audit

- Project: `ML-KULeuven/ETSY`
- Audited revision: `18f554b112708be57f560b0c9d22fb8fe645807b`
- License: Apache-2.0, verified from upstream `LICENSE`.
- Status: studied / synchronization design candidate; no source code copied into CAY-STABLE.

## Useful upstream pattern

ETSY synchronizes soccer event records with tracking/positional data per playing period. It first removes the kickoff/clock offset, then searches a bounded temporal window using event-specific rules and a distance-based score to select the best matching tracking frame.

## CAY adaptation

This is relevant after CAY's immediate STABLE tracking/trajectory milestone, when passes, possession, shots and manually corrected events need to line up with player/ball trajectories. The useful reusable principle is to keep event timestamps and tracking timestamps as separate evidence streams and produce an explicit synchronization result with a score instead of silently assuming identical clocks.

Any future CAY implementation should extend the existing ball/event artifact contracts rather than create a second event pipeline. Low-confidence or ambiguous alignment must remain `INDISPONIBLE`; synchronization may not bridge camera/analysis segment cuts or manufacture a ball/player identity.

## What this can replace

Avoids inventing a bespoke event↔tracking clock-offset and local frame-search design when event integration starts. Estimated engineering work avoided: **0.5–1 day** for synchronization design and edge-case discovery.

## Expected measurement

Before adoption, compare on representative C.A. Yenne clips with deliberately shifted event clocks: median/p95 temporal alignment error, percentage aligned within 0.5 s / 1.0 s, ambiguous/unavailable rate, and zero cross-segment matches. No accuracy claim is made before that benchmark.

## Risks / dependencies

- Upstream expects SPADL-shaped event data and Python/pandas-style processing; CAY should not make that stack mandatory in the browser runtime.
- Event-specific rules may not transfer unchanged to amateur video and CAY's detector outputs.
- Any optional SPADL/socceraction dependency must be separately license-audited before direct incorporation.
- Apache-2.0 attribution/NOTICE obligations must be preserved if source code is later incorporated.

## Modification record

2026-09-17: documentation-only clean-room audit. No upstream source, data, model, or dependency incorporated.