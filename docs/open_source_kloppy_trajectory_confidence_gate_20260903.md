# Kloppy trajectory evidence gate — CAY-STABLE adaptation

- Upstream project: `PySport/kloppy`
- Source: https://github.com/PySport/kloppy
- Upstream status checked: 2026-09-03
- Upstream repository activity: pushed 2026-09-01
- License: BSD-3-Clause
- CAY source concept already used: timestamped football tracking positions with explicit coordinate-system semantics and explicit evidence/coverage rather than implicit image-coordinate claims.
- Code copied: none.
- Runtime dependency added: none.

## Why this follow-up was required

CAY-STABLE already reused its validated per-segment metric projections to expose trajectories, instead of creating a second projection pipeline. The heatmap publication contract had subsequently been hardened so missing calibration confidence fails closed. The nested `trajectory` result, however, could still report `DISPONIBLE` and expose pitch-metre points as soon as any points projected, even when the calibration confidence was missing or below the configured minimum.

That inconsistency violated the CAY rule that terrain metrics and metric visualisations must only be published when the supporting calibration evidence is defensible.

## CAY-STABLE modification

`metric_pitch_heatmap_v1.js` now applies the same explicit calibration-evidence principle to the trajectory contract:

- missing or incomplete calibration confidence => trajectory `INDISPONIBLE`;
- known average calibration confidence below `minCalibrationConfidence` => trajectory `INDISPONIBLE`;
- unavailable trajectories expose no metric `points` and no metric `runs`;
- the reason distinguishes unavailable confidence from insufficient confidence;
- partial metric coverage remains allowed and labelled `PARTIEL` when calibration confidence is complete and sufficient, preserving the useful partial-trajectory behavior;
- camera-cut, unprojectable-point and excessive-gap run splitting remain unchanged;
- no interpolation or invented movement is introduced.

The existing `minCalibrationConfidence` option is reused; no duplicate threshold or new policy layer was added.

## What this replaces

Before this change, trajectory publication was effectively gated by `projected > 0`, while confidence only changed the quality label. After this change, trajectory publication requires actual metric projection plus complete and sufficient calibration confidence.

## Expected/measurable impact

- removes a deterministic path where metric pitch coordinates could be exposed without calibration-confidence proof;
- keeps low-coverage but genuinely supported trajectories available as `PARTIEL`;
- prevents downstream UI, distance/speed work or exports from treating unsupported pitch paths as metric evidence;
- estimated avoided work: about 0.25–0.5 day by extending the existing Kloppy-inspired trajectory contract and existing heatmap confidence gate instead of implementing another metric-validation layer.

## Legal / dependency / product risk

- BSD-3-Clause is compatible with the design-level adaptation used here.
- No Kloppy code, provider, dataset or dependency is vendored.
- No new runtime dependency exists.
- Main product risk is deliberately conservative behavior: an older custom projector that omits confidence will now lose its metric trajectory until it provides explicit confidence. This is intentional fail-closed behavior.
