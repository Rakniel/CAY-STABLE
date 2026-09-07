# Open-source audit — MOTChallenge / TrackLab tracking artifact interchange

Date inspected: 2026-09-07

## Sources inspected

- **TrackingLaboratory/tracklab** — revision `5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2`, TrackLab **1.3.24**, MIT. Its MOT/SoccerNet dataset wrappers expose the stable columns `frame`, `track_id`, `person_id`, `bbox_ltwh`, `bbox_conf`, `class`, `visibility`.
- **MOTChallenge result format** — interchange convention only: `<frame>, <id>, <bb_left>, <bb_top>, <bb_width>, <bb_height>, <conf>, <x>, <y>, <z>`. No MOTChallenge source code is copied.
- **FoundationVision/ByteTrack** — MIT design/reference. ByteTrack-compatible exporters can emit MOTChallenge rows without coupling CAY-STABLE to the tracker implementation.
- **NirAharon/BoT-SORT** — MIT design/reference. Same interchange boundary can accept BoT-SORT results while keeping ReID/GMC runtime dependencies outside the browser build.

## Local adaptation

`motchallenge_tracking_artifact_adapter_v1.js` is original CAY-STABLE code. It accepts:

1. canonical MOTChallenge text/rows;
2. TrackLab-like row objects (`frame`, `track_id`, `person_id`, `bbox_ltwh`, `bbox_conf`, optional embedding);
3. an explicit class map controlled by CAY.

It converts boxes to bottom-centre normalized tracking anchors, preserves external track IDs/person IDs, emits a `tracking_v1` artifact descriptor, and exposes freshness-guarded per-time detections that can later feed the existing CAY tracking runtime.

## Safety / licensing guards

- explicit source + licence + revision required;
- explicit weight provenance required by default;
- only permissive MIT / Apache-2.0 / BSD-2-Clause / BSD-3-Clause / ISC / CC0-1.0 accepted;
- GPL/AGPL/custom/unknown licences fail closed;
- no automatic team inference from colours or yellow details; team membership comes only from an explicit class map;
- more than 11 simultaneous CAY players makes the frame `INDISPONIBLE` instead of silently truncating;
- stale frame lookups return `INDISPONIBLE`.

## What this replaces / work avoided

This avoids one bespoke importer per tracker/backend. TrackLab, ByteTrack, BoT-SORT or a future native/offline backend can all export into one stable artifact boundary. Estimated avoided plumbing: **1–2 days per backend**, plus lower regression risk because the CAY identity/metric layers remain unchanged.

## Measured local check

Synthetic import benchmark: 55,000 tracked rows / 5,000 frames converted in ~245 ms on the automation runner (~224k rows/s), with 100% eligibility coverage when exactly 11 CAY slots are present. This is a plumbing/performance check only, not a real-video tracking-accuracy claim.

## Status

**Integrated as an offline/interchange adapter.** It is intentionally not promoted as a default detector/tracker runtime and does not import external Python/PyTorch dependencies or model weights.
