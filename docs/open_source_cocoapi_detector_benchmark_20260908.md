# COCO API detector benchmark seam — 2026-09-08

## Provenance
- Project: `cocodataset/cocoapi`
- Audited revision: `8c9bcc3cf640524c4c20a9c40e89cb6a2f2fa0e9`
- Repository/API license: Simplified BSD (3-clause style)
- Relevant mature function: standard COCO detection annotation/result interchange and COCOeval AP/AR metric vocabulary.

## Legal boundary
CAY-STABLE does **not** vendor or copy `pycocotools`, `cocoeval.py`, C/Cython mask code, COCO images, annotations or datasets. The upstream API code license does not license the COCO dataset itself; every benchmark clip/annotation remains C.A. Yenne-owned or separately provenance-checked.

The CAY implementation is clean-room JavaScript around the public interchange convention and metric names. Official COCOeval remains an external evaluator.

## CAY adaptation
- `detector_coco_interchange_v1.js` exports explicit CAY benchmark frames/boxes/classes to COCO-style JSON.
- Only explicit pixel bboxes are accepted; boxes outside the image are rejected instead of clipped silently.
- Default classes are `person` and `ball`; callers may provide an explicit non-ambiguous category map.
- `detector_cocoeval_gate_v1.js` consumes externally computed AP/AP50/AP75 plus CAY-required `personAP50` and `ballAP50` class reports.
- Baseline/candidate must use the same named evaluation set and complete annotation coverage by default.
- Missing metrics or insufficient annotation coverage return `INDISPONIBLE`; measurable regressions return `REJETE`.

## What this replaces
The existing `detector_benchmark_v1.js` deliberately remains as the fast count/coverage smoke gate. This new seam avoids replacing it or duplicating detection runtime logic; it adds the missing spatial benchmark needed before promoting RF-DETR/D-FINE or later detector candidates.

Estimated avoided work: ~1–2 engineering days for a bespoke IoU/AP evaluator, plus ~0.25–0.5 day per future detector experiment for conversion and acceptance plumbing.

## Expected impact
No detector accuracy gain is claimed by the seam itself. The measurable gain is decision quality: a candidate can no longer be considered better merely because player counts look correct if person/ball localization AP regresses. `ballAP50` is deliberately first-class because the football-event roadmap depends on reliable small-object ball detection.

## Risks / dependencies
- COCOeval execution is external and must be version/revision pinned in benchmark reports.
- Benchmark clips and annotations need their own provenance.
- Class-specific AP extraction must use the exact same IoU/maxDet settings for baseline and candidate.
- This seam does not classify C.A. Yenne vs opponent and must not use yellow garment details for identity/team classification.
