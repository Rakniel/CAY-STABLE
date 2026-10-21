# Open-source audit — PathCRF trajectory-only event inference

Date: 2026-09-16

## Source and legal boundary

- Project: `hyunsungkim-ds/pathcrf`
- Source: https://github.com/hyunsungkim-ds/pathcrf
- Upstream description: KDD 2026 implementation of *PathCRF: Ball-Free Soccer Event Detection via Possession Path Inference from Player Trajectories*.
- License reported by GitHub repository metadata at audit time: MPL-2.0.
- Status in CAY-STABLE: **studied / design and benchmark reference only**. No upstream source code, trained checkpoint, synchronized event data or dataset is copied into CAY-STABLE.
- Dataset/model boundary: upstream uses the Sportec Open DFL dataset, kloppy, ELASTIC-synchronized events and ships trained checkpoints. Their rights/provenance are separate from the repository code license and must be audited independently before reuse.

## Useful upstream idea

PathCRF treats possession as a temporally constrained sequence inferred from player trajectories. A fully connected dynamic graph represents candidate possession/player-to-player states; a CRF constrains the sequence so impossible transitions are discouraged/forbidden. Changes in the inferred possession path become candidate on-ball events such as controls/passes.

This is useful to CAY-STABLE because it supplies an **independent event-evidence family that does not require trusting every ball frame**. It is not a replacement for CAY's ball evidence. It can later be benchmarked as a secondary verifier/fallback signal when player trajectories are strong but ball coverage is intermittent.

## CAY adaptation boundary

Do not import PathCRF into the browser runtime at this stage. The current CAY chain already has `ball_event_state_v1.js`, `ball_kick_evidence_v1.js`, `ball_candidate_continuity_v1.js`, `ball_event_evidence_bridge_v1.js` and coverage/fail-closed contracts. Duplicating event logic would violate the extend-not-duplicate rule.

If evaluated later, expose trajectory-only inference through an offline evidence adapter feeding the existing event evidence bridge. The adapter must preserve:

- `INDISPONIBLE` when metric player trajectories are not defensible;
- camera-segment boundaries (no event inference across a cut/plan change);
- roster identity confidence and bench/spectator exclusion;
- no automatic override of explicit ball evidence when the two disagree;
- explicit provenance (`trajectory_model`, revision, license, checkpoint provenance);
- separate coverage for ball-supported and trajectory-only event evidence.

## Acceptance benchmark

Compare the existing CAY event baseline against baseline + trajectory verifier on representative C.A. Yenne clips. At minimum measure:

1. pass/control precision, recall and F1 within explicit timestamp tolerance windows;
2. false events per 10 valid metric minutes;
3. event timing median and p95 absolute error;
4. coverage attributable to direct ball evidence vs trajectory-only evidence;
5. contradictions with high-confidence ball ownership;
6. zero inferred events across camera cuts, invalid calibration intervals, unknown identities, bench/spectator tracks or `INDISPONIBLE` trajectory intervals.

Promotion requires a measurable event-quality gain without increasing false CAY identities or publishing events outside defensible coverage.

## Estimated work avoided

The upstream formulation avoids roughly 1–2 days of designing a trajectory-only possession/event sequence model and, more importantly, provides a mature research baseline against which a lighter CAY-specific verifier can be judged.

## Risks/dependencies

- MPL-2.0 is file-level copyleft; direct source integration would require preserving its obligations for covered files. CAY currently prefers permissive MIT/Apache/BSD direct integrations, so reference/adapter isolation is safer.
- Trained checkpoint rights and training-data rights are not inferred from the repository code license.
- Domain shift from elite tracking data to amateur single-camera C.A. Yenne footage may be substantial.
- Trajectory-only inference must never fabricate confidence when calibration, identity or coverage is weak.
