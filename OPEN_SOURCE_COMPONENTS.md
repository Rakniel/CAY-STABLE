# Open-source components and design references

CAY-STABLE uses a reuse-first policy: prefer mature, legally compatible building blocks or documented design patterns over rewriting proven tracking/calibration logic. External code is never copied without checking its license and integration cost.

## ByteTrack
- Source: https://github.com/FoundationVision/ByteTrack
- License: MIT
- Status in CAY-STABLE: design pattern adapted, no source code copied.
- CAY use: confidence cascade for tracking. High-confidence detections may initialize tracks; lower-confidence detections are reserved for recovering an already-existing track and must not create new player IDs.
- Local implementation: `tracking_confidence_cascade_v1.js` + `tracking_two_stage_adapter_v1.js`.
- Expected benefit: fewer ID breaks when a player is briefly blurred, partly hidden or poorly detected, without increasing false CAY IDs from weak detections.

## BoT-SORT
- Source: https://github.com/NirAharon/BoT-SORT
- License: MIT
- Upstream concept used: compensate global camera motion before associating tracks and detections. BoT-SORT supports GMC methods such as ORB/ECC/OpenCV VideoStab.
- Status in CAY-STABLE: design principle adapted; no BoT-SORT source code copied.
- Local adaptation: `tracking_two_stage_runtime_patch_v1.js` contains a lightweight browser-first consensus translation estimator. When at least three active players agree on a coherent global displacement and the existing field-geometry signals indicate a pan rather than a zoom/warp, only the track motion state used for association is moved into the current camera coordinate frame. Historical `fullPath` evidence is left untouched.
- Why adapted instead of importing upstream GMC: avoids making Python/OpenCV/PyTorch mandatory for amateur-club use while preserving the useful MOT principle.
- Safety guards: requires >=3-player consensus; rejects strong zoom/geometry changes; caps candidate displacement; records compensation provenance; never creates a new ID by itself.
- Expected benefit: fewer ID switches/breaks during camera pans and lower false player motion caused by camera movement at association time.

## Torchreid / OSNet ReID evidence
- Source: https://github.com/KaiyangZhou/deep-person-reid
- License: MIT (declared by upstream package metadata).
- Status in CAY-STABLE: ReID evidence-fusion pattern adapted; no Torchreid/OSNet source code or model weights copied into the browser runtime.
- Useful upstream pattern: represent appearance as embeddings, compare candidates with cosine similarity, and use multiple observations rather than trusting a single crop.
- Local implementation: `reid_evidence_fusion_v1.js` stores quality-filtered appearance evidence per track, rejects cross-team comparisons, requires multiple samples and a similarity margin, and returns only `A_VERIFIER` suggestions.
- Safety policy: `NEVER_AUTO_MERGE`; ReID evidence cannot silently merge two player identities. Low-quality evidence is dropped and ambiguous candidates remain manual-review only.
- Test: `tests/reid_evidence_fusion_nonregression.js` covers insufficient evidence, team mismatch, ambiguous matches, low-quality rejection and conservative suggestion behavior.
- Runtime integration: module is now in the canonical STABLE HTML dependency order and CI syntax/integration guards.
- Dependency impact: zero mandatory PyTorch/GPU dependency today. A future OSNet/ONNX extractor may feed this contract only if representative football footage demonstrates a measurable gain.
- Expected benefit: preserve player identity across longer occlusions or shot changes without weakening the current manual/segment identity guards.

## TVCalib / SoccerNet camera calibration
- Sources: https://github.com/mm4spa/tvcalib and https://github.com/SoccerNet/sn-calibration
- Licenses: TVCalib MIT; SoccerNet calibration used here as a public research/design reference only.
- Status in CAY-STABLE: calibration architecture/principle adapted; no upstream source code copied.
- CAY use: isolate image-to-pitch homography behind the same validated projector contract already consumed by player statistics.
- Local implementation: `metric_homography_projector_v1.js`.
- Validation policy: four points remain the minimal exact fit. When more than four manual correspondences are available, CAY-STABLE now uses a deterministic robust consensus path to reject isolated bad clicks. At least two independent validation points are still required before the projector becomes consumable by physical metrics. Mean and peak reprojection-error thresholds remain explicit. Degenerate geometry, insufficient consensus, out-of-field projections and unvalidated calibration return `INDISPONIBLE` rather than guessed metres/km/h.
- Dependency impact: zero mandatory Python/OpenCV/PyTorch dependency; implementation is browser/Node compatible.
- Expected benefit: unlock defensible distance, speed and sprint metrics segment-by-segment as soon as a field calibration is independently validated.

## OpenCV robust homography consensus
- Source: https://github.com/opencv/opencv
- Upstream release inspected: OpenCV 4.14.0 (2026-07-19).
- License: Apache-2.0.
- Status in CAY-STABLE: RANSAC-style minimal-hypothesis + inlier-consensus principle adapted; no OpenCV source code copied and OpenCV is not a runtime dependency.
- Local implementation: `metric_homography_projector_v1.js`; provenance detail in `docs/open_source_opencv_robust_homography.md`.
- Replaced behavior: calibration was limited to exactly four fit correspondences, so one inaccurate click could poison the whole plan and redundant landmarks could not be exploited.
- CAY adaptation: for >4 correspondences, test bounded 4-point hypotheses, score all points in pitch metres, require a default 70% inlier consensus within 2 m, expose rejected indices/inlier ratio, and preserve mandatory independent validation before any metric becomes available.
- Test: `tests/robust_homography_consensus_nonregression.js` covers isolated-outlier recovery, 4-point backwards compatibility, majority-bad rejection and degenerate geometry.
- Dependency impact: zero new native/Python dependency.
- Expected benefit: faster and more robust manual multi-plan calibration on club footage without weakening the `INDISPONIBLE` policy.

