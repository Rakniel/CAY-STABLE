# CAY-STABLE detector OSS audit — RF-DETR / RT-DETR family

Date: 2026-09-12

## Goal
Evaluate mature permissively licensed detector families for the future CAY-STABLE player/ball detector benchmark without weakening the current fail-closed detector gate, roster binding, bench/staff exclusion, or `INDISPONIBLE` publication policy.

## RF-DETR
- Source: https://github.com/roboflow/rf-detr
- Upstream state inspected: public repository documentation current on 2026-09-12.
- License boundary: the open-source `rfdetr` package and Apache-designated model weights are Apache-2.0. RF-DETR Plus components and RF-DETR-XL / RF-DETR-2XL are under PML 1.0 and are **not** admitted by this audit.
- Candidate use: offline/native detector producer feeding the existing CAY detector benchmark/artifact contracts; no direct browser dependency is proposed.
- CAY rule: only an exact model artifact explicitly designated Apache-2.0 is admissible. Model filename/version/checksum and upstream license declaration must be recorded separately from the Python package version before any benchmark result can be promoted.
- Expected acceleration: avoids rebuilding a modern detector training/inference stack from scratch; estimated prototype/plumbing work avoided: 1–3 days before dataset-specific fine-tuning work.
- Expected impact: potentially better small/far-player and ball recall than classical/HOG-like baselines, but **no C.A. Yenne accuracy gain is claimed until tested on the existing real-video benchmark including `maxOffPitch` bench/staff guards**.
- Status: **studied / admissible candidate**, not integrated into STABLE runtime.
- Risks/dependencies: Python/PyTorch-style native stack, GPU/CPU performance to measure, model weights must be audited individually, fine-tuning dataset provenance remains separate.

## RT-DETRv4
- Source: https://github.com/RT-DETRs/RT-DETRv4
- Public repository status inspected: ECCV 2026 implementation; repository declares Apache-2.0.
- Candidate use: comparison detector in the same external/offline benchmark lane as RF-DETR.
- CAY rule: code license compatibility does not automatically clear downloaded pretrained weights; every weight artifact still needs explicit provenance/license/version/checksum before use.
- Expected acceleration: mature detector architecture and training recipe can replace bespoke detector architecture work; estimated 1–3 days of prototype work avoided.
- Status: **studied / benchmark candidate only**.
- Risk: newer/less battle-tested in this CAY pipeline than existing tracking/calibration components; runtime cost and small-ball performance must be measured rather than inferred from generic detection benchmarks.

## Decision for CAY-STABLE
1. Keep the browser-first STABLE runtime unchanged.
2. Reuse the existing CAY detector benchmark and promotion gates instead of creating detector-specific publication logic.
3. Admit RF-DETR only through Apache-2.0-designated package/model artifacts; reject Plus/PML artifacts from the permissive lane.
4. Treat RT-DETRv4 as a second Apache-2.0 benchmark candidate, again with separate weight provenance.
5. Require the same real-video frames, same roster/off-pitch labels, same timebase, and same detector output contract for all candidates.
6. Do not promote any candidate on generic COCO/AP claims; promotion requires measurable improvement on C.A. Yenne representative footage with zero regression on empty-pitch and bench/staff leakage guards.

## What this replaces
This audit avoids a future custom detector implementation and prevents accidental mixing of permissive RF-DETR assets with PML-licensed Plus/XL artifacts. It reuses CAY-STABLE's existing detector evaluation path rather than duplicating a detector-specific gate.
