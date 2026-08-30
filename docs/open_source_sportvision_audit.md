# SportVision 0.3.1 open-source assessment

## Upstream
- Project: `MohibShaikh/sportvision`
- Inspected version: `0.3.1`
- Inspected commit: `ba96e1a3b82a95777bb7068594a69f0b866c47c1` (2026-08-27)
- Repository license: Apache-2.0
- No upstream source code is copied into CAY-STABLE by this assessment.

## Relevant capabilities
SportVision combines generic detector inputs, ByteTrack-backed tracking, jersey-colour team classification, image-to-field homography, possession, speed, distance, heatmaps and video annotation. The value for CAY-STABLE is primarily as an integration/benchmark reference because most individual primitives already exist locally behind stricter CAY quality guards.

## What CAY-STABLE can reuse safely
### Integration pattern — studied
The upstream pipeline confirms that detector -> tracker -> team assignment -> homography -> physical metrics -> heatmap is a practical minimal end-to-end chain. CAY-STABLE already owns these stages separately; the useful reuse is the orchestration idea, not duplicate implementations.

Expected work avoided: roughly 0.5 day when wiring the first real-footage end-to-end benchmark, because stage ordering and benchmark outputs are already clear.

Expected impact: faster diagnosis of where real-video quality is lost (detection, identity continuity, calibration coverage or publication guard) without weakening `INDISPONIBLE` semantics.

### Detector abstraction — candidate reference
SportVision advertises detector-agnostic COCO-compatible inputs. CAY-STABLE should preserve the same architectural property: the stable contracts for tracks/ball/metrics must not depend on one detector vendor or model family.

Status: studied only. No runtime dependency added.

## Why the package is not imported wholesale
CAY-STABLE is browser-first and deliberately keeps heavy Python/OpenCV inference optional. SportVision 0.3.1 requires Python >=3.10 and declares runtime dependencies including NumPy, OpenCV, Supervision, `trackers`, scikit-learn and Pydantic; optional inference paths add Roboflow Inference and RF-DETR. Making this mandatory would materially increase installation and deployment complexity for a club-facing STABLE build.

CAY-STABLE also applies stricter domain rules than the generic upstream pipeline: 11 CAY players maximum simultaneously, bench/spectator exclusion, explicit multi-plan calibration isolation, conservative ReID/manual merge rules, metric coverage thresholds and `INDISPONIBLE` whenever evidence is insufficient.

## License / dependency assessment
Apache-2.0 is compatible with CAY-STABLE's reuse-first policy, provided attribution and redistribution requirements are respected if code is ever copied or modified. This audit does not copy code, so no NOTICE payload is added now.

Transitive dependencies must still be audited individually before any wholesale package integration. The repository license alone is not sufficient evidence that every optional model, weight, dataset or hosted inference service carries identical redistribution rights.

## Decision
- Overall status: **STUDIED / BENCHMARK REFERENCE**
- Code copied: **none**
- Mandatory dependency added: **none**
- Immediate use: guide the end-to-end real-footage benchmark and preserve detector-independent contracts.
- Future promotion to integration: only if representative C.A. Yenne footage shows a measurable quality or setup-time gain that outweighs the Python dependency cost.
