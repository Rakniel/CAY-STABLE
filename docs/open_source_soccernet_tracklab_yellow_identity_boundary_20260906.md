# OSS audit — SoccerNet / TrackLab identity evidence boundary (2026-09-06)

## Goal

Harden CAY-STABLE against false positive C.A. Yenne identities caused by decorative yellow details while preserving the existing tracking pipeline when no yellow-only provenance is asserted.

## Sources inspected

### SoccerNet `sn-gamestate`

- Repository: `SoccerNet/sn-gamestate`
- License observed on `main`: **GPL-3.0**
- Status for CAY-STABLE code reuse: **REJECTED**
- Reason: CAY-STABLE does not import, copy, translate, or derive code from this GPL-3.0 implementation. The project remains useful only as an external benchmark/reference for game-state recognition and the importance of not publishing uncertain identity attributes.
- Modification copied: **none**
- Dependency added: **none**

### TrackingLaboratory `tracklab`

- Repository: `TrackingLaboratory/tracklab`
- Revision inspected: `5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2`
- Upstream version at that revision: **1.3.24**
- License: **MIT**
- Status: **studied / legally compatible**, no code copied in this change
- Reused idea: keep tracking mechanics separable from higher-level identity/team attributes so uncertain semantic evidence can be rejected without destroying track continuity.
- Modification copied: **none**
- Dependency added: **none**

## CAY-STABLE adaptation

The existing `team_opponent_evidence_veto_v1.js` was extended rather than adding a parallel classifier. Positive CAY evidence is now rejected when its explicit evidence provenance is exclusively yellow/`jaune` detail sources. A mixed evidence set containing an independent non-yellow source is not rejected by this specific guard.

This is deliberately conservative and backward compatible:

- no global requirement for new metadata was introduced;
- detections without explicit yellow-only provenance keep the existing behavior;
- yellow-only evidence can never positively establish CAY identity;
- strong opponent evidence keeps its existing multi-source threshold and goalkeeper conflict policy;
- the guard exposes an auditable reason: `yellow_detail_cannot_prove_cay`.

## Expected impact

- False-CAY risk from yellow accents: reduced at the semantic team-evidence boundary.
- Runtime dependency cost: zero.
- Estimated work avoided versus introducing a second team classifier: roughly **0.25–0.5 day**.
- Regression risk: low; the new veto only activates when CAY evidence is explicit and all declared positive evidence sources are yellow-specific, or the existing explicit yellow-only flags are present.

## Validation required before merge

- JavaScript syntax guard.
- Full CAY STABLE integration/non-regression suite.
- Calibration V2 integration suite.
- New `team_opponent_evidence_veto_nonregression.js` cases must pass.
