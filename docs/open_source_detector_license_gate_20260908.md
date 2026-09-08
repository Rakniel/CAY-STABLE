# Detector provenance/license gate — 2026-09-08

## Scope
This change hardens the promotion path for external player/ball detector candidates. No detector source code or model weights are imported by this change.

## External projects re-checked

### RF-DETR
- Source: https://github.com/roboflow/rf-detr
- License split observed: Apache-2.0 for the open-source `rfdetr` package and Apache-designated core model weights; RF-DETR Plus / XL / 2XL detection components use PML-1.0.
- CAY status: core Apache candidates remain benchmark-only; Plus/PML variants remain ineligible under the current permissive-only detector policy.
- Modification in CAY: none of RF-DETR source code or weights copied. The local registry now verifies the *actual declared provenance license* through the central detector license guard before a candidate can become promotion-eligible.

### D-FINE
- Source: https://github.com/Peterande/D-FINE
- License: Apache-2.0 for the official implementation.
- CAY status: architecture/model remains benchmark-only until exact weight provenance and representative C.A. Yenne video benchmark are supplied.
- Modification in CAY: no D-FINE code or weights copied.

## Local implementation
- `detector_license_guard_v1.js` v1.1.0 now exposes one central permissive-license allowlist and `inspectLicense()` API.
- Allowed declarations: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, CC0-1.0, Unlicense, and explicit `CAY-INTERNAL`.
- Unknown, missing, proprietary, GPL/AGPL, PML, or mixed/unrecognized license expressions are fail-closed.
- `detector_candidate_registry_v1.js` v1.1.0 reuses that central guard instead of maintaining a second ad-hoc license rule.
- If the central guard is unavailable, detector promotion is blocked with `LICENSE_GUARD_UNAVAILABLE`.
- Existing requirements remain: exact source, license and weight/revision identity + passing `CAY_DETECTOR_BENCHMARK_V1` real-video benchmark.

## What this replaces
Previously, detector promotion rejected explicit GPL/AGPL strings but an unknown or proprietary declaration could still pass after benchmark + structural provenance. The new central gate removes that permissive gap.

## Validation
- `tests/detector_license_guard_nonregression.js`: permissive acceptance + proprietary/unknown/mixed rejection + existing remote AGPL fetch block.
- `tests/detector_candidate_registry_nonregression.js`: benchmark/provenance gates plus GPL, proprietary, unknown and mixed-license rejection.
- Targeted local verification before PR: JavaScript syntax checks + both non-regressions pass 12/12 each.

## Expected impact
- Legal provenance becomes fail-closed before a detector can enter the default CAY-STABLE runtime.
- Prevents accidental promotion of weights with unclear or incompatible terms.
- Reuses one guard instead of duplicating licensing logic across detector subsystems.
- No runtime ML dependency added and no accuracy claim made by this change.
