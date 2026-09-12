# SportsLabKit audit for CAY-STABLE

## Provenance
- Project: `AtomScott/SportsLabKit`
- Source: https://github.com/AtomScott/SportsLabKit
- Upstream revision inspected: `9591d6db9e8de20e6a458ba24a45ac58d23d1358`
- Upstream version at that revision: `0.3.2a10`
- License reported by GitHub: GPL-3.0
- Inspection date: 2026-08-31

## Why it is technically relevant
SportsLabKit is a sports-video analytics toolkit with multi-object tracking abstractions, detector/ReID pluggability, camera/pitch calibration and structured tracking-data wrappers. Its architecture overlaps directly with several CAY-STABLE goals: persistent player tracking, ReID experiments, image-to-pitch mapping and reusable evaluation/data plumbing.

## Decision for CAY-STABLE
**Status: REJECTED FOR CODE INTEGRATION / REFERENCE ONLY.**

CAY-STABLE does not currently accept GPL-3.0 copyleft obligations for its runtime. Therefore no SportsLabKit source code is copied, vendored, translated line-for-line, imported as a mandatory dependency or linked into the current application.

The project may still be used as a high-level architecture/benchmark reference. Any independently implemented CAY logic must remain based on CAY requirements and public algorithmic ideas rather than copying SportsLabKit implementation details.

## What it would otherwise replace or accelerate
If licensing policy changed, its abstractions could reduce bespoke work around:
- tracker backend swapping and evaluation;
- detector/ReID interface plumbing;
- camera/pitch calibration experiments;
- conversion of tracking results into analysis-friendly tabular structures.

Estimated engineering work potentially avoided by a compatible equivalent: roughly 1-3 days of integration/plumbing, excluding model training and CAY-specific validation.

## Expected impact if an equivalent compatible component is found
- faster ByteTrack/BoT-SORT/ReID benchmark iteration;
- less duplicate data-adapter code;
- cleaner image-to-pitch analysis interfaces;
- easier reproducible before/after measurement.

No runtime performance or tracking-quality gain is claimed from this audit itself.

## Risks and dependencies
- GPL-3.0 is intentionally incompatible with the current CAY-STABLE reuse policy for runtime incorporation;
- the inspected upstream develop revision dates from 2023-12-19 despite recent repository activity metadata, so maturity must not be inferred from repository update timestamps alone;
- typical detector/ReID stacks can introduce Python, PyTorch, model-weight and GPU dependencies whose licenses must be audited independently;
- generic sports abstractions do not replace CAY invariants: maximum 11 simultaneous CAY players, roster >11, active-kit/yellow-detail rejection, bench/spectator exclusion, explicit coverage and `INDISPONIBLE` publication rules.

## CAY modification record
No external code, model, dataset or dependency was added. This file records provenance, license, inspected version/revision, rejected integration scope and the architectural value retained as a non-code reference.
