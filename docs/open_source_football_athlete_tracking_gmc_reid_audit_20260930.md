# Open-source audit — football-athlete-tracking (2026-09-30)

- Source: https://github.com/ShreeshaAnandPujar/football-athlete-tracking
- License: MIT (verified from upstream LICENSE on 2026-09-30).
- Status: studied / benchmark evidence retained; no upstream source code or weights copied.
- Scope: SoccerNet Tracking-2023 football MOT, BoT-SORT, ORB global motion compensation, optional ReID, pitch-metric kinematics and heatmaps.

## Useful measured evidence

Upstream reports a controlled 12-sequence / 9,000-frame SoccerNet Tracking-2023 validation sweep. Its published configurations report HOTA 57.120 without GMC versus 60.109 with ORB GMC, and IDF1 64.275 versus 69.185. The tuned ORB configuration reports 60.618 HOTA, 70.615 IDF1 and 693 ID switches. Its optional ReID configuration reports 59.402 HOTA, 68.911 IDF1 and 815 ID switches.

This does not prove the same deltas on C.A. Yenne footage. It is retained as external evidence that (1) camera-motion compensation deserves priority before physical metrics, and (2) generic appearance ReID can regress football tracking because same-team kits are visually similar.

## CAY-STABLE adaptation

No new parallel tracker is introduced. Existing camera-motion artifact/provider, two-stage tracking and conservative ReID evidence contracts remain the integration points. Benchmark promotion must use identical detections and compare HOTA, IDF1, ID switches, re-entry continuity and CAY-specific false merges. ReID remains secondary evidence and must never auto-merge identities.

For physical metrics, camera compensation must be validated before publishing distance/speed/sprints. Weak or stale motion/calibration evidence remains INDISPONIBLE.

## License/dependency boundary

MIT covers the audited repository code. It does not automatically cover Ultralytics/YOLO code or weights, SoccerNet data, PyTorch assets, third-party checkpoints, or other transitive dependencies. Each must be audited separately before distribution or runtime integration.

## Expected value

Estimated 1–2 days of benchmark design/tuning work avoided by reusing the published ablation ordering (GMC first, ReID only if it wins football-specific association tests). Expected impact is fewer camera-induced identity breaks and less speed inflation; no CAY accuracy claim is made until representative club footage is measured.
