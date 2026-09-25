# TrackLab dependency-boundary audit

Audit date: 2026-09-26

## Provenance

- Project: TrackingLaboratory/tracklab
- Source: https://github.com/TrackingLaboratory/tracklab
- Audited revision: `5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2`
- Upstream package version at that revision: `1.3.24`
- Repository license: MIT (verified from upstream `LICENSE` at the audited revision).

## Useful scope for CAY-STABLE

TrackLab is a mature modular research/evaluation framework for detection, tracking and ReID. Its architecture is useful for offline comparison because detector, tracker and ReID stages are configurable independently and tracker state can preserve detections, embeddings and identities between runs. This is a strong fit for CAY's bake-off methodology: identical detections can be evaluated through alternate tracking/ReID backends without changing the CAY presentation/statistics contracts.

## Dependency boundary

The MIT license applies to TrackLab's repository code; it does not automatically relicense dependencies, detector/model implementations, weights or datasets.

At audited revision `5767e86...`, TrackLab's mandatory dependency list includes, among others, `ultralytics`, `torch`, `torchvision`, `soccernet`, `sn-trackeval`, `transformers`, `opencv-python` and `wandb`. The setuptools package discovery also includes several tracker plugin namespaces (`bot_sort`, `byte_track`, `strong_sort`, `deep_oc_sort`, `oc_sort`, `bpbreid_strong_sort`). Every backend and every model/weight therefore requires its own provenance/license check before redistribution or production embedding.

Because CAY-STABLE deliberately avoids making a heavy Python/PyTorch stack or a dependency with unresolved/undesired redistribution obligations mandatory, the complete TrackLab distribution is **not accepted as a browser/runtime dependency** at this stage. In particular, the presence of `ultralytics` in the mandatory dependency set means the top-level MIT license alone is not sufficient evidence for a blanket permissive integration decision.

## CAY decision

Status: **accepted as an offline architecture/benchmark reference; rejected as a mandatory STABLE runtime dependency in its current dependency shape**.

No TrackLab source, plugin source, model weights or dataset assets are copied by this audit.

CAY should continue to use its existing detector-neutral artifact boundaries and MOT/TrackEval export contracts. If an offline TrackLab experiment is later run, it must use a pinned environment and a component-by-component license manifest. Results may be imported only as evaluation artifacts; promoting any implementation into CAY requires a separate audit for that exact backend and weights.

## What this avoids

This prevents duplicating TrackLab's experiment-orchestration ideas inside CAY while also avoiding accidental assumption that a permissively licensed orchestration repository makes every transitive backend permissive. Estimated work avoided: roughly 1-3 days of building experiment-state/config plumbing, plus potentially much larger remediation work from an incorrectly bundled dependency.

## Acceptance criteria for future use

1. Pin TrackLab and every selected backend/model revision.
2. Record code, weight and dataset licenses independently.
3. Feed identical CAY detections/evidence into compared trackers where possible.
4. Evaluate HOTA/IDF1/ID switches with the already-audited SoccerNet TrackEval path.
5. Keep CAY-specific gates separate: false CAY from yellow details, bench/spectator exclusion, <=11 simultaneous on-field players, re-entry persistence, cut/multi-plan isolation and explicit coverage.
6. A generic tracking-score gain never overrides a CAY safety/integrity regression.
7. Runtime promotion requires measurable benefit and acceptable deployment cost for the club workflow.