## soccer-tactical-vision
- Source: https://github.com/rafaelsouza-tech/soccer-tactical-vision
- License: MIT. Upstream explicitly isolates optional GPL/PnLCalib evaluation code from the MIT runtime.
- Status in CAY-STABLE: architecture/design reference adapted; no upstream source code copied.
- Useful upstream pattern: strict separation between calibration, validation, temporal/shot handling and image-to-pitch projection.
- Local adaptation: `metric_segment_registry_v1.js` manages one independently validated projector per CAY tracking segment/shot. A calibration from one camera plan is never silently reused for another plan. Invalidated or rejected segments export no projector, so player statistics return `INDISPONIBLE` for those intervals instead of guessed metres.
- Tests: `tests/metric_segment_registry_nonregression.js` verifies exact per-plan isolation, independent validation rejection, explicit invalidation and export of validated projectors only.
- Runtime integration: both `metric_homography_projector_v1.js` and `metric_segment_registry_v1.js` are now part of the canonical STABLE HTML dependency order and CI syntax/integration guards.
- Expected benefit: safer multi-plan physical metrics and less bespoke architecture work before distance/speed/sprint can be enabled across independently calibrated shots.

## mplsoccer / pitch-coordinate heatmaps
- Source: https://github.com/andrewRowlinson/mplsoccer
- License: MIT.
- Status in CAY-STABLE: football-analytics binning/coordinate principle adapted; no upstream source code copied.
- Supporting calibration reference: SoccerNet camera calibration models the known football pitch and image-to-pitch mapping through homography.
- Problem avoided: a heatmap built directly from normalized image coordinates moves when the camera pans/zooms, so it can misrepresent where the player actually operated on the pitch.
- Local implementation: `metric_pitch_heatmap_v1.js` bins only positions projected into validated pitch-metre coordinates and records metric coverage. It has no silent image-coordinate fallback.
- Safety policy: unvalidated segments, failed projections and out-of-pitch coordinates are rejected; if metric coverage is below the configured threshold the pitch heatmap is `INDISPONIBLE`.
- Test: `tests/metric_pitch_heatmap_nonregression.js` checks calibrated partial coverage, strict coverage rejection, absence of calibration, out-of-pitch rejection and normalized cell totals.
- Runtime integration: module is inserted after metric calibration/segment registry in the canonical STABLE HTML dependency order and is included in CI syntax + test guards.
- Expected benefit: heatmaps become comparable across camera pans and cuts and can later be rendered directly on the C.A. Yenne pitch UI without inventing position data.

## Tryolabs soccer-video-analytics
- Source: https://github.com/tryolabs/soccer-video-analytics
- License: MIT.
- Status: event-state-machine design adapted; upstream source code and toy ball model are not copied.
- Useful ideas: possession and pass counting built on explicit ball detections/ownership association.
- Important limitation: upstream explicitly describes its provided ball model as a toy model that overfits a few videos. CAY-STABLE does not reuse that model as a production detector.
- Local implementation: `ball_event_state_v1.js` separates ball observation/ownership from the detector itself. It works only in validated pitch-metre coordinates, requires ball/player confidence, rejects ambiguous ownership, requires stable ownership before transitions, and computes passes/turnovers only from stable owner changes.
- Safety policy: if valid ball coverage is below the configured threshold, possession, passes, turnovers and event lists are returned as `INDISPONIBLE`/empty rather than extrapolated.
- Test: `tests/ball_event_state_nonregression.js` covers low-confidence ball rejection, ambiguous ownership, same-team pass, opponent turnover and low-coverage suppression.
- Expected benefit: the entire possession/pass event contract can be developed and tested independently from the final ball detector, avoiding duplicated event logic when detector technology changes.

## TrackLab
- Source: https://github.com/TrackingLaboratory/tracklab
- License: MIT
- Status: evaluated / architecture reference and candidate backend.
- Candidate use: modular tracker/ReID interfaces and evaluation methodology.
- Constraint: Python/PyTorch stack is significantly heavier than the current browser-first CAY runtime; do not make it mandatory unless the measurable gain justifies it.

## SoccerNet Game State Reconstruction
- Source: https://github.com/SoccerNet/sn-gamestate
- License: GPL-3.0
- Status: architecture/benchmark reference only for now.
- Useful ideas: end-to-end athlete tracking, ReID, calibration and game-state reconstruction.
- License rule: do not copy GPL-3.0 implementation code into CAY-STABLE unless the project deliberately adopts compatible distribution obligations.

## Rejected / reference-only examples
- `Tony-Luna/soccer-video-analytics`: AGPL-3.0. Useful as a conceptual reference for possession/homography/heatmaps, but not copied or incorporated into the current CAY-STABLE runtime because its copyleft obligations are intentionally avoided at this stage.
- `mikel-brostrom/boxmot`: AGPL-3.0 in its current public repository. Useful for benchmarking tracker/ReID options and hardware trade-offs, but no BoxMOT source code is incorporated into the current CAY-STABLE runtime.

## Integration rules
1. Keep CAY-STABLE branding, data contracts and UX independent from external projects.
2. Document source, license, version/commit when code is actually incorporated.
3. Add non-regression tests for every adapted component.
4. Prefer explicit `INDISPONIBLE` over guessed statistics.
5. External components must not weaken the 11-on-field invariant, bench/spectator exclusion or CAY identity guards.
6. Measure before/after gains on representative football footage before making a heavy dependency mandatory.