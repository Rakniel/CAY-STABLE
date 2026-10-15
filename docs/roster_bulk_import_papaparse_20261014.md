# CAY roster bulk import — provenance (2026-10-14)
- Upstream: https://github.com/mholt/PapaParse
- Version: **5.7.0**, unmodified `papaparse.min.js` from upstream tag 5.7.0.
- License: **MIT**, complete notice at `vendor/PAPAPARSE_LICENSE`.
- CAY adaptations: `club_roster_identity_ui_v1.js`, deferred local loading; atomic roster validation through existing `CAYAppDomainModels.createPlayer/createTeam`; duplicate name+shirt rejection; no implicit lineup or tracking identity binding.
- Test: `tests/club_roster_bulk_import_nonregression.js`, CSV quoted names, semicolons, Excel tabs, invalid positions, duplicate rejection, >11 total roster.
- Replaces: 15 individual add operations with one paste/import; **14 repeated button actions avoided** for a 15-player roster (synthetic comparison, not a measured wall-clock SLA).
- Alternatives: SheetJS Community Edition (Apache-2.0) supports spreadsheets but is heavier than needed; csv-parse (MIT) supports browser CSV, but Papa Parse is a no-dependency browser-first distribution.
- Risks: roster persists in current browser storage (no authenticated backend); static server must serve the local vendor script; import does not assign match lineup and does not assert video identity.
- This is a usability feature only; zero change to the 11-on-pitch limit, manual identity binding, provenance gates or INDISPONIBLE physical metrics.
