# Open-source audit — Roboflow `trackers` (2026-09-16)

## Provenance
- Project: https://github.com/roboflow/trackers
- Upstream revision inspected: `3fb83d1618f29b7fdd4617757b6894e4ec71146d` (2026-09-14)
- License: Apache-2.0 (`LICENSE` verified upstream)
- Upstream states the tracker implementations are clean-room reimplementations from papers rather than vendored/wrapped tracker code.
- Algorithms currently exposed upstream include SORT, ByteTrack, OC-SORT, BoT-SORT, C-BIoU and McByte.

## Why this matters to CAY-STABLE
CAY already has browser-first ByteTrack/BoT-SORT design adaptations and must not duplicate them blindly. The useful acceleration opportunity is a **permissively licensed offline/native benchmark backend** behind CAY's existing detection/tracking artifact contracts, not a second identity model.

The upstream project reports benchmark support for MOT17, SportsMOT, SoccerNet and DanceTrack and exposes CLEAR/HOTA/Identity evaluation. Its README reports default SoccerNet HOTA of 84.0 for ByteTrack, 84.5 for BoT-SORT and 85.0 for McByte; these are upstream benchmark figures, not CAY results. SoccerNet figures use oracle ground-truth detections, so they must never be presented as expected end-to-end CAY accuracy.

## Proposed reuse boundary
Status: **studied / benchmark-backend candidate / not integrated into STABLE runtime**.

Allowed candidate path:
1. Keep CAY detector and roster/identity rules authoritative.
2. Export detector observations through the existing CAY artifact/interchange boundary.
3. Run `trackers` only in an optional offline/native benchmark environment.
4. Re-import only track observations plus explicit provenance (`project`, exact revision/version, `Apache-2.0`, algorithm/config).
5. Compare against the current CAY tracker on the same C.A. Yenne fixtures using HOTA, IDF1, ID switches/player-minute, recovery after occlusion/re-entry, false CAY tracks and runtime.
6. Promote no backend unless it improves representative CAY footage without weakening the 11-on-field cap, bench/spectator exclusion, yellow-detail rejection, segment isolation or `INDISPONIBLE` policy.

## What this can replace / avoid
If validated, this can replace bespoke Python-side experimentation around ByteTrack/BoT-SORT evaluation and avoid importing AGPL tracker stacks such as current BoxMOT. It does **not** replace CAY's persistent roster identity, ReID evidence guard, camera-segment rules, coverage accounting or metric publication gates.

Estimated work avoided: **1–3 engineering days** for tracker benchmark plumbing and clean-room algorithm sourcing, before CAY-specific integration/testing.

## Expected measurable impact
No CAY accuracy claim is made yet. Candidate acceptance gates should include:
- HOTA and IDF1 >= current CAY baseline on the same labelled clips;
- fewer ID switches/player-minute and fewer broken tracks after short occlusion;
- zero increase in false CAY identities from opponents, referees, bench or spectators;
- zero cross-cut/cross-segment identity propagation unless CAY's existing explicit identity evidence authorizes it;
- runtime/memory measured on the intended club hardware;
- all physical metrics remain unavailable when calibration/coverage is insufficient.

## License/dependency risks
Apache-2.0 is permissive but redistribution requires preserving the license/notices and marking modified upstream files if CAY ever copies/modifies them. This audit copies no upstream source code.

The base Python package and any optional extras/dependencies must still be dependency-audited before shipping. In particular, McByte adds heavyweight optional Torch/SAM/Cutie-style dependencies; model/checkpoint licenses are separate from the library's Apache-2.0 code license and are **not approved by this audit**.

Upstream benchmark datasets also have their own terms (for example SportsMOT is listed upstream as CC BY 4.0, while MOT17 is listed as CC BY-NC-SA 3.0). Dataset rights do not transfer through the Apache-2.0 code license.

## CAY decision
Do not add `trackers` as a mandatory browser dependency. Prefer an optional benchmark/backend adapter only after C.A. Yenne fixture results prove a concrete gain. Until then, the current CAY runtime remains authoritative and this document records the legal/technical candidate boundary.