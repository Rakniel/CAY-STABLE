# Football-PitchVision open-source audit

- Source: https://github.com/DesusLove/Football-PitchVision
- Audited revision: `46afc3f626df106e112023500b9a3329936ebbf3`
- Repository code license: MIT (`LICENSE`, copyright 2026 Kunta Solomon Dongo).
- Status: studied; design/benchmark reference only. No upstream source, model weights, datasets, or configuration copied into CAY-STABLE.

## Useful reusable boundary

The upstream `sports/common/view.py` keeps pitch projection behind a very small `ViewTransformer`: validate 2D source/target correspondence shapes, compute a homography, fail when it cannot be computed, and expose point/image projection through that transform.

CAY-STABLE already has the stronger equivalent boundary in `metric_homography_projector_v1.js` and `metric_segment_registry_v1.js`, including independent validation, robust consensus, per-camera-segment isolation, out-of-pitch rejection and `INDISPONIBLE`. Therefore importing the upstream implementation would duplicate logic and weaken CAY's safety contract.

The useful acceleration is architectural: keep detector/tracker/team classification completely upstream from the canonical metric projector. Any future Python/native detector or tracker should emit image observations; only the validated CAY metric projector may turn them into pitch metres. Trajectories, heatmaps, distance, speed and later ball events must consume that same canonical metric stream rather than each implementing their own homography.

## Dependency/license boundary

The repository license is MIT, but its README identifies YOLOv8/Ultralytics and Supervision-based components. Third-party libraries, downloaded weights and datasets must be audited independently before integration. Repository MIT licensing is not treated as relicensing those dependencies or weights.

No Ultralytics code/weights are imported by this audit. CAY's browser-first STABLE runtime gains no new mandatory dependency.

## What this replaces / avoids

This avoids separate homography implementations inside future trajectory, heatmap, speed/distance, detector or ball modules. Those consumers should extend the existing canonical metric artifact/segment contracts instead.

Estimated engineering avoided: 0.5–1 day of duplicate projection plumbing plus future divergence debugging.

## Expected measurable impact

No accuracy gain is claimed from documentation alone. The architectural acceptance criteria are measurable:

1. identical accepted metric sample set for trajectories, heatmaps and physical statistics;
2. zero metric sample crossing a camera-segment boundary;
3. zero image-coordinate fallback when calibration is unavailable;
4. rejected/invalid calibration yields `INDISPONIBLE` for all metric consumers;
5. future external producers can be swapped without changing the metric consumers.

## Integration decision

**Studied / architecture confirmed / runtime import rejected as redundant.**

Risk: a future adapter could accidentally bypass the canonical projector for convenience. Non-regression coverage should continue asserting that every metric consumer derives from validated pitch-metre observations only.
