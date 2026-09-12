# OSS calibration candidates — audit 2026-09-12

## Goal

Accelerate CAY-STABLE automatic/multi-plan calibration without weakening the current fail-closed metric trajectory chain or importing code with unclear/incompatible licensing.

## Candidate 1 — OpenCV 5.0.0

- Project: `opencv/opencv`
- Source: https://github.com/opencv/opencv
- Release: `5.0.0`
- Release date: 2026-06-06
- Release tag object: `9e2ede9628a55ec2742a1b180d3e69b0322281b9`
- Pinned release commit: `40738fb16ceddb5fb3fea747585f7ce6abb0605b`
- License: Apache-2.0
- Useful mature capabilities: homography estimation, RANSAC/robust estimation, camera calibration, distortion handling and geometric transforms.
- CAY use in this change: admission/provenance contract only. No OpenCV source is copied and no native dependency is added to the browser build.

### Why useful

OpenCV is a mature permissive foundation for a future optional offline calibration backend. It can replace custom native implementations for robust homography/camera-model primitives if benchmark evidence proves a gain on C.A. Yenne footage. The existing JavaScript calibration remains the STABLE default until then.

## Candidate 2 — SoccerNet/sn-calibration

- Project: `SoccerNet/sn-calibration`
- Source: https://github.com/SoccerNet/sn-calibration
- Useful ideas: soccer-pitch line/extremity localization, homography-based calibration, camera parameter decomposition and calibration benchmark methodology.
- Audit finding on 2026-09-12: no root `LICENSE` file was present at the inspected repository endpoint.
- CAY status: **REFERENCE/IDEAS ONLY — CODE REUSE REJECTED UNTIL AN EXPLICIT COMPATIBLE LICENSE IS VERIFIED**.

The repository is technically relevant, but public availability is not a software license. CAY-STABLE therefore does not copy, vendor, link, or adapt implementation fragments from it in this change.

## CAY clean-room integration

`calibration_backend_candidate_v1.js` reuses the existing CAY permissive-license guard instead of creating a second license policy. A calibration backend candidate must declare:

- project and source URL;
- version and immutable revision;
- explicit license accepted by the existing allowlist;
- supported calibration capabilities;
- explicit offline/native runtime boundary;
- separate weight/model license when weights are bundled or optional.

Admission returns only `ELIGIBLE_FOR_BENCHMARK`. It does not make the backend STABLE and explicitly requires real C.A. Yenne calibration plus metric-trajectory validation before any runtime promotion.

## What this replaces / work avoided

This replaces future one-off legal/provenance glue for every calibration library and makes the same fail-closed policy reusable for OpenCV-based robust homography, camera-motion and camera-model experiments. Estimated work avoided: about 0.5–1 day per future calibration backend family, plus avoided rework from accidentally prototyping on unlicensed code.

## Expected measurable impact

Immediate impact is procedural and reproducibility-related, not a claimed accuracy gain:

- OpenCV 5.0.0 can enter a controlled benchmark path with exact provenance;
- unlicensed SoccerNet calibration code is blocked before implementation work starts;
- future calibration gains must still preserve CAY metric trajectories and existing `INDISPONIBLE` behavior when evidence is insufficient;
- no browser weight, native library or Python dependency is added by this change.

## Status

- OpenCV 5.0.0: **studied / admissible for benchmark**.
- SoccerNet/sn-calibration code: **studied / rejected for code reuse pending explicit license**.
- Direct calibration runtime integration: **not yet promoted**.
- Code copied from upstream: **none**.
