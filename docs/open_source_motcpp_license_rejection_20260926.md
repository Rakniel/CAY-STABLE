# motcpp open-source audit — runtime rejection

Audit date: 2026-09-26

## Provenance

- Project: `Geekgineer/motcpp`
- Upstream: https://github.com/Geekgineer/motcpp
- Revision inspected: `b35c1897b15ae8ea1bee3d91d31165b08550fe8a`
- Upstream LICENSE blob inspected: `3a840929969c31dc700dc4f39e6465c82e46abff`
- Declared license: **GNU Affero General Public License v3.0 (AGPL-3.0-or-later)**.

## Why it was interesting

motcpp is a broad modern C++ MOT implementation covering several families that matter to CAY-STABLE, including ByteTrack, OC-SORT, UCMCTrack, BoT-SORT, StrongSORT and BoostTrack. In particular, its tracker comparison makes UCMCTrack relevant for moving-camera / ground-plane motion experiments and offers a potentially useful common benchmark surface across motion-only and ReID trackers.

## License decision

**Runtime integration: REJECTED.**

CAY-STABLE must not copy, vendor, translate, port, link against, or derive implementation code from motcpp under the current permissive-runtime policy. The upstream root license is AGPL-3.0-or-later, which is not admitted by the current CAY-STABLE external-component policy for runtime reuse.

This decision applies even when an individual algorithm implemented by motcpp is described in a paper or has another independent implementation elsewhere. The algorithm/paper may be studied independently; motcpp source must not be used as the implementation source.

No motcpp source code, binaries, weights, models, datasets, or release assets were imported by this audit.

## What may still be reused safely as a research direction

Only non-copyrightable/high-level evaluation ideas are retained:

1. benchmark moving-camera trackers separately from static-camera cases;
2. include a ground-plane / camera-motion-aware candidate such as UCMCTrack in the offline bake-off **only if a separately audited compatible implementation is found**;
3. compare motion-only and ReID-assisted candidates on identical CAY detections and timebase;
4. keep CAY-specific vetoes dominant: false CAY, bench/spectator leakage, >11 simultaneous on-field CAY players, unsafe cross-segment identity carryover, missing coverage/calibration evidence;
5. do not treat upstream MOT benchmark scores as evidence of CAY suitability.

These ideas do not replace CAY's existing BoT-SORT GMC adaptation or `camera_motion_background_evidence_guard_v1.js`; they only add a future benchmark candidate class.

## CAY replacement / impact

- Replaces: **nothing in runtime**.
- Avoided work: prevents an attractive all-in-one tracker library from entering STABLE and later requiring license-driven removal/refactoring.
- Estimated avoided remediation: **2–5 engineering days**, excluding legal review and downstream redistribution work.
- Expected measurable impact: none at runtime from this documentation-only change. Future benefit is a cleaner tracker bake-off with a camera-motion-aware candidate, provided a compatible implementation is independently located.
- Status: **studied / runtime rejected / research direction retained**.

## Risks and dependencies

- Do not infer that model or ReID asset licenses match the repository license; every external weight/model/dataset still requires its own audit.
- Do not copy motcpp tracker parameters, implementation structure, source comments, tests, or code into CAY-STABLE.
- A separately licensed implementation of UCMCTrack/BoT-SORT/ByteTrack must be audited on its own provenance and revision before use.
