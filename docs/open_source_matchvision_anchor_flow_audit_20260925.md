# MatchVision AI — audit anchor absolue + flot optique (2026-09-25)

## Source et licence

- Projet : `BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline`
- Révision auditée : `9876ed6509cc3c6f8dc5241c53d6079d50ac60b9`
- Licence du dépôt racine : MIT (copyright 2026 BlazeWild).
- Frontière importante : le dépôt embarque `external/pnlcalib/` sous **GPL-2.0**. Cette sous-brique, son code et ses poids ne sont donc **pas** importés dans CAY-STABLE.
- Les poids YOLO, datasets et checkpoints restent des artefacts séparés : leur présence dans un dépôt MIT ne suffit pas à établir une licence compatible.

## Fonction/architecture étudiée

Le pipeline documente une calibration absolue périodique (PnLCalib), complétée entre ancres par flot optique gardé. Les mises à jour de flot ne sont acceptées qu'avec cohérence forward/backward, support RANSAC, géométrie terrain plausible, erreur d'alignement des lignes limitée et déplacement inter-frame plausible. Une nouvelle ancre absolue fiable remplace l'état propagé afin de casser la dérive cumulée.

Le dépôt donne un exemple mesuré où l'erreur d'alignement après flot cumulé atteint 43,29 px et retombe à 9,07 px après recalibration absolue. Ce chiffre est propre à leur séquence et ne constitue pas une promesse de performance CAY.

## Comparaison avec CAY-STABLE

CAY possède déjà :

- `camera_motion_artifact_provider_v1.js` : artefact GMC segmenté, provenance/licence obligatoire, âge maximum, projection propagée ;
- `camera_motion_background_evidence_guard_v1.js` : masque fond obligatoire, ratio minimal de points de référence conservés et âge de référence contrôlable ;
- les modules de calibration/homographie et les coupures multi-plans existants.

Il serait donc incorrect de recopier un second moteur. L'idée utile est un **contrat de promotion/re-ancrage** à appliquer au moteur CAY existant : une propagation GMC ne doit jamais devenir une vérité métrique durable ; une ancre absolue validée doit pouvoir la remplacer sans continuité artificielle à travers un cut/plan.

## Adaptation retenue (clean-room)

Aucun code MatchVision/PnLCalib n'est copié. Pour les futurs tests CAY, comparer explicitement :

1. erreur de reprojection/alignement à l'ancre ;
2. dérive juste avant l'ancre suivante ;
3. erreur juste après re-ancrage ;
4. taux de propagations refusées ;
5. distance/vitesse artificielle créée au moment du re-ancrage (doit rester nulle via segmentation/coupure) ;
6. couverture métrique réellement défendable, sans transformer un rejet en donnée inventée.

Critère de promotion : une stratégie anchor+GMC n'est meilleure que si elle réduit la dérive **sans** augmenter faux segments continus, distance fantôme, faux CAY, contamination banc/spectateurs ou couverture non défendable.

## Décision

- Code racine MatchVision : **étudié**, MIT, non copié.
- Pattern « ancre absolue périodique + propagation courte gardée » : **adapté conceptuellement**, déjà largement compatible avec l'architecture CAY existante.
- PnLCalib embarqué : **rejeté pour intégration runtime par défaut** dans CAY-STABLE sous la politique actuelle (GPL-2.0).
- Poids/datasets/checkpoints : **non importés / licence à auditer individuellement**.

## Gain attendu

Travail évité estimé : **1 à 2 jours** de conception d'une stratégie concurrente de compensation/recalibration. Le gain principal est d'orienter les prochains tests vers la dérive mesurée et le re-ancrage plutôt que vers une nouvelle implémentation. Aucun gain runtime n'est revendiqué par ce document seul.
