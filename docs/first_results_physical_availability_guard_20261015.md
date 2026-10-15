# CAY-STABLE — physical availability fail-closed (2026-10-15)

## Source and modification
- Internal source: `first_results_testability_gate_v1.js`, PR #456, parent `b78205c2f059baf85c00485766cc0fe201f9883d`, original blob `218007e4e15d76e31cbf51b68eac55f90033a9b3`.
- Change: recompute five `*Available` flags from canonical physical evidence and complete pitch-visual core, rather than copying stale `firstResults` hints through object spread.
- Scope: no new physical engine, no second identity system, no third-party code or model weights copied. Existing `CAY_FIRST_RESULTS_TESTABILITY_GATE_V1_8` contract remains.
- License: CAY internal code; external license and dependency delta: none.

## Validation before branch commit
- Seven existing JS non-regression suites repeated three times in an isolated V8-compatible harness: **2,088 assertions passed**.
- New cases: five baseline reproductions of stale availability, 20 post-fix checks for stale flags, missing pitch core, partial evidence and roster isolation.
- Syntax: both source and test parsed successfully as JavaScript.
- Microbenchmark, 2,500 alignments × 11 cards, three samples in same V8 environment: baseline 162/157/153 ms, changed 172/172/170 ms. Median overhead 15 ms / 2,500 alignments; not a video throughput measurement.
- Not run: full Node test suite, CI, browser or real-match video. Do not claim STABLE certification.

## Publication invariant
`distanceAvailable`, `avgSpeedAvailable`, `maxSpeedAvailable`, `sprintsAvailable` require `clubEligible`, `pitchVisualCore` and the corresponding current physical proof. `physicalMetricsAvailable` requires at least one such metric. Conflicting/unlinked roster tracks remain unavailable. Unavailable evidence must never be converted to 0 m, 0 km/h or a valid measurement.
