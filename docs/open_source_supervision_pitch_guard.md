# Supervision pitch-membership design reference

- Upstream project: Roboflow Supervision
- Source: https://github.com/roboflow/supervision
- License: MIT
- Upstream concept adapted: polygon-zone membership evaluated from a configurable detection anchor; Supervision documents bottom-center as the default triggering anchor for polygon zones.
- CAY-STABLE status: design principle adapted; no Supervision source code copied.
- Local implementation: `pitch_membership_guard_v1.js`.
- CAY use: evaluate the player's ground contact approximation (bottom-center of the bounding box) against the configured pitch polygon before a detection is eligible for on-field tracking. This is intended to reduce bench/spectator contamination compared with using a box centre or overlap alone.
- Safety policy: missing pitch polygon returns `INDISPONIBLE`; low-confidence or invalid boxes are rejected; this guard cannot create, merge or rename player IDs.
- Test: `tests/pitch_membership_guard_nonregression.js` covers in-pitch feet, off-pitch feet, low-confidence rejection, missing geometry and a box whose torso extends outside while its foot anchor remains on the touchline.
- Dependency impact: zero mandatory Python/OpenCV dependency; browser/Node compatible.
- Expected benefit: fewer false on-field CAY/opponent tracks from benches, technical areas and nearby spectators while retaining players whose upper body bounding box crosses a touchline.
