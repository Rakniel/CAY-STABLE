# ELASTIC event synchronization open-source assessment

## Upstream
- Project: `hyunsungkim-ds/elastic`
- Purpose: event/tracking synchronization in soccer without requiring manually annotated event locations.
- Inspected commit: `bc41bcdf43451ae639c6ae7b299c1ccd3712d00e` (2025-11-04).
- Repository license: MPL-2.0.
- No upstream source code, model, dataset or runtime dependency is copied into CAY-STABLE by this assessment.

## Relevant capability
ELASTIC uses player/ball tracking evidence to improve temporal alignment of football events. Its useful signals include player-ball distance, ball acceleration and kick distance, and it separates synchronization into kickoff, major pass-like/incoming/set-piece events, receive detection, and minor events such as tackles, fouls, bad touches, take-ons and dispossessions.

## What CAY-STABLE can safely reuse
### Evidence design — studied
The useful idea is to strengthen CAY-STABLE's existing conservative ball-event contract with motion-change evidence around ownership transitions rather than relying only on spatial proximity. In particular, ball acceleration / kick-distance peaks can become optional corroborating evidence for future pass/shot candidate timing.

This does not replace the current CAY rules requiring observable ball coverage, stable ownership, detached-ball observations, metric travel, plan continuity and `INDISPONIBLE` when evidence is insufficient. It complements them.

Estimated design work avoided: roughly 0.5–1 day for event-timing feature selection and failure-mode exploration.

Expected impact: better temporal localization of pass/receive candidates and fewer ambiguous ownership-transition timestamps once reliable ball trajectories are available.

Status: **STUDIED / IDEA ADAPTATION CANDIDATE**.

## License / dependency assessment
MPL-2.0 is file-level copyleft. Directly copying or modifying MPL-covered source files would require preserving MPL obligations for those files. CAY-STABLE therefore does not import or copy ELASTIC code at this stage; only the general published feature ideas and architecture are studied clean-room.

The tutorial also depends on external tracking/event data tooling and datasets whose licenses must be evaluated separately before any redistribution or automated benchmark use.

## Decision
- Code copied: **none**.
- Runtime dependency added: **none**.
- Immediate use: guide future ball event timing benchmarks after the STABLE tracking/coverage/trajectory path is validated on real C.A. Yenne footage.
- Promotion gate: only after measurable improvement on representative CAY footage and a separate dependency/dataset license audit.
