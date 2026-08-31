# RF-DETR ONNX adapter audit — 2026-08-31

## Source and license
- Upstream: `roboflow/rf-detr` (develop branch inspected 2026-08-31).
- Relevant upstream file: `src/rfdetr/export/_onnx/inference.py`.
- License: Apache License 2.0 for the open-source `rfdetr` package and Apache-designated core weights. RF-DETR XLarge/2XLarge are NOT covered by this approval path and remain excluded unless separately reviewed.
- Upstream ONNX contract inspected: NCHW float input; outputs named `dets` (normalized cx,cy,w,h) and `labels` (per-class logits); per-class confidence uses sigmoid.

## What CAY-STABLE adapted
`rfdetr_onnx_adapter_v1.js` is a clean browser-oriented adaptation of the public ONNX output contract, not a copy of the upstream Python implementation. It:
- recognizes canonical `dets`/`labels` and `pred_boxes`/`pred_logits` names plus conservative shape fallback;
- reads normalized `cxcywh` boxes and maps them to CAY pixel-space `xywh` detections;
- applies sigmoid only to the configured person class;
- preserves CAY's existing detector-neutral `{x,y,w,h,score,class:'person',source}` contract;
- rejects malformed tensors and invalid frame sizes instead of guessing.

The adapter intentionally does NOT download any RF-DETR weights, does NOT enable RF-DETR-XL/2XL, and does NOT replace the production detector yet. Promotion requires a benchmark on representative CAY footage and explicit weight provenance.

## What this replaces / work avoided
Before this adapter, a future RF-DETR experiment would have required embedding model-specific tensor decoding directly in the large HTML runtime or writing a bespoke one-off decoder. The adapter isolates that work behind one tested module.

Estimated work avoided: 0.5–1.5 engineering days for ONNX output discovery, box conversion, defensive output matching, and regression coverage.

## Expected impact
- Immediate runtime metric gain: none claimed; this is an integration accelerator and legal boundary.
- Expected next-step gain: enables side-by-side RF-DETR Nano/Small/Base benchmarks without disturbing ByteTrack/BoT-SORT/ReID/metrics contracts.
- Main technical risk: exact browser preprocessing still has to match the exported checkpoint's expected resize/normalization before quality numbers are trusted.
- Main licensing risk: only Apache-designated RF-DETR core weights are eligible. Plus/PML models remain rejected by default.

## Status
**INTEGRATED AS ADAPTER CONTRACT / MODEL NOT YET PROMOTED.**
