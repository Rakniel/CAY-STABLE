# Open-source audit — PySport/kloppy

Date: 2026-09-26

## Provenance

- Project: PySport/kloppy
- Upstream: https://github.com/PySport/kloppy
- Audited revision: `51dbd38c4fb48c0815119e23ff9a3a68ea06be52`
- License at audited revision: BSD-3-Clause (`LICENSE`)
- Current PyPI release observed during audit: 3.19.0 (2026-06-07)

## What is useful to CAY-STABLE

Kloppy provides a vendor-independent soccer data model for event and tracking data and normalizes provider-specific coordinate systems. That is useful as an **offline interchange/reference boundary** for CAY-STABLE exports and future evaluation tooling: player/team identity, timestamps, periods, tracking frames and event records should be representable without coupling the browser runtime to a particular data vendor.

This does **not** replace CAY-STABLE's evidence gates. CAY remains authoritative for calibration/coverage validity, CAY-vs-opponent identity, the 11-player simultaneous cap, bench/spectator exclusion, multi-plan continuity, and `INDISPONIBLE` publication semantics.

## Integration decision

Status: **studied / schema concepts accepted / runtime not integrated**.

No Kloppy source code, package, dataset, sample data or provider adapter is copied or vendored in this commit. The immediate reuse is architectural: use a neutral tracking/event interchange contract rather than inventing provider-specific exports as ball/events mature. If a Python offline adapter is later added, pin the exact Kloppy version and preserve the BSD notice/disclaimer in the distribution notices.

## Why not vendor now

The current STABLE priority is a testable club build. Adding a Python package to the browser/runtime path would add deployment weight without improving player tracking, calibration or first-result latency. An offline export adapter can be introduced only when there is a concrete benchmark/import-export need.

## Estimated avoided work / expected impact

- Avoided work: ~1–2 days of designing a bespoke soccer tracking/event interchange schema and later migration glue.
- Expected impact: lower coupling between CAY evidence/runtime objects and future SoccerNet/TrackEval/provider adapters; easier reproducible benchmark exports.
- Runtime performance impact now: none.

## License and dependency boundaries

BSD-3-Clause applies to Kloppy code at the audited revision. It does not relicense datasets loaded through Kloppy, provider data, video, annotations, models, weights, or optional dependencies. Those must be audited separately before use. The PySport name/contributor names must not be used to imply endorsement.

## CAY-specific safety rules retained

Any future adapter must preserve explicit provenance and coverage. Missing/invalid coordinates, calibration, identity or event evidence must remain unavailable rather than being synthesized merely to satisfy an interchange schema. Export normalization must never convert an unsupported CAY metric into an apparently valid value.
