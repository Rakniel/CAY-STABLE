# TrackLab — explicit player identity binding workflow

- Source: https://github.com/TrackingLaboratory/tracklab
- Upstream version inspected: **1.3.24**
- Upstream revision inspected: `5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2` (2026-05-01)
- License: **MIT**
- CAY-STABLE status: **design pattern adapted; no upstream source code copied**.

## Useful upstream principle
TrackLab keeps tracking pipeline state modular and separates tracker/detection/ReID data from higher-level identity and metadata handling. CAY-STABLE applies that separation to the club workflow: a technical track identifier must never silently become a roster identity, shirt number or player name.

## Local adaptation
`player_card_roster_binding_v1.js` remains the validated one-to-one binding contract. `player_identity_binding_session_v1.js` adds the workflow layer needed by the future C.A. Yenne UI:

- receives only tracks that actually exist in the analysis;
- lists eligible roster players without offering a player already claimed by another track;
- requires `confirmed: true` before any assignment;
- rejects unknown tracks and unknown roster players;
- refuses identity stealing when a roster player is already linked to another track;
- permits replacement only with the separate explicit `replaceExisting: true` confirmation;
- exports only bindings accepted by the existing roster-binding guard;
- never infers a name, shirt number or position from a technical track ID.

The session does not modify tracking, ReID or physical metric evidence. Linking a track to a roster player therefore cannot make an otherwise unavailable distance/speed/sprint metric publishable.

## Why adapt instead of import
TrackLab is a Python/PyTorch framework. Importing it solely for this workflow would add a heavy backend dependency and conflict with CAY-STABLE's current browser-first deployment. The useful architectural boundary is small and can be expressed through the existing CAY contracts without copying implementation code.

## Time saved / expected impact
- Estimated implementation/plumbing avoided: **0.5–1 day** compared with creating an independent identity store and duplicating roster validation.
- Expected UX impact: the future coach action can be reduced to `track -> roster player -> confirm`, while retaining a strict audit trail.
- Safety impact: prevents accidental `track 7 = maillot 7` assumptions and silent reassignment of a player's identity.

## Tests
`tests/player_identity_binding_session_nonregression.js` covers explicit confirmation, unknown IDs, candidate filtering, one-to-one conflicts, explicit reassignment and unassignment.

## Dependencies / risks
- No new runtime dependency.
- No TrackLab source code or model weights included.
- A UI still needs to expose the confirmation action; this module deliberately does not fabricate an automatic identity decision.
