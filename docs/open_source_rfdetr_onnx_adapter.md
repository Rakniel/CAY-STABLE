# RF-DETR ONNX browser path audit — 2026-08-31

## Source and license
- Upstream: `roboflow/rf-detr` (develop branch inspected 2026-08-31).
- Relevant upstream files: `src/rfdetr/export/_onnx/inference.py` and `src/rfdetr/export/main.py`.
- License: Apache License 2.0 for the open-source `rfdetr` package and Apache-designated core weights. RF-DETR XLarge/2XLarge / Plus-PML paths are NOT covered by this approval path and remain excluded unless separately reviewed.
- Upstream ONNX contract inspected: NCHW float input; outputs named `dets` (normalized cx,cy,w,h) and `labels` (per-class logits); confidence uses sigmoid.

## Exact preprocessing now reproduced
Upstream ONNX inference explicitly requires the same preprocessing as `RFDETR.predict()`:
- RGB input;
- square/model-native resize with bilinear half-pixel coordinates;
- `antialias=False` semantics;
- values scaled to [0,1];
- ImageNet mean `[0.485, 0.456, 0.406]` and std `[0.229, 0.224, 0.225]`;
- NCHW float32 tensor.

`rfdetr_onnx_runtime_v1.js` implements this path directly from browser Canvas pixels instead of relying on browser `drawImage` resize, because browser/PIL-style downsampling can apply different antialiasing and shift confidence scores. The runtime reads the exported ONNX input shape from ONNX Runtime Web metadata and refuses unsupported/dynamic contracts rather than guessing.

## CAY adapter/runtime split
`rfdetr_onnx_adapter_v1.js` decodes model outputs into the detector-neutral CAY box contract. It now supports an explicit list of football person-like class IDs, selecting the strongest configured class per query so one RF-DETR query does not become duplicate player boxes.

`rfdetr_onnx_runtime_v1.js` owns preprocessing + ONNX invocation. It has two deliberate modes:
- `benchmark`: permitted for an audited local candidate so real-video quality can be measured;
- `runtime`: blocked unless `detector_candidate_registry_v1.js` receives both a passing `CAY_DETECTOR_BENCHMARK_V1` report and explicit weight provenance.

No class map is guessed. A candidate must provide `personClassIds` explicitly before inference. This is important for football fine-tunes where ball/player/goalkeeper/referee IDs can differ from COCO.

## Promotion gate
`detector_candidate_registry_v1.js` records candidates separately from runtime defaults. Current entries include:
- legacy `lukasiktar11` YOLO source — **REJECTED**, AGPL-3.0;
- RF-DETR core Apache path — **BENCHMARK_ONLY**;
- `julianzu9612/RFDETR-Soccernet` — **BENCHMARK_ONLY**, Apache-2.0 declared pending exact weight/class-map provenance;
- `rudrasinghm/dfine-football-detector` — **BENCHMARK_ONLY**, Apache-2.0 declared pending runtime/weight verification.

A green synthetic test cannot promote a model. Runtime promotion requires the real Sarcelles–Aubervilliers benchmark contract plus source, actual artifact license and an **immutable SHA-256 of the exact weight file that was benchmarked**. A repository revision, mutable model name or informal weight identifier is not sufficient because it does not prove that runtime is loading the same bytes that passed the benchmark. `sha256:<64 hex>` and raw 64-hex SHA-256 forms are normalized to one canonical digest. The normalized digest is returned by the promotion verdict for audit logging. If actual provenance exposes GPL/AGPL, proprietary, unknown or mixed-unknown terms, promotion remains blocked even when the registry entry originally looked permissive.

This checksum requirement is intentionally stronger than ordinary source-version provenance: source revision identifies the implementation, while weight SHA-256 identifies the model artifact. Both should be recorded in release/audit metadata when a candidate is eventually packaged, but only an exact weight checksum can bind a benchmark result to the bytes promoted into STABLE.

## What this replaces / work avoided
Before these modules, an RF-DETR experiment required model-specific preprocessing/decoding embedded inside the large HTML runtime and had no hard boundary between “candidate” and “production default”.

Estimated work avoided: roughly **1.5–3 engineering days** across ONNX contract discovery, exact preprocessing reproduction, multi-class football decoding, provenance gating and regression coverage.

## Expected impact
- Immediate measured detection gain: none claimed until real weights run on the locked 640×360 benchmark.
- Engineering gain: RF-DETR can now be benchmarked without altering ByteTrack/BoT-SORT/ReID/pitch/metric contracts.
- Reproducibility gain: the exact model bytes promoted into runtime must match an immutable SHA-256, preventing a different file behind the same model/revision label from inheriting a passing benchmark.
- Quality protection: wrong preprocessing, unknown class maps, failed benchmark reports, missing exact checksum and incompatible weight licensing all fail closed.

## Status
**BROWSER RUNTIME CONTRACT INTEGRATED FOR BENCHMARKING / NO RF-DETR WEIGHT PROMOTED AS DEFAULT.**
