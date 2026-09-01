# SoccerTrack v2 BAS benchmark adapter

- Source: `AtomScott/SoccerTrack-v2`
- Source documentation inspected: `docs/format-bas.md` on 2026-09-02.
- Upstream code license: MIT.
- Dataset license: CC BY 4.0. The dataset is not bundled in CAY-STABLE.
- Status: clean-room format adapter integrated for benchmarking; no upstream source code copied.

## Upstream idea reused

SoccerTrack v2 defines a Ball Action Spotting (BAS) contract aligned to SoccerNet conventions: event labels are timestamped per half, use a fixed 12-class taxonomy, and are evaluated at tight/loose temporal tolerances. Its annotation schema deliberately fails on unknown labels and preserves dual events at the same timestamp (for example Shot + Goal).

## CAY-STABLE adaptation

`soccertrack_bas_adapter_v1.js` converts BAS annotations into the flat CAY benchmark event contract and exports only publishable CAY events that map to the supported BAS taxonomy. `SHOT_CANDIDATE`, `A_VERIFIER`/non-publishable events, turnovers and unsupported internal states are intentionally not promoted into BAS ground-truth-like labels.

The adapter prefers SoccerTrack's precise `position` field in milliseconds from the kickoff of the indicated half. It validates `gameTime`, rejects unknown labels loudly, keeps half identity explicit, and never invents an actor/team when absent.

## What this replaces

Without this adapter, each future BAS benchmark import would require bespoke timestamp, label, actor and half conversion before CAY's event metrics could be compared. The adapter centralizes that plumbing once.

## Estimated saved work

Approximately 0.25-0.5 day for the first benchmark import, then additional repeated conversion work avoided for future SoccerTrack/SoccerNet-like BAS evaluations.

## Expected measurable impact

No production accuracy claim is made by this adapter. Its benefit is measurement quality: PASS and future confirmed SHOT/GOAL/CROSS/etc. changes can be compared against a fixed public event taxonomy instead of ad-hoc labels. Tight 1 s and loose 5 s evaluation can be layered on the existing CAY event benchmark without changing runtime event logic.

## Risks / dependencies

- Dataset files remain external and CC BY 4.0 attribution obligations apply if used.
- SoccerTrack BAS time is relative to each half, not a single continuous match clock.
- The adapter is benchmark plumbing only; it does not make unverified CAY events publishable.
- Full SoccerNet mAP scoring should remain an external evaluation step unless its implementation/license is separately audited.