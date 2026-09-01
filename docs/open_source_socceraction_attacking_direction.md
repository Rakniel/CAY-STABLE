# socceraction / SPADL — attacking-direction normalization

## Upstream provenance
- Project: `ML-KULeuven/socceraction`
- Release inspected: `v1.5.3` (published 2024-08-15)
- Source inspected: `socceraction/spadl/utils.py`, `play_left_to_right`
- License: MIT (`LICENSE.rst` / GitHub repository metadata)
- Code copied into CAY-STABLE: none.

## Useful upstream principle
SPADL normalizes action coordinates so that the executing team can be represented as playing left-to-right. This makes spatial comparisons independent of the original attacking direction.

## CAY-STABLE adaptation
`metric_attacking_direction_v1.js` is a clean-room wrapper around the existing `metric_pitch_heatmap_v1.js`. It does not create another heatmap engine. It transforms only the output of already validated metric projectors before handing it to the existing heatmap/trajectory builder.

CAY policy:
- CAY is normalized to attack left-to-right for comparison views;
- explicit `LEFT_TO_RIGHT` observations remain unchanged;
- explicit `RIGHT_TO_LEFT` observations are mirrored over both pitch axes (`x -> length-x`, `y -> width-y`);
- the original `track.fullPath` is never mutated;
- attacking direction must be supplied explicitly on an observation or by an application resolver (for example, period metadata);
- direction is never inferred from player movement, score, camera view or team shape;
- missing/invalid direction rejects that metric observation, so the existing coverage thresholds can return `INDISPONIBLE` rather than publish a guessed tactical location.

## What this replaces
Without a shared normalization contract, player cards and tactical reports would need separate half-by-half heatmap logic or would compare mirrored tactical locations as if they were different zones. This wrapper reuses the current metric projection, temporal heatmap, trajectory, calibration-confidence and coverage logic instead of duplicating it.

## Expected / measurable impact
- same tactical location observed while CAY attacks opposite directions maps into the same normalized heatmap cell;
- raw metric coordinates and ordinary non-normalized heatmaps remain unchanged;
- no new runtime dependency;
- estimated implementation/plumbing avoided: roughly 0.25–0.5 day;
- expected user impact: simpler player-card comparison across halves and matches once period/direction metadata is connected.

## Risk and dependency boundary
Wrong attacking-direction metadata would mirror valid coordinates incorrectly. CAY therefore never guesses direction and exposes `normalizationRequiresExplicitDirection: true`. The feature depends only on the existing validated pitch projector and `metric_pitch_heatmap_v1.js`. No socceraction Python dependency, model, dataset or third-party asset is bundled.
