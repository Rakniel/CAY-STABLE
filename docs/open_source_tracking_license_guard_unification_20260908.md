# CAY-STABLE — tracking backend licence guard unification (2026-09-08)

## Scope

CAY-STABLE already kept tracker backends such as Roboflow Trackers / ByteTrack / BoT-SORT and CAMELTrack behind benchmark and dependency-audit gates. The tracking candidate registry nevertheless still contained its own small hard-coded runtime licence allowlist.

This change removes that duplicate policy and routes tracking-backend licence decisions through the existing `CAYDetectorLicenseGuard.inspectLicense()` contract. The guard is used as a generic external-runtime licence boundary despite its historical detector-oriented name.

## External provenance retained

- **Roboflow Trackers** — https://github.com/roboflow/trackers — candidate revision recorded by CAY: `2.4.0` — repository licence recorded by CAY: Apache-2.0 — status remains `BENCHMARK_ONLY`.
- **CAMELTrack** — https://github.com/TrackingLaboratory/CAMELTrack — candidate revision recorded by CAY: `46a74bb22a28d2d699b4c5c5e317a26d3b87f1e2` — repository licence recorded by CAY: Apache-2.0 — status remains `BENCHMARK_ONLY`; dependency/model-weight audit is still mandatory.
- **SportsLabKit** — https://github.com/AtomScott/SportsLabKit — GPL-3.0 — remains `REFERENCE_ONLY`; no source is copied into the permissive CAY runtime.
- **SoccerTrack-v2** — https://github.com/AtomScott/SoccerTrack-v2 — CAY records MIT code / CC-BY-4.0 dataset — remains benchmark-data only and is not accepted as a runtime backend licence expression.

No upstream tracker source code or model weights are copied by this change.

## CAY modification

`tracking_backend_candidate_registry_v1.js` v1.3.0 now:

1. resolves the shared licence guard dynamically in the browser and with `require()` in Node tests;
2. fails closed when that guard is unavailable;
3. exposes `runtimeLicenseVerdict()` for auditable rejection reasons;
4. inherits the central allowlist instead of maintaining a second list;
5. preserves the existing benchmark, dependency-audit and persistent-identity promotion gates.

The central current allowlist is therefore the single policy source for detector/tracker runtime candidates: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, CC0-1.0, Unlicense and explicit `CAY-INTERNAL`. Unknown, proprietary, missing or mixed unrecognised licence expressions remain blocked.

## Expected impact

- removes duplicated licence policy and future drift between detector and tracker promotion paths;
- avoids reimplementing licence checks for every new ByteTrack/BoT-SORT/ReID backend candidate;
- keeps real C.A. Yenne video benchmark and persistent-ID improvement mandatory before any optional tracking backend can be promoted.

Estimated work avoided: roughly half a day for each future tracking backend integration that would otherwise need a separate licence gate plus regression coverage.
