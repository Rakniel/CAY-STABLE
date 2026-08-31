# Detector licence boundary — real-video validation (2026-08-31)

## Why this audit exists
The real-video pass on `Sarcelles vs Aubervilliers U16 R1.mp4` inspected the detector actually selected by the current browser build instead of assuming the model behind the URL was legally reusable.

## Existing remote default — REJECTED
- Source: `lukasiktar11/football-player-detector` on Hugging Face.
- Model used by the current HTML: `best.onnx`.
- Upstream ONNX upload commit inspected: `96797c5e8415888e3d983a79c12a45e8268d0a1b`.
- Reported ONNX SHA-256: `42b55d638a2d0f6253260e026311b4f6f5fbc373ef17eebf7e0e3acbb5b49c2f`.
- Reported size: 38,169,226 bytes.
- Declared upstream licence: **AGPL-3.0**.
- CAY status: **REJECTED_RUNTIME_DEFAULT** under the current CAY-STABLE licence policy.
- Code/model copied into CAY-STABLE by this change: **none**.
- Runtime change: `detector_license_guard_v1.js` blocks that remote source before the native `fetch` is called. A local ONNX file remains possible, but its provenance/licence must be audited independently before it can become a supported CAY detector.
- What this replaces: silent automatic download of a detector whose licence is not accepted as the product default.
- Work avoided: approximately 0.5–1 day of later licence remediation/retesting, plus avoiding accidental dependency of the STABLE benchmark on a detector we could not keep under the intended policy.
- Measurable impact: incompatible remote fetch count must remain exactly 0 in regression tests; tracking quality impact is intentionally 0 until a compatible detector wins the CAY real-video benchmark.
- Risk/dependency: STABLE must not claim football detection is ready merely because a local file can be selected; the selected model needs a documented licence and a real-video accuracy benchmark.

## Candidate replacement — RF-DETR family
- Source: `roboflow/rf-detr`.
- Status: **STUDIED / candidate**, not integrated by this change.
- Licence: Apache-2.0 for the open `rfdetr` package and Apache-designated Nano/Small/Medium/Large weights; XL/2XL detection variants are separately licensed and are not candidates under this entry.
- Potential browser path: ONNX Runtime. A third-party ONNX conversion project (`PierreMarieCurie/rf-detr-onnx`) is MIT and publishes Apache-labelled ONNX model artefacts, but conversion code/artefacts remain a separate provenance item that must be pinned before adoption.
- Expected CAY use: generic person detection baseline feeding the existing CAY field-membership, active-kit, bench/spectator, 11-player and persistent-identity contracts. It would not replace those contracts.
- Estimated work avoided if validated: 1–3 days versus building/training a detector stack from scratch.
- Main risk: the public Apache weights are general object detectors, not a CAY-specific football detector. On the current 640×360 real video, distant players must be benchmarked before promotion.

## Candidate explicitly not promoted — `mobadam/football-player-detection`
- Model card licence displayed: Apache-2.0.
- Base model declared by the model card: Ultralytics YOLO26.
- Upstream Ultralytics YOLO26 licence: AGPL-3.0 / commercial dual licensing.
- CAY status: **REJECTED pending explicit compatible rights**. The top-level fine-tune metadata alone is not sufficient to override the base-model licence boundary for CAY-STABLE.

## Real-video context measured during this audit
- Video: `Sarcelles vs Aubervilliers U16 R1.mp4`.
- Duration: about 1 h 54 min 54 s.
- Resolution: 640×360 at about 29.97 fps.
- Camera behaviour observed: meaningful pans and framing/scale changes during active play.
- Consequence: detector promotion must be measured on this footage together with the existing camera-motion and persistent-ID guards; benchmark-only or clean panoramic footage is insufficient.

## Promotion rule
No detector becomes the default because it is popular or has a permissive label. It must satisfy all of the following:
1. provenance + exact version/artefact recorded;
2. licence chain checked through the base architecture/weights, not only the wrapper repository;
3. no weakening of the `<=11` on-field invariant, bench/spectator exclusion, active-kit evidence or `INDISPONIBLE` policy;
4. real-video comparison on identical frames/evidence;
5. syntax + non-regression + hosted integration CI green before merge.
