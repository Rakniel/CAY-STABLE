# BoT-SORT GMC adaptation provenance

- Upstream project: `NirAharon/BoT-SORT`
- Upstream URL: https://github.com/NirAharon/BoT-SORT
- License: MIT
- Upstream revision inspected: `251985436d6712aaf682aaaf5f71edb4987224bd` (latest commit visible on `main` during the 2026-08-27 review)
- Upstream capability used as a design reference: Global Motion Compensation (GMC) before track/detection association. BoT-SORT supports motion-estimation backends such as OpenCV VideoStab / ORB / ECC; modern implementations also commonly expose sparse optical flow.
- Code reuse status: **no BoT-SORT source code copied** into CAY-STABLE. The mathematical/architectural idea is independently adapted in browser-compatible JavaScript.

## CAY-STABLE adaptation

Local file: `tracking_two_stage_runtime_patch_v1.js`.

The previous CAY implementation compensated only coherent global translation and deliberately rejected zoom. The 2026-08-27 adaptation extends that existing logic instead of introducing a duplicate tracker path:

1. build conservative one-to-one player correspondences from existing appearance evidence;
2. require at least three active on-field tracks and three detections;
3. fit a weighted 2D similarity transform (translation + uniform scale + small rotation) rather than a free affine warp;
4. reject high residuals, unsupported scale/rotation, unconfirmed zoom, large geometry changes and low consensus confidence;
5. transform only the active association state (`x`, `y`, `motionHistory`) into the current camera frame;
6. never rewrite historical `fullPath` evidence, never create an ID, never merge identities and never bypass the 11-player invariant;
7. record model, translation, scale, rotation, support, confidence and residual in `state.lastCameraCompensation`.

A bounded similarity transform was chosen instead of unrestricted affine compensation because football footage often contains pan/zoom while a free affine fit can absorb bad correspondences as shear and create false player motion. Larger camera cuts remain segment breaks rather than being forced through GMC.

## Validation

Targeted non-regression: `tests/camera_motion_consensus_nonregression.js`.

Covered cases: coherent pan, lightweight zoom, transform application, provenance, extreme camera-change rejection and refusal when fewer than three players support the estimate. The implementation keeps backward-compatible `estimateGlobalTranslation` / `applyTranslationToState` wrappers for existing callers.

## Dependency / license impact

No new runtime dependency. No OpenCV, Python, PyTorch or model weights are required. MIT upstream is compatible with CAY-STABLE's current reuse policy; because no upstream code is copied, the local implementation remains an independent adaptation while this document preserves provenance and the design reference.
