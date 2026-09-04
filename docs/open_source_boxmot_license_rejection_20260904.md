# BoxMOT audit — 2026-09-04

## Source et version inspectée

- Projet : `mikel-brostrom/boxmot`
- Révision inspectée : `32f324064b5f9a0b32eaa87f991cff39a458a8b5` (2026-09-01)
- Licence déclarée par le dépôt : **AGPL-3.0**
- Périmètre observé : trackers interchangeables incluant notamment ByteTrack, BoT-SORT, StrongSORT/DeepOCSORT/BoostTrack, plomberie ReID, évaluations MOT/SportsMOT et backends Python/C++.

## Décision CAY-STABLE

**REJETÉ pour copie, vendoring ou dépendance runtime.** L'AGPL-3.0 impose des obligations de copyleft réseau qui ne sont pas retenues comme contraintes acceptées pour CAY-STABLE. Aucun code, poids, modèle, configuration ou ressource BoxMOT n'est copié dans le dépôt.

Le projet reste une référence de benchmark uniquement : son architecture confirme l'intérêt de comparer des backends MOT sur les mêmes détections/embeddings et de mesurer HOTA/MOTA/IDF1/ID switches avant promotion. CAY-STABLE possède déjà ses propres contrats `tracking_backend_candidate_registry_v1.js`, `tracking_benchmark_v1.js`, `tracking_trackeval_bundle_v1.js` et `tracking_candidate_promotion_gate_v1.js`; ils doivent être étendus plutôt que remplacés.

## Gain / travail évité

- Gain de conception estimé : **0,5 à 1 jour** grâce à la validation externe du principe « mêmes entrées, trackers interchangeables, même protocole d'évaluation ».
- Travail évité : intégration puis retrait d'une dépendance AGPL incompatible avec la politique actuelle.
- Impact attendu : benchmark BoT-SORT/ByteTrack plus rigoureux sans contaminer le runtime CAY-STABLE par une licence non acceptée.

## Risques / dépendances

- Les chiffres BoxMOT publiés sur MOT17/SportsMOT ne constituent pas une preuve de gain sur les vidéos C.A. Yenne.
- Aucune promotion d'un backend ne doit être faite sans séquences CAY identiques et mesures IDSW/HOTA/IDF1, faux CAY, pertes sur occultations et comportement sous mouvement caméra.
- Dépendance ajoutée : **aucune**.
