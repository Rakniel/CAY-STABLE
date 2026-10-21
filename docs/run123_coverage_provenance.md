# RUN123 — Coverage evidence and OSS provenance (2026-10-20)

CAY change: first_results_runtime_guard_bridge_v1.js recalculates observation coverage from attempted, usable and unavailable frame counts. Contradictory or missing counts produce INDISPONIBLE. No external code was copied. Existing strict_tracking_frame_guard_v1.js remains the source of frame counts.

Validation: 306 JavaScript assertions over three passes, including historical tests and new coverage cases. Full CI and real C.A. Yenne video are not yet validated. Estimated reimplementation work avoided: 0.5–1 day, not measured.

Candidate: Roboflow Trackers 2.6.1 — Apache-2.0 — https://github.com/roboflow/trackers . ByteTrack/BoT-SORT and camera-motion compensation may replace a future custom Python tracking engine. Status: STUDIED, NOT INTEGRATED. Its documented tracker implementations do not necessarily include appearance/ReID branches. SoccerNet benchmark detections are ground-truth boxes, not proof of CAY detector accuracy. Risks: Python 3.10+, model weights licensed separately, video benchmark needed.

Optional ReID candidate: FastReID — Apache-2.0 — https://github.com/JDAI-CV/fast-reid . Status: STUDIED, NOT INTEGRATED; no automatic identity merge.

No third-party dependency or model added by RUN123.
