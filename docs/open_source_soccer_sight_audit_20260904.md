# Open-source audit — soccer-sight

- Upstream: `umitkacar/soccer-sight`
- Snapshot inspected: `3a904d4ad1cf88c3dbc34926bb20985e2d441693` (2026-01-03)
- Scope observed: YOLO11 player detection, BoT-SORT tracking, SoccerNet PARSeq jersey OCR, SigLIP/UMAP team classification.
- Repository metadata at inspection time reports no detected license and the root directory contains no `LICENSE` file.
- CAY-STABLE decision: **REJECT source/model integration** until a compatible explicit license is provided. No upstream source, model, weight, dataset or configuration is copied.

## Useful architecture idea retained

The useful clean-room idea is to keep technical track persistence separate from real roster identity and promote a track-to-player association only when explicit identity evidence is sufficiently strong. CAY adapts that idea with stricter fail-closed rules:

- no automatic roster guess from track ID;
- association requires explicit confirmation and confidence >= 0.80;
- non-manual bindings require named evidence;
- one reliable roster player cannot be bound to two reliable tracks simultaneously;
- a reliable binding becomes unavailable outside the player's confirmed participation windows;
- downstream metrics remain `INDISPONIBLE` when identity proof is insufficient.

Implemented in CAY as `track_roster_binding_v1.js`; this is original CAY code and does not reproduce upstream implementation details.

## Estimated acceleration

- Avoided design/rework: ~0.5–1 day for the identity-association contract and failure cases.
- Runtime dependency added: none.
- Licensing risk: zero upstream code copied; main residual risk is future transitive licensing if OCR/model components are evaluated for integration separately.
