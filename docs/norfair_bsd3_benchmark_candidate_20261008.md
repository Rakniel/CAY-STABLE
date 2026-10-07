# Norfair tracking candidate (2026-10-08)

Source: https://github.com/tryolabs/norfair
Audited upstream: e517b4236f6b67a6ecf342f5df1fccb7788dbc54 (v2.3.0 merge).
License: BSD-3-Clause, verified against upstream LICENSE. Preserve copyright/license/disclaimer and avoid implied endorsement on redistribution.
Status: studied, not imported. No code, model, weight or dataset copied.
Use: optional detector-agnostic tracking + camera-motion transforms, evaluated against existing CAY ByteTrack/BoT-SORT-style browser tracking using identical detections.
Replacement: only a future offline tracker candidate, not CAY roster binding, manual identity confirmation or metric safety guards.
Expected work avoided: 2-4 developer days if an alternative tracker proves useful; no measured CAY gain claimed.
Validation gate: HOTA/IDF1/ID switches, yellow-detail false-CAY, bench/spectators, cuts, re-entry, runtime/memory on representative footage.
Risks: Python/OpenCV optional dependencies, camera motion quality, ReID identity confusion; independent licensing of transitive packages, weights and datasets required.
