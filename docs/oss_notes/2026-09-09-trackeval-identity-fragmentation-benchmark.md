# TrackEval — identity fragmentation benchmark note

- Source: `JonathonLuiten/TrackEval`
- Reference revision: `12c8791b303e0a0b50f753af204249e622d0281a` (`master`, checked 2026-09-09)
- License: MIT
- Upstream code copied: none
- Upstream dependency added: none
- CAY component affected: `tracking_identity_benchmark_v1.js` diagnostic benchmark only

## Useful mature idea
TrackEval evaluates multi-object tracking with separate association/identity measures instead of treating detection coverage as sufficient. CAY already had a lightweight labelled ID-switch benchmark. This change extends that existing module rather than creating another tracker or importing TrackEval.

## CAY adaptation
The clean-room JavaScript benchmark now measures within-plan tracking fragmentation in addition to direct ID switches. A fragmentation is a labelled player that is tracked, missed, then reacquired inside the same continuity segment. Declared camera/multi-plan boundaries reset this evidence so a new plan cannot fabricate a fragmentation.

A new `compareIdentityStability()` helper performs conservative before/after promotion diagnostics. A candidate only counts as improved when labelled assignment coverage does not decrease, ID switches do not increase, fragmentations do not increase, and at least one of those axes strictly improves. This prevents a tracker from appearing better merely by dropping difficult player observations.

## What this replaces / avoids
It replaces subjective tracker/ReID comparison for this failure mode and avoids introducing a parallel evaluation stack just to compare ByteTrack, BoT-SORT, ReID or future TrackLab producers. Runtime tracking and STABLE publication logic are unchanged.

## Expected impact
- measurable comparison of persistent identity before/after tracker changes;
- explicit fragmentation count and events for occlusion/reacquisition failures;
- fail-closed comparison against coverage trade-offs;
- faster selection of external tracker/ReID candidates on labelled C.A. Yenne clips.

Estimated engineering work avoided: **0.25–0.5 day per tracker/ReID evaluation cycle** versus ad-hoc scoring and manual review.

## Risks / limits
This is intentionally not advertised as HOTA, IDF1 or TrackEval compatibility. It is a compact CAY diagnostic over labelled `gtId/trackId` observations. Reliable conclusions still require representative annotated C.A. Yenne clips, including occlusions, camera cuts and substitutions.

Status: **IDEA ADAPTED / EXISTING CAY BENCHMARK EXTENDED / NO RUNTIME DEPENDENCY**.
