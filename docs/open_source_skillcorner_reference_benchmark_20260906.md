# SkillCorner Open Data reference benchmark — 2026-09-06

## Source and licence

- Project: `SkillCorner/opendata`
- Upstream revision inspected: `c1e17a0cc3e07e1774b52d929c1a0b85115143fc`
- Licence: MIT (`LICENSE`, copyright SkillCorner 2020)
- Upstream documentation states that the repository contains 10 matches of broadcast tracking data, with player and ball tracking, possession, detected/extrapolated player flags, 10 fps frame timing, pitch coordinates in metres and derived dynamic events.
- Upstream also states an approximate 97% player-identity accuracy and recommends smoothing/control for raw speed or acceleration. The dataset is therefore treated as an external reference benchmark, not infallible ground truth.

## CAY-STABLE adaptation

Added `skillcorner_tracking_benchmark_v1.js` as a small compatibility adapter written specifically for CAY-STABLE. No SkillCorner source code, notebook code or dataset rows are copied into CAY-STABLE.

The adapter converts the documented `player_data` structure into CAY metric-track inputs while preserving period boundaries and the provider's native metre coordinates. Its default policy is deliberately stricter than simply consuming all provider positions:

- `is_detected === true` is usable as observed reference evidence;
- extrapolated positions remain auditable through `referenceX/referenceY` but are converted into explicit metric evidence gaps by default;
- an opt-in `includeExtrapolated` mode exists only for benchmark comparison, never as a CAY observed-proof default;
- duplicate player rows in one frame and malformed coordinates are rejected and counted;
- the documented 10 fps rate is the default when deriving time from frame indices.

This matches the C.A. Yenne requirement that statistics describe what is defensibly observed and that missing evidence reduce coverage instead of silently becoming invented distance.

## What this replaces / work avoided

Before this adapter, the metric pipeline was mainly protected by synthetic fixtures and CAY-specific non-regressions. Using SkillCorner's mature public broadcast-tracking format as an external reference path avoids designing a bespoke real-world benchmark schema and loader before metric calibration work can begin.

Estimated work avoided: **0.5–1.0 engineering day** for reference-format design, detected-vs-extrapolated evidence semantics and metre-coordinate plumbing.

## Expected measurable impact

The non-regression fixture demonstrates the intended evidence accounting: with four 10 fps reference frames where one position is provider-extrapolated, default detected-only mode preserves 3/4 detected coverage, counts the extrapolated point as a gap, measures only the defensible 1 m interval and reports 0.1 s metric evidence over 0.3 s eligible time (coverage 0.3333). Opt-in reference mode can still reconstruct the full 3 m path for comparison.

The next benchmark step is to run selected upstream match slices through this adapter and compare CAY distance/speed/coverage distributions against the provider's tracking reference while keeping detected-only and extrapolated-reference results separate.

## Dependencies and risks

- Runtime dependency added: **none**.
- Dataset vendored into CAY-STABLE: **none**.
- External network requirement for normal CAY analysis: **none**.
- Risk: SkillCorner tracking is not perfect; upstream explicitly documents identity errors and the need for speed/acceleration smoothing. Results must therefore be used as comparative validation evidence, never as absolute truth.
- Risk: upstream data/version changes. Benchmark runs should pin the inspected revision or record the exact source revision used.

## Status

**INTEGRATED — benchmark adapter only.** It does not alter production tracking, detection, ReID, calibration or published CAY metrics by itself.
