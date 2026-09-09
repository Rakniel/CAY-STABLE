# DataBallPy physical-metric evidence audit — 2026-09-09

## Source

- Project: DataBallPy
- Version reviewed: 0.8.1 (PyPI release 2026-08-11)
- Upstream: https://pypi.org/project/databallpy/0.8.1/
- Documentation reviewed: Covered Distance / tracking preprocessing and velocity-based physical metrics
- License: MIT

## What is reused

No upstream source code, model weights, datasets, or runtime dependency are copied into CAY-STABLE.

The useful design idea is adapted only: physical-load outputs must remain tied to explicit time/velocity evidence. DataBallPy exposes velocity/acceleration preprocessing and covered-distance / speed-zone metrics from tracking data. CAY-STABLE keeps its own stricter optical-video contract: validated pitch projection, calibration confidence, gap rejection, persistent identity, conservative smoothing, a 25 km/h sprint threshold, and at least 1 continuous second before a sprint episode is qualified.

## CAY modification

`player_stats_v1.metricForTrack` already counted sustained sprint episodes but did not emit the `sprintQualifiedSeconds` evidence required by `metric_publication_guard_v1`. This audit fixes that contract gap by accumulating only the duration of episodes that actually reach the existing minimum sprint duration. Sub-threshold fragments, segment cuts, rejected metric pairs and temporal gaps remain excluded/reset.

The publication guard is not relaxed: sprint count and qualified seconds are still published only after common identity/coverage/quality proof plus continuous speed evidence.

## Why adaptation instead of dependency

Adding DataBallPy to the browser/runtime path would introduce Python and dataframe dependencies without improving the existing CAY video-to-metric pipeline. The small evidence-accounting fix is therefore implemented internally while retaining provenance for the external design reference.

## Expected impact

- Before: runtime `sprintCount` could be computed, while `sprintQualifiedSeconds` was absent; the field-scoped publication guard therefore kept sprint metrics unavailable.
- After: sustained sprint episodes emit their defensible qualified duration, allowing the existing guard to publish sprint metrics when all other evidence gates pass.
- No change to distance, average speed, max-speed, calibration, identity, bench/spectator exclusion, or 11-player simultaneous limit.

## License / compliance status

MIT is compatible with the CAY-STABLE allowlist. No DataBallPy code was copied, so there is no bundled notice requirement arising from this adaptation. Provenance is retained here for auditability.

Status: STUDIED + IDEA ADAPTED INTERNALLY; NO RUNTIME DEPENDENCY.
