# CAY-STABLE — politique de licence pour calibration par points terrain (2026-10-13)

## Réutilisation
Composant réutilisé : `CAYDetectorLicenseGuard.inspectLicense`, version interne **1.1.0** (`detector_license_guard_v1.js`).
Source : dépôt CAY-STABLE, branche `main` au commit `8a0e0e0f110f4a7a45443030f24c3c07ab387fbd`.
Fonction : liste positive MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, CC0-1.0, Unlicense, CAY-INTERNAL.
Modifications : les deux portes d'entrée existantes (`pitch_keypoint_artifact_provider_v1.js` et `stable_runtime_tracking_v2.js`) utilisent une décision unique de licence ; le runtime délègue au verdict de l'artefact. Aucun moteur nouveau.
Licence du composant : **interne CAY** ; vérifier la licence globale du dépôt avant redistribution externe. Aucun code ni poids tiers copié.

## Vérification et résultat
Sur cinq répétitions de 12 déclarations de licence : **20 acceptations incorrectes avant / 0 après** (combinaisons propriétaire, inconnue, mixte, CAY-INTERNAL non qualifié).
30 compilations JavaScript des trois modules réussies, 190 assertions ciblées en isolate JS. Test Node dédié ajouté (40 assertions par passage, cinq répétitions).
Les licences inconnues ou composées restent refusées jusqu'à revue explicite. La mention `CAY-INTERNAL` requiert `provenance.kind='internal'` ; cette auto-déclaration n'est pas une preuve juridique externe.
Gain estimé : 0,5 à 1 jour de logique et maintenance évités, **estimation**, pas de mesure chronométrée.

## État
Statut : **intégration proposée pour CI**, pas de validation navigateur ni vidéo réelle. La CI complète doit exécuter le nouveau test avant fusion. Les modèles de calibration et leurs poids nécessitent une vérification de licence indépendante. Aucun changement au logo, à l'identité du club ni aux métriques de terrain.
