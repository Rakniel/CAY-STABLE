# Open-source audit — McByte / Roboflow Trackers

Date: 2026-09-28

## Source and provenance

- Project: `roboflow/trackers`
- Source: https://github.com/roboflow/trackers
- Audited revision: `52610c3ce8eab6d0d2a6beb91e8a1fed9fea34de`
- Component: McByte tracker (`docs/trackers/mcbyte.md` and associated implementation)
- Repository license: Apache-2.0.
- Upstream states that its McByte implementation is a clean-room adaptation of the original McByte work.

Optional mask pipeline dependencies documented upstream:

- Segment Anything (SAM): https://github.com/facebookresearch/segment-anything — Apache-2.0 source license verified on 2026-09-28.
- Cutie: https://github.com/hkchengrex/Cutie — MIT source license verified on 2026-09-28.
- PyTorch/torchvision and model/checkpoint assets remain separate dependency/license surfaces and MUST be audited before any packaged integration. A permissive source-code license does not automatically license every downloaded model weight or dataset.

## Useful technique

McByte keeps a BoT-SORT-style tracking-by-detection backbone and adds two useful association ideas:

1. **Clear-match locking**: an unambiguous track/detection pair is locked before solving the remaining assignment problem. This reduces the candidate matrix and prevents secondary evidence from disturbing an already-clear association.
2. **Mask-conditioned ambiguous association**: only ambiguous/selected low-IoU pairs receive extra evidence from a temporally propagated per-track mask. Upstream uses SAM for mask initialization and Cutie for temporal propagation.

This is attractive for football because crossing players and partial occlusions are a major source of identity switches, while CAY-STABLE already requires persistent player identity and conservative recovery.

## Published upstream benchmark signal

At the audited revision, Roboflow Trackers documents the following default-parameter comparison against its BoT-SORT baseline:

- SportsMOT HOTA: BoT-SORT 73.8 → McByte 76.5.
- SoccerNet HOTA: BoT-SORT 84.5 → McByte 85.0.
- SoccerNet IDF1: BoT-SORT 79.3 → McByte 79.9.

These are upstream benchmark results, **not C.A. Yenne measurements**. They must not be presented as an expected percentage gain on club footage.

## CAY-STABLE decision

Status: **studied / benchmark candidate; not integrated into STABLE runtime**.

No McByte, SAM or Cutie source code or model weights are copied by this audit.

CAY-STABLE already has a confidence cascade, two-stage association, camera-motion evidence, conservative ReID, roster/on-field constraints and exclusion guards. Therefore a direct rewrite or a second parallel tracker would duplicate logic. The preferred acceleration path is:

1. benchmark pinned Roboflow McByte externally behind the existing CAY detection/export boundary;
2. compare it against current STABLE and the already-audited ByteTrack/BoT-SORT candidates using identical detections;
3. measure HOTA/IDF1/ID switches plus CAY-specific false-CAY, yellow-detail, bench/spectator, 11-on-field, camera-cut and re-entry invariants;
4. only if the external backend wins without weakening those invariants, decide whether to keep it as an offline backend or adapt the narrow clear-match/mask-evidence contract into the browser-first architecture.

## What this can replace / avoid

If validated, this avoids designing a bespoke segmentation-assisted identity recovery system from scratch. Estimated engineering work avoided: roughly **3–6 days** for prototype association/mask lifecycle plumbing, excluding model deployment and representative-video validation.

The most immediately reusable *idea* is clear-match locking because it can be evaluated without SAM/Cutie. Mask conditioning is intentionally deferred until representative C.A. Yenne footage demonstrates that ordinary motion/appearance evidence is insufficient.

## Risks and dependency cost

- SAM + Cutie add heavyweight PyTorch/GPU dependencies and checkpoint management, conflicting with the current lightweight browser-first STABLE target if made mandatory.
- Segmentation masks can drift across touching/crossing players; CAY identity must remain fail-closed rather than auto-merge on mask evidence alone.
- Model/checkpoint licenses and redistribution terms require separate audit before packaging.
- Generic SoccerNet/SportsMOT gains do not guarantee gains on C.A. Yenne camera angles, kits, image quality or amateur-football occlusions.
- Any backend must preserve CAY's explicit `INDISPONIBLE` policy and must never bypass bench/spectator/yellow-detail or 11-on-field guards.

## Integration gate

No runtime integration is authorized by this document alone. Promotion requires representative C.A. Yenne benchmark evidence and the existing non-regression suite. External mask evidence, if later accepted, should be treated as additional association evidence rather than an identity authority.