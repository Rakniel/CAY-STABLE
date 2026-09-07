# Open-source RF-DETR SoccerNet model provenance — 2026-09-07

## Source audited

- Model: `julianzu9612/RFDETR-Soccernet` on Hugging Face.
- Audited public revision: `7e567611ea77efd3a6144b3a61eced5a8c8df8d7`.
- Model-card licence: **Apache-2.0**.
- Fine-tuned base: RF-DETR Large / COCO pre-trained according to the model card.
- Training dataset declared by the model card: SoccerNet-Tracking 2023.
- Declared classes: `0 ball`, `1 player`, `2 referee`, `3 goalkeeper`.
- Self-reported detection results: mAP@50 0.857, mAP 0.498, mAP@75 0.520; ball precision/recall 0.785/0.712; player precision/recall 0.913/0.897.

The public model page therefore resolves two uncertainties left by the earlier CAY audit: the **model-level licence** and the explicit four-class map are now documented. These values are metadata for candidate evaluation only; CAY does not claim them as measured C.A. Yenne performance.

## CAY decision

Status: **BENCHMARK_READY / NOT RUNTIME DEFAULT**.

This candidate is especially interesting because one detector can expose both person-like classes and the ball, potentially avoiding a second football detector and allowing the existing CAY ball continuity/evidence pipeline to consume observed ball candidates.

However CAY still refuses runtime promotion until all of the following are true:

1. the exact local/exported weight used in the browser has a concrete `weightId` or `sha256`;
2. the browser export contract is verified against the existing RF-DETR ONNX adapter/runtime;
3. the export report references the exact same weight id as the provenance record;
4. the locked real-video `CAY_DETECTOR_BENCHMARK_V1` passes;
5. no later licence/provenance audit exposes incompatible obligations.

`detector_candidate_registry_v1.js` now encodes this extra browser-export gate for this candidate. A passing real-video report and an Apache-2.0 string alone are no longer sufficient to promote it.

## Reuse / modifications

- External source code copied: **none**.
- External model/weight bundled: **none**.
- New runtime dependency: **none**.
- Reused CAY modules: existing `rfdetr_onnx_adapter_v1.js`, `rfdetr_onnx_runtime_v1.js`, `detector_candidate_registry_v1.js`, existing ball continuity/evidence chain.
- CAY files modified: `detector_candidate_registry_v1.js`, `tests/detector_candidate_registry_nonregression.js`.
- This audit file records provenance/version/licence and promotion requirements.

## Expected gain

If the exact browser export later validates on the locked C.A. Yenne video benchmark, this can replace the rejected legacy YOLO path for player/goalkeeper/referee detection **and** provide the missing ball observations from the same inference pass. That could avoid approximately **1–2 engineering days** of integrating and maintaining a separate ball detector plus duplicated preprocessing/runtime plumbing.

No measured CAY accuracy gain is claimed yet. The immediate measurable gain of this change is governance: the candidate advances from ambiguous `Apache-2.0-declared / unknown class map` to a pinned, test-gated benchmark candidate while remaining impossible to enable silently.

## Risks / dependencies

- The published model is large (~1.46 GB according to the model card), so browser memory, load time and CPU/WASM latency may make this exact Large checkpoint unsuitable for STABLE even if accuracy is good.
- The public results are self-reported on professional broadcast footage; amateur C.A. Yenne footage may generalize differently.
- The model page documents the training checkpoint, not a CAY-tested ONNX browser export. Conversion correctness must be verified separately.
- Ball recall must be measured on the CAY benchmark before possession/pass logic is enabled.
