# BroadTrack audit — reference only, no code reuse

Date of CAY audit: 2026-09-03

## Upstream

- Project: `evs-broadcast/BroadTrack`
- Repository: https://github.com/evs-broadcast/BroadTrack
- Revision inspected: `31d4703c9a9ff84eeda36c8667c433a72cdace1f`
- Research context: broadcast football camera calibration/tracking over long clips.

## License finding

The repository does **not** use a permissive OSS license suitable for CAY-STABLE product reuse. Its custom EVS license limits use to personal/internal **non-commercial research**, is non-transferable and non-sublicensable, restricts distribution/copying, and states that derivatives/modifications belong to the licensor and remain restricted to non-commercial internal research.

CAY-STABLE therefore treats BroadTrack as **REJECTED FOR CODE / MODEL / DERIVATIVE REUSE**. No BroadTrack source code, model weights, file structures, UI, derived implementation, or runtime dependency is copied or incorporated.

## What may still be learned safely

Only high-level research observations are retained as benchmark questions for CAY's independently implemented calibration chain:

- camera calibration should be temporally stable over long football sequences, not only locally accurate on isolated frames;
- abrupt camera-state changes should be detected and should invalidate or segment metric evidence rather than silently propagating stale geometry;
- evaluation should include long-clip drift/reprojection stability, not only single-frame fit error.

These are general engineering goals and are already compatible with CAY-STABLE's independent segment registry, camera-motion guards, keyframe freshness/confidence gates and `INDISPONIBLE` fail-closed policy. No implementation detail from BroadTrack is imported.

## CAY decision

- Status: **REJETÉ (runtime/code/models)** / **ÉTUDIÉ (benchmark-level ideas only)**.
- Replaces in CAY-STABLE: nothing; existing independent calibration/GMC code remains authoritative.
- Time/work avoided: prevents a legally unsafe integration and later rewrite/removal effort; estimated 0.5–2 days of integration churn avoided.
- Expected impact: zero runtime dependency and zero license contamination; long-clip calibration robustness remains a measurable test target.
- Risks/dependencies: none added. Future reconsideration requires a new upstream license grant explicitly compatible with CAY-STABLE's intended distribution/use.
