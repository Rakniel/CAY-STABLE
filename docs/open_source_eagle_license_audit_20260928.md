# Eagle football tracking audit — 2026-09-28

- Upstream: https://github.com/nreHieW/Eagle
- Audited revision: `4370f89d72249065ce243e0588180d33e0314ca4` (2026-05-13)
- Upstream license status at audit: **no root `LICENSE` file found and no license declaration found in the README**.
- CAY-STABLE status: **reference-only / source reuse rejected until an explicit compatible license exists**. No Eagle source code or model weights are copied or vendored.

## Useful ideas observed

Eagle is a football-broadcast pipeline that separates detector confidence from tracker feeding, recomputes homography/keypoints at configurable rates, exposes PyTorch/ONNX detector variants, and explicitly warns that physical/ball outputs should be visually checked when evidence is weak. Its documented defaults include a detector confidence around 0.35 with a lower internal tracker floor around 0.15, configurable homography/keypoint recomputation rates, and optional filtering for unstable ball detections.

These are useful benchmark/design references for CAY-STABLE because they reinforce patterns already present in CAY rather than requiring a second pipeline:

1. keep weak detections eligible only for continuity/recovery, never for creating a new CAY identity;
2. decouple expensive absolute calibration cadence from per-frame tracking;
3. make calibration cadence/evidence explicit instead of silently projecting stale geometry;
4. benchmark higher-resolution inference specifically for small-ball recall before accepting its runtime cost;
5. keep ball interpolation/filtering fail-closed and never convert uncertain interpolated pixels into defended possession/pass/shot statistics.

## What this replaces / avoids

No runtime component is replaced by Eagle because the license is not adequate for code reuse. The audit avoids spending time importing or adapting an unlicensed pipeline and provides a concrete benchmark checklist for the existing CAY confidence cascade, calibration-anchor propagation, detector benchmark, and ball-continuity contracts.

## Estimated engineering impact

- Work avoided: roughly 0.5–1 day of duplicate prototyping around detector/tracker thresholds and calibration cadence.
- Expected measurable impact if the ideas validate on C.A. Yenne footage: fewer track breaks from temporarily weak player detections and a better calibration-cost/coverage trade-off, without weakening the `INDISPONIBLE` policy.
- No accuracy gain is claimed until representative C.A. Yenne video benchmarks are run.

## Risks / dependencies

Eagle documents YOLO/BoT-SORT/HRNet/model-weight dependencies whose code and weights have their own license/provenance requirements. Because the repository itself has no explicit reusable license at this audit revision, CAY-STABLE must not copy its implementation even if individual dependencies are permissively licensed. Re-evaluate only if upstream adds an explicit compatible license, and audit every model weight separately before use.
